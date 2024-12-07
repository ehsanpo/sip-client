import {
  UserAgent,
  SessionState,
  Inviter,
  InviterOptions,
  InviterState,
  Registerer,
  RegistererState,
  Web,
} from "sip.js";
import { createSipConfig, SipConfigOptions } from "./SipConfig";
import { AudioService } from "./AudioService";
import { ConnectionStateManager, ConnectionState } from "./ConnectionState";

export class SipService {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private session: Inviter | null = null;
  private audioService: AudioService;
  private connectionState: ConnectionStateManager;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor() {
    this.audioService = new AudioService();
    this.connectionState = new ConnectionStateManager();
  }

  onConnectionStateChange(listener: (state: ConnectionState) => void) {
    this.connectionState.addListener(listener);
    return () => this.connectionState.removeListener(listener);
  }

  private async handleConnectionError(error: Error) {
    console.error("Connection error:", error);
    this.connectionState.setState({
      status: "error",
      error: error.message,
    });

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return this.connect(
        this.userAgent?.configuration.authorizationUsername || "",
        this.userAgent?.configuration.authorizationPassword || "",
        this.userAgent?.configuration.uri.host || ""
      );
    }

    throw error;
  }

  async connect(username: string, password: string, domain: string) {
    this.connectionState.setState({ status: "connecting" });
    const config: SipConfigOptions = { username, password, domain };

    try {
      // Cleanup any existing connections
      await this.disconnect();

      // Create and configure UserAgent
      this.userAgent = new UserAgent(createSipConfig(config));

      // Set up user agent event handlers
      this.userAgent.transport.onConnect = () => {
        console.log("WebSocket connected");
        this.connectionState.setState({ status: "connected" });
      };

      this.userAgent.transport.onDisconnect = (error) => {
        console.error("WebSocket disconnected:", error);
        this.handleConnectionError(new Error("WebSocket disconnected"));
      };

      await this.userAgent.start();

      // Set up registerer
      this.registerer = new Registerer(this.userAgent, {
        expires: 300,
        refreshFrequency: 90,
      });

      // Set up registerer event handlers
      this.registerer.stateChange.addListener((state: RegistererState) => {
        console.log("Registration state:", state);
        if (state === "Registered") {
          this.connectionState.setState({ status: "registered" });
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful registration
        } else if (state === "Terminated") {
          this.handleConnectionError(new Error("Registration terminated"));
        }
      });

      await this.registerer.register();
      console.log("Successfully registered with SIP server");

      return true;
    } catch (error) {
      return this.handleConnectionError(error);
    }
  }

  async makeCall(destination: string) {
    if (!this.userAgent) {
      throw new Error("Not connected to SIP server");
    }

    const uri = UserAgent.makeURI(`sip:${destination}`);
    console.log("url", uri, destination);

    try {
      const target = uri;
      const inviterOptions: InviterOptions = {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      };

      this.session = new Inviter(this.userAgent, target, inviterOptions);

      // Set up session event handlers
      this.session.stateChange.addListener((state: SessionState) => {
        console.log("Session state:", state);
      });

      // Handle remote audio stream
      if (this.session.sessionDescriptionHandler) {
        const sdh = this.session
          .sessionDescriptionHandler as Web.SessionDescriptionHandler;
        sdh.peerConnectionDelegate = {
          ontrack: (event: RTCTrackEvent) => {
            this.audioService.handleTrack(event);
          },
        };
      }

      await this.session.invite();
      console.log("Call initiated successfully");

      return true;
    } catch (error) {
      console.error("Call failed:", error);
      throw new Error(`Failed to make call: ${error.message}`);
    }
  }

  async hangup() {
    if (!this.session) {
      return;
    }

    try {
      await this.session.terminate();
      this.session = null;
      console.log("Call terminated successfully");
    } catch (error) {
      console.error("Hangup failed:", error);
      throw new Error(`Failed to hang up: ${error.message}`);
    }
  }

  setMuted(muted: boolean) {
    if (!this.session) {
      return;
    }

    try {
      if (this.session.sessionDescriptionHandler) {
        const sdh = this.session
          .sessionDescriptionHandler as Web.SessionDescriptionHandler;
        const pc = sdh.peerConnection;
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "audio") {
            sender.track.enabled = !muted;
          }
        });
        console.log(`Microphone ${muted ? "muted" : "unmuted"}`);
      }
    } catch (error) {
      console.error("Mute operation failed:", error);
      throw new Error(
        `Failed to ${muted ? "mute" : "unmute"}: ${error.message}`
      );
    }
  }

  async disconnect() {
    if (this.session) {
      await this.session.terminate();
      this.session = null;
    }
    if (this.registerer) {
      await this.registerer.unregister();
      this.registerer = null;
    }
    if (this.userAgent) {
      await this.userAgent.stop();
      this.userAgent = null;
    }
    this.audioService.cleanup();
    this.connectionState.setState({ status: "disconnected" });
    console.log("SIP service disconnected");
  }
}
