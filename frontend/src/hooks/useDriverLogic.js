import { useState, useEffect, useRef } from 'react';
import { driverService } from '../api/driverService';

export function useDriverLogic(user) {
  const [isOnline, setIsOnline] = useState(false);
  const [isDriving, setIsDriving] = useState(false);
  const [location, setLocation] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);

  const intervalRef = useRef(null);
  const pollingRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Initial Location Fetch
  useEffect(() => {
    if (user) {
      driverService.getDriverLocation(user.id)
        .then(data => setLocation(data ? { x: data.x_coordinate, y: data.y_coordinate } : { x: 10, y: 10 }))
        .catch(() => setLocation({ x: 10, y: 10 }));
    }
  }, [user]);

  // 2. WebSocket Connection
  useEffect(() => {
    if (isOnline && user && !socketRef.current && location) {
      const wsUrl = `${import.meta.env.VITE_DRIVER_SERVICE.replace("http", "ws")}/ws/driver/${user.id}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Connected to Driver Cloud");
        ws.send(JSON.stringify({ x: location.x, y: location.y, status: "available",email: user.email }));
      };

      socketRef.current = ws;
    } else if (!isOnline && socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    //FIX: Ensure ref is nulled on cleanup so re-runs can reconnect
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isOnline, user]); // Removed location dependency to avoid reconnect loops

  // 3. Polling for Rides & Driving Logic
  useEffect(() => {
    if (!user || !isOnline || isDriving || currentRide || !location) return;

    const checkRide = async () => {
      try {
        const ride = await driverService.getAssignedRide(user.id);
        if (ride && ride.stations) {
          setCurrentRide(ride);
          const dx = ride.stations.x_coordinate - location.x;
          const dy = ride.stations.y_coordinate - location.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0.5) {
            startDrivingToTarget(ride.stations, ride.id);
          }
        }
      } catch (err) {
        console.error("Error checking rides:", err);
      }
    };

    pollingRef.current = setInterval(checkRide, 3000);
    return () => clearInterval(pollingRef.current);
  }, [user, isOnline, isDriving, currentRide, location]);

  const startDrivingToTarget = (targetStation, rideId) => {
    setIsDriving(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setLocation((prev) => {
        const dx = targetStation.x_coordinate - prev.x;
        const dy = targetStation.y_coordinate - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.5) {
          clearInterval(intervalRef.current);
          setIsDriving(false);
          alert(`ARRIVED at ${targetStation.name}! Ride Completed.`);
          
          if (rideId && user) {
            driverService.completeRide(rideId, user.id, targetStation.x_coordinate, targetStation.y_coordinate)
              .then(() => setCurrentRide(null))
              .catch(console.error);
          }
          return { x: targetStation.x_coordinate, y: targetStation.y_coordinate };
        }

        const speed = 0.5;
        const angle = Math.atan2(dy, dx);
        const newX = prev.x + Math.cos(angle) * speed;
        const newY = prev.y + Math.sin(angle) * speed;

        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ x: newX, y: newY, status: "busy",email: user.email }));
        }
        return { x: newX, y: newY };
      });
    }, 50);
  };

  const toggleOnline = async () => {
    if (!location || !user) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    if (!newStatus) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsDriving(false);
    }

    await driverService.updateLocation(user.id, location.x, location.y, newStatus ? "available" : "offline");
  };

  return { isOnline, isDriving, location, currentRide, toggleOnline };
}