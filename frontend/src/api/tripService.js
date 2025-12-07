import { httpRequest } from "./httpClient";
const tripBaseUrl = import.meta.env.VITE_TRIP_SERVICE;

export const tripService = {
  createTrip: (ride_request_id, driver_id, rider_id) =>
    httpRequest(`${tripBaseUrl}/create`, {
      method: "POST",
      body: JSON.stringify({ ride_request_id, driver_id, rider_id }),
    }),
    
  startTrip: (trip_id) =>
    httpRequest(`${tripBaseUrl}/${trip_id}/start`, { method: "POST" }),
    
  completeTrip: (trip_id) =>
    httpRequest(`${tripBaseUrl}/${trip_id}/complete`, { method: "POST" }),
    
  getCurrentTrip: (driver_id) =>
    httpRequest(`${tripBaseUrl}/current/${driver_id}`, { method: "GET" })
};