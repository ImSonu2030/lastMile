import React from 'react';

export default function JobCard({ currentRide }) {
  if (!currentRide) return null;

  return (
    <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg mt-4">
      <h3 className="font-bold text-blue-400 mb-2">🚀 Job Assigned!</h3>
      <p className="text-sm text-gray-300">
        Destination: <span className="text-white font-bold">{currentRide.stations?.name || "Unknown"}</span>
      </p>
    </div>
  );
}