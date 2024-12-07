import { UserAgentOptions, UserAgent } from "sip.js";

export interface SipConfigOptions {
  username: string;
  password: string;
  domain: string;
}

export function createSipConfig(options: SipConfigOptions): UserAgentOptions {
  const { username, password, domain } = options;

  // const transportOptions = {
  //   wsServers: [`wss://${domain}/`], // Remove explicit port, let server decide
  //   traceSip: true,
  //   connectionTimeout: 15, // Increased timeout
  //   maxReconnectionAttempts: 3,
  //   reconnectionTimeout: 4,
  // };
  // const userAgent = new UserAgent({transportOptions});

  const uri = UserAgent.makeURI(`sip:${username}@${domain}`);

  return {
    uri: uri,
    authorizationUsername: username,
    authorizationPassword: password,
    transportOptions: {
      wsServers: [`wss://${domain}/ws`], // Remove explicit port, let server decide
      traceSip: true,
      connectionTimeout: 15, // Increased timeout
      maxReconnectionAttempts: 3,
      reconnectionTimeout: 4,
    },
    sessionDescriptionHandlerFactoryOptions: {
      constraints: {
        audio: true,
        video: false,
      },
      peerConnectionOptions: {
        rtcConfiguration: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
          iceTransportPolicy: "all",
          iceCandidatePoolSize: 0,
        },
      },
    },
    logConfiguration: {
      builtinEnabled: true,
      level: "debug",
    },
    hackViaTcp: true, // Try TCP if UDP fails
    hackIpInContact: true, // Help with NAT traversal
    reliable: "BranchMatch", // More reliable dialog matching
  };
}
