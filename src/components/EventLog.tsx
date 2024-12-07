import React from 'react';
import { SIPEvent } from '../types/sip';

interface EventLogProps {
  events: SIPEvent[];
}

export function EventLog({ events }: EventLogProps) {
  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">SIP Events</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {events.map((event, index) => (
          <div
            key={index}
            className="p-2 bg-gray-50 rounded border border-gray-200 text-sm"
          >
            <div className="flex justify-between text-gray-600">
              <span>{event.type}</span>
              <span>{event.timestamp.toLocaleTimeString()}</span>
            </div>
            <div className="mt-1">
              <div>From: {event.from}</div>
              <div>To: {event.to}</div>
              {event.content && <div>Content: {event.content}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}