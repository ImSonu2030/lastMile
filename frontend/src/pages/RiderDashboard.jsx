import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { stationService } from '../api/stationService';
import { matchingService } from '../api/matchingService';
import { useAuth } from '../stores/AuthContext';

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stations, setStations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [rideStatus, setRideStatus] = useState(null); // 'idle', 'searching', 'matched', 'no_drivers'

  useEffect(() => {
    loadStations();
    
    const wsUrl = `${import.meta.env.VITE_DRIVER_SERVICE.replace('http', 'ws')}/ws/riders`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
        try {
            const driversMap = JSON.parse(event.data);
            const driversArray = Object.values(driversMap);
            setDrivers(driversArray);
        } catch (e) {
            console.error("Error parsing driver data", e);
        }
    };

    return () => ws.close();
  }, []);

  const loadStations = async () => {
    try {
      const data = await stationService.getAllStations();
      setStations(data);
    } catch (err) {
      console.error("Failed to load stations", err);
    }
  };

  const handleRequestRide = async () => {
    if (!selectedStation || !user) return;
    
    setRideStatus('searching');
    try {
      const result = await matchingService.requestRide(user.id, selectedStation.id);
      
      if (result.status === 'matched') {
        setRideStatus('matched');
        alert(`Driver Found! Driver ID: ${result.driver_id} is ${result.distance} units away.`);
      } else if (result.status === 'no_drivers') {
        setRideStatus('no_drivers');
        alert("No drivers are currently available.");
      }
    } catch (err) {
      console.error(err);
      setRideStatus('error');
      alert("Failed to request ride.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h1 className="text-2xl font-bold">Rider Dashboard</h1>
          <button onClick={handleLogout} className="text-red-400 border font-bold border-gray-100/20 px-4 py-2 rounded cursor-pointer hover:bg-gray-700 transition-colors duration-200 ">Logout</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">City Map (Live)</h2>
            <div className="relative w-full aspect-square bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle, #4b5563 1px, transparent 1px)', backgroundSize: '10% 10%'}}></div>

              {stations.map((station) => (
                <div
                  key={station.id}
                  onClick={() => setSelectedStation(station)}
                  className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-all group
                    ${selectedStation?.id === station.id ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-blue-500'}`}
                  style={{ left: `${station.x_coordinate}%`, bottom: `${station.y_coordinate}%` }}
                >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap bg-black/70 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {station.name}
                    </span>
                </div>
              ))}

              {drivers.map((driver) => (
                <div
                  key={driver.driver_id}
                  className="absolute text-2xl transition-all duration-1000 ease-linear transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${driver.x_coordinate}%`, bottom: `${driver.y_coordinate}%` }}
                  title={`Driver Status: ${driver.status}`}
                >
                  🚖
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold mb-4">Request a Ride</h3>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Pickup Station</label>
                <div className="p-3 bg-gray-700 rounded text-white border border-gray-600">
                  {selectedStation ? selectedStation.name : "Select a station on map"}
                </div>
              </div>
              <button 
                onClick={handleRequestRide}
                disabled={!selectedStation || rideStatus === 'searching'}
                className={`w-full font-bold py-3 rounded-lg transition-colors shadow-lg
                  ${rideStatus === 'matched' ? 'bg-green-600 hover:bg-green-500 cursor-pointer' : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'}
                  disabled:bg-gray-600 disabled:cursor-not-allowed text-white`}
              >
                {rideStatus === 'searching' ? 'Finding Driver...' : 
                 rideStatus === 'matched' ? 'Driver on the way!' : 'Request Ride'}
              </button>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold mb-2 text-sm text-gray-400">Live Stats</h3>
              <div className="flex justify-between items-center">
                <span>Active Drivers</span>
                <span className="text-xl font-bold text-emerald-400">{drivers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}