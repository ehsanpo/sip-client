export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'registered' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  error?: string;
}

export class ConnectionStateManager {
  private state: ConnectionState = { status: 'disconnected' };
  private listeners: ((state: ConnectionState) => void)[] = [];

  getState(): ConnectionState {
    return this.state;
  }

  setState(newState: ConnectionState) {
    this.state = newState;
    this.notifyListeners();
  }

  addListener(listener: (state: ConnectionState) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (state: ConnectionState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }
}