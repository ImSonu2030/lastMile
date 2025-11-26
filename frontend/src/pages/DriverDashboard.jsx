import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { driverService } from '../api/driverService';
import { useAuth } from '../stores/AuthContext';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [isOnline, setIsOnline] = useState(false);
  const [isDriving, setIsDriving] = useState(false);
  const [location, setLocation] = useState({ x: 10, y: 10 }); // Default starting position
  const [currentRide, setCurrentRide] = useState(null);
  
  // Refs
  const intervalRef = useRef(null);
  const pollingRef = useRef(null);

  // 1. POLL FOR RIDES (Only when Online and not already driving)
  useEffect(() => {
    if (!user || !isOnline || isDriving || currentRide) return;

    const checkRide = async () => {
      try {
        const ride = await driverService.getAssignedRide(user.id);
        if (ride) {
          console.log("Ride Assigned!", ride);
          setCurrentRide(ride);
          // Automatically start driving to the pickup
          startDrivingToTarget(ride.stations); 
        }
      } catch (err) {
        console.error("Error checking for rides:", err);
      }
    };

    // Poll every 3 seconds
    pollingRef.current = setInterval(checkRide, 3000);
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, isOnline, isDriving, currentRide]);

  // 2. LOGOUT LOGIC
  const handleLogout = async () => {
    stopSimulation();
    // Mark as offline in DB
    if (user) {
        await driverService.updateLocation(user.id, location.x, location.y, 'offline');
    }
    await supabase.auth.signOut();
    navigate('/login');
  };

  // 3. TOGGLE ONLINE STATUS
  const toggleOnline = async () => {
    if (isOnline) {
        // Going Offline
        setIsOnline(false);
        stopSimulation();
        await driverService.updateLocation(user.id, location.x, location.y, 'offline');
    } else {
        // Going Online
        setIsOnline(true);
        // Send initial location to DB to appear on map
        await driverService.updateLocation(user.id, location.x, location.y, 'available');
    }
  };

  const stopSimulation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsDriving(false);
  };

  // 4. SMART DRIVING LOGIC
  const startDrivingToTarget = (targetStation) => {
    setIsDriving(true);
    
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
        setLocation(prev => {
            // Calculate Distance to Target
            const dx = targetStation.x_coordinate - prev.x;
            const dy = targetStation.y_coordinate - prev.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // PROXIMITY DETECTION (< 2 units)
            if (distance < 2) {
                clearInterval(intervalRef.current);
                setIsDriving(false);
                alert(`ARRIVED at ${targetStation.name}! Waiting for rider...`);
                
                // Keep status as 'busy' or update to 'arrived' if you have that status
                return prev; 
            }

            // Move Towards Target (Vector Math)
            const speed = 2; // Units per second
            const angle = Math.atan2(dy, dx); 
            
            const newX = prev.x + Math.cos(angle) * speed;
            const newY = prev.y + Math.sin(angle) * speed;

            // Update Cloud with new location
            if (user) {
                driverService.updateLocation(user.id, newX, newY, 'busy').catch(console.error);
            }

            return { x: newX, y: newY };
        });
    }, 1000); // Update every 1 second
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚖</span>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
          </div>
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Status: 
              <span className={`px-2 py-1 rounded text-sm font-bold ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-300'}`}>
                {isOnline ? (isDriving ? 'BUSY (DRIVING)' : 'ONLINE (WAITING)') : 'OFFLINE'}
              </span>
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded border border-gray-600 font-mono text-sm">
                <p>📍 Location X: <span className="text-blue-400">{location.x.toFixed(2)}</span></p>
                <p>📍 Location Y: <span className="text-blue-400">{location.y.toFixed(2)}</span></p>
              </div>

              {!currentRide ? (
                <button 
                  onClick={toggleOnline} 
                  className={`w-full font-bold py-3 rounded-lg transition-colors shadow-lg
                    ${isOnline ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'} text-white`}
                >
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
              ) : (
                 <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                    <h3 className="font-bold text-blue-400 mb-2">🚀 Job Assigned!</h3>
                    <p className="text-sm text-gray-300">Picking up at: <span className="text-white font-bold">{currentRide.stations.name}</span></p>
                    <p className="text-xs text-gray-400 mt-1">Driving automatically...</p>
                 </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Simulation Info</h2>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>1. Click <b>"Go Online"</b> to become visible on the map.</li>
              <li>2. Wait for a rider to request a ride from your location.</li>
              <li>3. Once matched, your car will automatically drive to the pickup station.</li>
              <li>4. Proximity detection triggers when distance is &lt; 2 units.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}