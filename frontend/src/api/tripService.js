import { httpRequest } from "./httpClient";

const tripBaseUrl = import.meta.env.VITE_TRIP_SERVICE;

export const tripService = {
  createTrip: (tripData) =>
    httpRequest(`${tripBaseUrl}/trips`, {
      method: "POST",
      body: JSON.stringify(tripData),
    }),

  getTrip: (tripId) =>
    httpRequest(`${tripBaseUrl}/trips/${tripId}`, {
      method: "GET",
    }),

  updateTripStatus: (tripId, status) =>
    httpRequest(`${tripBaseUrl}/trips/${tripId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};