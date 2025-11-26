import { httpRequest } from "./httpClient";
const stationBaseUrl = import.meta.env.VITE_STATION_SERVICE;

export const stationService = {
  getAllStations: () => 
    httpRequest(`${stationBaseUrl}/stations`, { method: "GET" }),
};