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

  completeRide: (ride_id, driver_id, x, y) =>
    httpRequest(`${driverBaseUrl}/complete-ride`, {
      method: "POST",
      body: JSON.stringify({ 
        ride_id, 
        driver_id,
        final_x: x,  // Send final coordinates
        final_y: y 
      }),
    }),

  getDriverLocation: (driver_id) =>
    httpRequest(`${driverBaseUrl}/location/${driver_id}`, {
      method: "GET",
    }),
};
