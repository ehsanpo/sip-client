import React from 'react';
import { LoginForm } from './components/LoginForm';
import { Dialer } from './components/Dialer';
import { EventLog } from './components/EventLog';
import { useSIPClient } from './hooks/useSIPClient';

function App() {
  const {
    isRegistered,
    events,
    callState,
    register,
    makeCall,
    endCall,
    toggleMute
  } = useSIPClient();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {!isRegistered ? (
            <LoginForm onLogin={register} />
          ) : (
            <>
              <Dialer
                onCall={makeCall}
                onHangup={endCall}
                onToggleMute={toggleMute}
                callState={callState}
              />
              <EventLog events={events} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;