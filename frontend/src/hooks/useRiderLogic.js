import { useState, useEffect } from 'react';
import { stationService } from '../api/stationService';
import { matchingService } from '../api/matchingService';

export function useRiderLogic(user) {
  const [stations, setStations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [destination, setDestination] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [rideStatus, setRideStatus] = useState(null);

  useEffect(() => {
    stationService.getAllStations()
      .then(setStations)
      .catch(err => console.error("Failed to load stations", err));
  }, []);

  useEffect(() => {
    const wsUrl = `${import.meta.env.VITE_DRIVER_SERVICE.replace('http', 'ws')}/ws/riders`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const driversMap = JSON.parse(event.data);
        setDrivers(Object.values(driversMap));
      } catch (e) {
        console.error("Error parsing driver data", e);
      }
    };

    return () => ws.close();
  }, []);

  const handleRequestRide = async () => {
    if (!selectedStation || !user || !destination || !arrivalTime) {
      alert("Please select a station, destination, and arrival time.");
      return;
    }

    setRideStatus('searching');
    try {
      const result = await matchingService.requestRide(
        user.id,
        selectedStation.id,
        destination,
        arrivalTime
      );

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

  return {
    stations,
    drivers,
    selectedStation,
    setSelectedStation,
    destination,
    setDestination,
    arrivalTime,
    setArrivalTime,
    rideStatus,
    handleRequestRide
  };
}