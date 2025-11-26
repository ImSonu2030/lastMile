import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { driverService } from "../api/driverService";
import { useAuth } from "../stores/AuthContext";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isDriving, setIsDriving] = useState(false);
  const [location, setLocation] = useState({ x: 10, y: 10 }); // Start at 10,10
  const intervalRef = useRef(null);

  const handleLogout = async () => {
    stopDriving();
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

  const stopDriving = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsDriving(false);
  };

  const startRoute = () => {
    setIsDriving(true);

    intervalRef.current = setInterval(async () => {
      setLocation((prev) => {
        const speed = 2;
        const newX = prev.x < 90 ? prev.x + speed : 10;
        const newY = prev.y < 90 ? prev.y + speed : 10;

        if (user) {
          driverService
            .updateLocation(user.id, newX, newY, "available")
            .catch(console.error);
        }

        return { x: newX, y: newY };
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h1 className="text-2xl font-bold">🚖 Driver Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-red-400 border border-red-600/50 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Route Simulation</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded border border-gray-600 font-mono text-sm">
                <p>
                  Status:{" "}
                  <span
                    className={isDriving ? "text-green-400" : "text-gray-400"}
                  >
                    {isDriving ? "DRIVING" : "IDLE"}
                  </span>
                </p>
                <p>Current X: {location.x}</p>
                <p>Current Y: {location.y}</p>
              </div>

              {!isDriving ? (
                <button
                  onClick={startRoute}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg"
                >
                  Start Driving
                </button>
              ) : (
                <button
                  onClick={stopDriving}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg"
                >
                  Stop Driving
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
