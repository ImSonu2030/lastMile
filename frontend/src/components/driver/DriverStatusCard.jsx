import React from 'react';

export default function DriverStatusCard({ isOnline, isDriving, location, toggleOnline }) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-100">
        Status:
        <span className={`px-2 py-1 rounded text-sm font-bold ${isOnline ? "bg-green-500/20 text-green-400" : "bg-gray-600 text-gray-300"}`}>
          {isOnline ? (isDriving ? "BUSY" : "ONLINE") : "OFFLINE"}
        </span>
      </h2>

      <div className="space-y-4">
        <div className="p-4 bg-gray-900 rounded border border-gray-600 font-mono text-sm">
          <p className="text-gray-300">📍 X: <span className="text-blue-400">{location.x.toFixed(2)}</span></p>
          <p className="text-gray-300">📍 Y: <span className="text-blue-400">{location.y.toFixed(2)}</span></p>
        </div>

        <button
          onClick={toggleOnline}
          className={`w-full font-bold py-3 rounded-lg transition-colors shadow-lg cursor-pointer
            ${isOnline ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"} text-white`}
        >
          {isOnline ? "Go Offline" : "Go Online"}
        </button>
      </div>
    </div>
  );
}