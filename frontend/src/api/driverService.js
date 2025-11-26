import { httpRequest } from "./httpClient";
const driverBaseUrl = import.meta.env.VITE_DRIVER_SERVICE;

export const driverService = {
  updateLocation: (driver_id, x, y, status) =>
    httpRequest(`${driverBaseUrl}/update-location`, {
      method: "POST",
      body: JSON.stringify({ driver_id, x, y, status }),
    }),

  getActiveDrivers: () =>
    httpRequest(`${driverBaseUrl}/active-drivers`, { method: "GET" }),

  getAssignedRide: (driver_id) =>
    httpRequest(`${driverBaseUrl}/assigned-ride/${driver_id}`, {
      method: "GET",
    }),
};
