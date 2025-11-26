import { httpRequest } from "./httpClient";
const matchingBaseUrl = import.meta.env.VITE_MATCHING_SERVICE;

export const matchingService = {
  requestRide: (rider_id, station_id) =>
    httpRequest(`${matchingBaseUrl}/request-ride`, {
      method: "POST",
      body: JSON.stringify({ rider_id, station_id }),
    }),
};