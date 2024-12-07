import React, { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { CallState } from '../types/sip';

interface DialerProps {
  onCall: (destination: string) => void;
  onHangup: () => void;
  onToggleMute: () => void;
  callState: CallState;
}

export function Dialer({ onCall, onHangup, onToggleMute, callState }: DialerProps) {
  const [destination, setDestination] = useState('');

  const handleCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination) {
      onCall(destination);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleCall} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="sip:user@domain.com"
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={callState.isInCall}
          />
          {!callState.isInCall ? (
            <button
              type="submit"
              className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
            >
              <Phone className="w-6 h-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onHangup}
              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}
        </div>
      </form>

      {callState.isInCall && (
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">
            In call with: {callState.remoteParty}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-full ${
                callState.isMuted ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {callState.isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}