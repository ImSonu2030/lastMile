import React from 'react';

export default function RideRequestForm({ 
  selectedStation, 
  destination, 
  setDestination, 
  arrivalTime, 
  setArrivalTime, 
  rideStatus, 
  onRequestRide,
  activeDriversCount
}) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="font-bold mb-4 text-gray-100">Request a Ride</h3>
        
        {/* Station Display */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-1">Pickup Station</label>
          <div className={`p-3 rounded text-white border ${selectedStation ? 'bg-gray-700 border-gray-600' : 'bg-red-900/20 border-red-500/50'}`}>
            {selectedStation ? selectedStation.name : "📍 Select a station on the map"}
          </div>
        </div>

        {/* Inputs */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-1">Destination</label>
          <input 
            type="text" 
            className="w-full p-3 bg-gray-700 rounded text-white border border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="e.g. Office, Home"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-1">Arrival Time at Metro</label>
          <input 
            type="time" 
            className="w-full p-3 bg-gray-700 rounded text-white border border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
          />
        </div>

        <button 
          onClick={onRequestRide}
          disabled={!selectedStation || rideStatus === 'searching'}
          className={`w-full font-bold py-3 rounded-lg transition-colors shadow-lg
            ${rideStatus === 'matched' ? 'bg-green-600 hover:bg-green-500 cursor-pointer' : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'}
            disabled:bg-gray-600 disabled:cursor-not-allowed text-white`}
        >
          {rideStatus === 'searching' ? 'Finding Driver...' : 
           rideStatus === 'matched' ? 'Driver on the way!' : 'Request Ride'}
        </button>
      </div>
      
      {/* Stats */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="font-bold mb-2 text-sm text-gray-400">Live Stats</h3>
        <div className="flex justify-between items-center text-gray-100">
          <span>Active Drivers</span>
          <span className="text-xl font-bold text-emerald-400">{activeDriversCount}</span>
        </div>
      </div>
    </div>
  );
}