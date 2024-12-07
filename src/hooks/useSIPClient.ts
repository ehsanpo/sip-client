import { useState, useCallback, useEffect } from "react";
import { SIPCredentials, SIPEvent, CallState } from "../types/sip";
import { SipService } from "../services/SipService";

export function useSIPClient() {
  const [sipService] = useState(() => new SipService());
  const [isRegistered, setIsRegistered] = useState(false);
  const [credentials, setCredentials] = useState<SIPCredentials | null>(null);
  const [events, setEvents] = useState<SIPEvent[]>([]);
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    duration: 0,
    isMuted: false,
  });

  useEffect(() => {
    return () => {
      sipService.disconnect();
    };
  }, [sipService]);

  const register = useCallback(
    async (creds: SIPCredentials) => {
      setCredentials(creds);
      try {
        const connected = await sipService.connect(
          creds.username,
          creds.password,
          creds.domain || "sip.example.com"
        );

        if (connected) {
          setIsRegistered(true);
          const event: SIPEvent = {
            type: "REGISTER",
            timestamp: new Date(),
            from: creds.username,
            to: creds.domain || "sip.example.com",
          };
          setEvents((prev) => [...prev, event]);
        }
      } catch (error) {
        console.error("Registration failed:", error);
      }
    },
    [sipService]
  );

  const makeCall = useCallback(
    async (destination: string) => {
      if (!isRegistered || !credentials) return;

      try {
        const success = await sipService.makeCall(destination);
        if (success) {
          const event: SIPEvent = {
            type: "INVITE",
            timestamp: new Date(),
            from: credentials.username,
            to: destination,
          };
          setEvents((prev) => [...prev, event]);
          setCallState({
            isInCall: true,
            remoteParty: destination,
            duration: 0,
            isMuted: false,
          });
        }
      } catch (error) {
        console.error("Call failed:", error);
      }
    },
    [isRegistered, credentials, sipService]
  );

  const endCall = useCallback(async () => {
    if (!callState.isInCall || !credentials || !callState.remoteParty) return;

    try {
      await sipService.hangup();
      const event: SIPEvent = {
        type: "BYE",
        timestamp: new Date(),
        from: credentials.username,
        to: callState.remoteParty,
      };
      setEvents((prev) => [...prev, event]);
      setCallState({
        isInCall: false,
        duration: 0,
        isMuted: false,
      });
    } catch (error) {
      console.error("Hangup failed:", error);
    }
  }, [callState, credentials, sipService]);

  const toggleMute = useCallback(() => {
    setCallState((prev) => {
      const newMuted = !prev.isMuted;
      sipService.setMuted(newMuted);
      return {
        ...prev,
        isMuted: newMuted,
      };
    });
  }, [sipService]);

  return {
    isRegistered,
    events,
    callState,
    register,
    makeCall,
    endCall,
    toggleMute,
  };
}
