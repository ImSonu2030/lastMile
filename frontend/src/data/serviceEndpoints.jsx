const API_GATEWAY_URL = "http://localhost:8000";

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_GATEWAY_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || errorBody.error || `Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export const serviceEndpoints = {
  userService: {
    register: (id, email, role) => {
      return apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({ id, email, role })
      });
    },

    getProfile: (userId) => {
      return apiRequest(`/profile/${userId}`, {
        method: 'GET'
      });
    }
  },

  driverService: {
    updateLocation: (driverId, x, y) => {
      return apiRequest('/driver/location', {
        method: 'POST',
        body: JSON.stringify({ driver_id: driverId, x, y })
      });
    },
    startRoute: (driverId, startX, startY, endX, endY) => {
      return apiRequest('/driver/route', {
        method: 'POST',
        body: JSON.stringify({ 
          driver_id: driverId, 
          start_x: startX, 
          start_y: startY, 
          end_x: endX, 
          end_y: endY 
        })
      });
    }
  },

  rideService: {
    requestRide: (riderId, x, y, destX, destY) => {
      return apiRequest('/ride/request', {
        method: 'POST',
        body: JSON.stringify({ 
          rider_id: riderId, 
          current_x: x, 
          current_y: y, 
          dest_x: destX, 
          dest_y: destY 
        })
      });
    }
  }
};