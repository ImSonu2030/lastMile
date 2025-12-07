import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { driverService } from '../api/driverService';
import { tripService } from '../api/tripService';
import { useAuth } from '../stores/AuthContext';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isOnline, setIsOnline] = useState(false);
  const [isDriving, setIsDriving] = useState(false);
  const [location, setLocation] = useState({ x: 10, y: 10 }); 
  const [currentRide, setCurrentRide] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  
  const intervalRef = useRef(null);
  const pollingRef = useRef(null);
  const socketRef = useRef(null);

  // WebSocket Connection
  useEffect(() => {
    if (isOnline && user && !socketRef.current) {
        const wsUrl = `${import.meta.env.VITE_DRIVER_SERVICE.replace('http', 'ws')}/ws/driver/${user.id}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Connected to Driver Cloud");
            ws.send(JSON.stringify({ x: location.x, y: location.y, status: 'available' }));
        };
        ws.onclose = () => console.log("Disconnected");
        socketRef.current = ws;
    } else if (!isOnline && socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
    }
    return () => { if (socketRef.current) socketRef.current.close(); };
  }, [isOnline, user]);

  // Check for assigned rides
  useEffect(() => {
    if (!user || !isOnline || isDriving || currentRide || activeTrip) return;

    const checkRide = async () => {
      try {
        const ride = await driverService.getAssignedRide(user.id);
        if (ride) {
          console.log("Ride Assigned!", ride);
          setCurrentRide(ride);
          // Fix: Pass "pickup" type so we know we are driving to the station
          if (ride.stations) {
              startDrivingToTarget(ride.stations, "pickup"); 
          }
        }
      } catch (err) { console.error(err); }
    };
    pollingRef.current = setInterval(checkRide, 3000);
    return () => clearInterval(pollingRef.current);
  }, [user, isOnline, isDriving, currentRide, activeTrip]);

  const handleLogout = async () => {
    stopSimulation();
    if (user) await driverService.updateLocation(user.id, location.x, location.y, 'offline');
    await supabase.auth.signOut();
    navigate('/login');
  };

  const toggleOnline = async () => {
    if (isOnline) {
        setIsOnline(false);
        stopSimulation();
        if (user) await driverService.updateLocation(user.id, location.x, location.y, 'offline');
    } else {
        setIsOnline(true);
        if (user) await driverService.updateLocation(user.id, location.x, location.y, 'available');
    }
  };

  const stopSimulation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsDriving(false);
  };

  // Fix: Added 'type' parameter to distinguish between pickup and dropoff
  const startDrivingToTarget = (target, type) => {
    if (!target) return;
    
    setIsDriving(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
        setLocation(prev => {
            const dx = target.x_coordinate - prev.x;
            const dy = target.y_coordinate - prev.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.5) {
                clearInterval(intervalRef.current);
                setIsDriving(false);
                handleArrival(type, target); // Trigger arrival logic
                return prev; 
            }

            const speed = 0.5; 
            const angle = Math.atan2(dy, dx); 
            const newX = prev.x + Math.cos(angle) * speed;
            const newY = prev.y + Math.sin(angle) * speed;

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ x: newX, y: newY, status: 'busy' }));
            }
            return { x: newX, y: newY };
        });
    }, 50);
  };

  // Fix: New helper to handle logic when driver arrives
  const handleArrival = async (type, target) => {
    if (type === "pickup") {
        alert(`ARRIVED at pickup: ${target.name}! Creating trip...`);
        try {
            // Fix: Correctly call createTrip with the arguments expected by tripService
            const trip = await tripService.createTrip(currentRide.id, user.id, currentRide.rider_id);
            setActiveTrip(trip);
        } catch(e) { 
            console.error("Error creating trip", e); 
            alert("Error creating trip record");
        }
    } else if (type === "dropoff") {
        alert("ARRIVED at Destination! Please complete the trip.");
    }
  };

  const startTrip = async () => {
      if(!activeTrip) return;
      await tripService.startTrip(activeTrip.id);
      
      setActiveTrip({ ...activeTrip, status: 'active' });
      
      // Mock Destination for simulation
      const mockDestination = {
          name: currentRide.destination || "Destination",
          x_coordinate: Math.random() * 90 + 5,
          y_coordinate: Math.random() * 90 + 5
      };
      
      // Start driving to dropoff
      startDrivingToTarget(mockDestination, "dropoff");
  };

  const completeTrip = async () => {
      if(!activeTrip) return;
      await tripService.completeTrip(activeTrip.id);
      alert("Trip Completed Successfully!");
      setActiveTrip(null);
      setCurrentRide(null);
      
      if (user) await driverService.updateLocation(user.id, location.x, location.y, 'available');
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <button onClick={handleLogout} className="text-red-400 border px-4 py-2 rounded hover:bg-gray-700">Logout</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Status: <span className={`px-2 py-1 rounded text-sm font-bold ${isOnline ? 'text-green-400' : 'text-gray-300'}`}>{isOnline ? (currentRide ? 'ON JOB' : 'ONLINE') : 'OFFLINE'}</span>
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded font-mono text-sm">
                <p>📍 X: {location.x.toFixed(2)} | Y: {location.y.toFixed(2)}</p>
              </div>

              {!currentRide ? (
                <button onClick={toggleOnline} className={`w-full font-bold py-3 rounded-lg ${isOnline ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
              ) : (
                 <div className="space-y-4">
                     <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                        <h3 className="font-bold text-blue-400">🚀 Current Job</h3>
                        <p className="text-sm">From: {currentRide.stations?.name}</p>
                        <p className="text-sm">To: {currentRide.destination}</p>
                     </div>

                     {/* Fix: Added Trip Lifecycle Buttons */}
                     {activeTrip?.status === 'scheduled' && !isDriving && (
                         <button onClick={startTrip} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg animate-pulse cursor-pointer">
                             Start Trip (Pickup Rider)
                         </button>
                     )}

                     {activeTrip?.status === 'active' && !isDriving && (
                         <button onClick={completeTrip} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg cursor-pointer">
                             Complete Trip
                         </button>
                     )}
                     
                     {isDriving && <div className="text-center text-yellow-400 font-bold animate-pulse">Driving...</div>}
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}