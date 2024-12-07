export interface SIPCredentials {
  username: string;
  password: string;
  domain?: string;
}

export interface SIPEvent {
  type: 'REGISTER' | 'INVITE' | 'BYE' | 'MESSAGE';
  timestamp: Date;
  from: string;
  to: string;
  content?: string;
}

export interface CallState {
  isInCall: boolean;
  remoteParty?: string;
  duration: number;
  isMuted: boolean;
}