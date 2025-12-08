import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { driverService } from "../api/driverService";
import { useAuth } from "../stores/AuthContext";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isOnline, setIsOnline] = useState(false);
  const [isDriving, setIsDriving] = useState(false);
  // Initialize as null to distinguish between "loading" and "default" state
  const [location, setLocation] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);

  const intervalRef = useRef(null);
  const pollingRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Fetch Last Known Location on Mount
  useEffect(() => {
    if (user) {
      driverService.getDriverLocation(user.id)
        .then((data) => {
          if (data) {
            setLocation({ x: data.x_coordinate, y: data.y_coordinate });
          } else {
            setLocation({ x: 10, y: 10 }); // Default fallback
          }
        })
        .catch((err) => {
          console.error("Failed to load location", err);
          setLocation({ x: 10, y: 10 });
        });
    }
  }, [user]);

  // 2. WebSocket Connection
  useEffect(() => {
    // Only connect if online, user exists, AND location is loaded
    if (isOnline && user && !socketRef.current && location) {
      // FIX: Typo fixed here (added space between const and wsUrl)
      const wsUrl = `${import.meta.env.VITE_DRIVER_SERVICE.replace(
        "http",
        "ws"
      )}/ws/driver/${user.id}`;
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Connected to Driver Cloud");
        // Send current known location immediately
        ws.send(
          JSON.stringify({
            x: location.x,
            y: location.y,
            status: "available",
          })
        );
      };
      ws.onclose = () => console.log("Disconnected from Cloud");
      ws.onerror = (e) => console.error("Websocket error", e);

      socketRef.current = ws;
    } else if (!isOnline && socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [isOnline, user]); 

  // 3. Check for Rides & Start Driving
  useEffect(() => {
    // Guard: Don't check rides if location isn't loaded yet
    if (!user || !isOnline || isDriving || currentRide || !location) return;

    const checkRide = async () => {
      try {
        const ride = await driverService.getAssignedRide(user.id);
        if (ride) {
          console.log("Ride Assigned!", ride);
          setCurrentRide(ride);

          if (ride.stations) {
            // FIX: Calculate distance BEFORE starting simulation
            const dx = ride.stations.x_coordinate - location.x;
            const dy = ride.stations.y_coordinate - location.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Only start driving if we are NOT already there (tolerance 0.5)
            if (distance > 0.5) {
              startDrivingToTarget(ride.stations, ride.id);
            } else {
               console.log("Driver already at station.");
            }
          } else {
            console.error("Ride assigned but no station data found:", ride);
          }
        }
      } catch (err) {
        console.error("Error checking rides:", err);
      }
    };

    pollingRef.current = setInterval(checkRide, 3000);
    return () => clearInterval(pollingRef.current);
  }, [user, isOnline, isDriving, currentRide, location]);

  const handleLogout = async () => {
    stopSimulation();
    if (user && location)
      await driverService.updateLocation(
        user.id,
        location.x,
        location.y,
        "offline"
      );
    await supabase.auth.signOut();
    navigate("/login");
  };

  const toggleOnline = async () => {
    if (!location) return; // Prevent toggling if location hasn't loaded

    if (isOnline) {
      setIsOnline(false);
      stopSimulation();
      if (user)
        await driverService.updateLocation(
          user.id,
          location.x,
          location.y,
          "offline"
        );
    } else {
      setIsOnline(true);
      // Use the FETCHED location, not the default (10,10)
      if (user)
        await driverService.updateLocation(
          user.id,
          location.x,
          location.y,
          "available"
        );
    }
  };

  const stopSimulation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsDriving(false);
  };

  const startDrivingToTarget = (targetStation, rideId) => {
    if (!targetStation) return;

    setIsDriving(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setLocation((prev) => {
        const dx = targetStation.x_coordinate - prev.x;
        const dy = targetStation.y_coordinate - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // --- ARRIVAL LOGIC ---
        if (dist < 0.5) {
          clearInterval(intervalRef.current);
          setIsDriving(false);
          alert(`ARRIVED at ${targetStation.name}! Ride Completed.`);
          
          // Complete the ride in backend so it doesn't get fetched again
          if (rideId && user) {
              // Pass the final coordinates (targetStation.x/y) here
              driverService.completeRide(
                  rideId, 
                  user.id, 
                  targetStation.x_coordinate, 
                  targetStation.y_coordinate
              )
              .then(() => {
                  console.log("Ride completed successfully");
                  setCurrentRide(null); 
              })
              .catch(err => console.error("Failed to complete ride", err));
          }

          // Snap to exact location
          return { x: targetStation.x_coordinate, y: targetStation.y_coordinate };
        }
        // ---------------------

        const speed = 0.5;
        const angle = Math.atan2(dy, dx);

        const newX =
          Math.abs(dx) < speed
            ? targetStation.x_coordinate
            : prev.x + Math.cos(angle) * speed;
        const newY =
          Math.abs(dy) < speed
            ? targetStation.y_coordinate
            : prev.y + Math.sin(angle) * speed;

        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              x: newX,
              y: newY,
              status: "busy",
            })
          );
        }

        return { x: newX, y: newY };
      });
    }, 50);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-400 border font-bold border-gray-100/20 px-4 py-2 rounded cursor-pointer hover:bg-gray-700 transition-colors duration-200 "
          >
            Logout
          </button>
        </div>

        {/* Loading State */}
        {!location ? (
           <div className="text-center text-gray-400 mt-10">Loading driver location...</div>
        ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Status:
              <span
                className={`px-2 py-1 rounded text-sm font-bold ${
                  isOnline
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                {isOnline ? (isDriving ? "BUSY" : "ONLINE") : "OFFLINE"}
              </span>
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded border border-gray-600 font-mono text-sm">
                <p>
                  📍 X:{" "}
                  <span className="text-blue-400">{location.x.toFixed(2)}</span>
                </p>
                <p>
                  📍 Y:{" "}
                  <span className="text-blue-400">{location.y.toFixed(2)}</span>
                </p>
              </div>

              {!currentRide ? (
                <button
                  onClick={toggleOnline}
                  className={`w-full font-bold py-3 rounded-lg transition-colors shadow-lg cursor-pointer
                    ${
                      isOnline
                        ? "bg-red-600 hover:bg-red-500"
                        : "bg-green-600 hover:bg-green-500"
                    } text-white`}
                >
                  {isOnline ? "Go Offline" : "Go Online"}
                </button>
              ) : (
                <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                  <h3 className="font-bold text-blue-400 mb-2">
                    🚀 Job Assigned!
                  </h3>
                  <p className="text-sm text-gray-300">
                    Destination:{" "}
                    <span className="text-white font-bold">
                      {currentRide.stations
                        ? currentRide.stations.name
                        : "Unknown"}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}