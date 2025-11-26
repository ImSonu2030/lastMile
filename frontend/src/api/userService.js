import { httpRequest } from "./httpClient";
const userServiceBaseUrl = import.meta.env.VITE_USER_SERVICE;

export const userService = {
  register: (id, email, role) =>
    httpRequest(`${userServiceBaseUrl}/register`, {
      method: "POST",
      body: JSON.stringify({ id, email, role }),
    }),

  getProfile: (userId) =>
    httpRequest(`${userServiceBaseUrl}/profile/${userId}`, {
      method: "GET",
    }),
};
