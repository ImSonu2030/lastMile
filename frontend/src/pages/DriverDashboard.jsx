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
  const [location, setLocation] = useState({ x: 10, y: 10 });
  const [currentRide, setCurrentRide] = useState(null);

  const intervalRef = useRef(null);
  const pollingRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isOnline && user && !socketRef.current) {
      const wsUrl = `${import.meta.env.VITE_DRIVER_SERVICE.replace(
        "http",
        "ws"
      )}/ws/driver/${user.id}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Connected to Driver service");
        ws.send(
          JSON.stringify({
            x: location.x,
            y: location.y,
            status: "available",
          })
        );
      };
      ws.onclose = () => console.log("Disconnected from the service");
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

  useEffect(() => {
    if (!user || !isOnline || isDriving || currentRide) return;

    const checkRide = async () => {
      try {
        const ride = await driverService.getAssignedRide(user.id);
        if (ride) {
          console.log("Ride Assigned!", ride);
          setCurrentRide(ride);
          if (ride.stations) {
            startDrivingToTarget(ride.stations);
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
  }, [user, isOnline, isDriving, currentRide]);

  const handleLogout = async () => {
    stopSimulation();
    if (user)
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

  const startDrivingToTarget = (targetStation) => {
    if (!targetStation) return;

    setIsDriving(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setLocation((prev) => {
        const dx = targetStation.x_coordinate - prev.x;
        const dy = targetStation.y_coordinate - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.5) {
          clearInterval(intervalRef.current);
          setIsDriving(false);
          alert(`ARRIVED at ${targetStation.name}! Waiting for rider...`);
          return prev;
        }

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
      </div>
    </div>
  );
}
