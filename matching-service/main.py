from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from pydantic import BaseModel
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RideRequest(BaseModel):
    rider_id: str
    station_id: str
    destination: str
    arrival_time: str

def calculate_distance(x1, y1, x2, y2):
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

@app.post("/request-ride")
def request_ride(payload: RideRequest):
    try:
        # --- FIX: Prevent Double Booking ---
        # Check if this rider already has a ride with 'matched' status
        existing_ride = supabase.table("ride_requests")\
            .select("*")\
            .eq("rider_id", payload.rider_id)\
            .eq("status", "matched")\
            .execute()
        
        # If data exists, it means the rider is already matched.
        # We return a specific status so the frontend can handle it (or ignore it).
        if existing_ride.data and len(existing_ride.data) > 0:
            return {
                "status": "error", 
                "message": "Ride already in progress."
            }
        # -----------------------------------

        station_res = supabase.table("stations").select("*").eq("id", payload.station_id).single().execute()
        if not station_res.data:
            raise HTTPException(status_code=404, detail="Station not found")
        
        station = station_res.data
        sx, sy = station['x_coordinate'], station['y_coordinate']

        drivers_res = supabase.table("driver_locations").select("*").eq("status", "available").execute()
        available_drivers = drivers_res.data

        if not available_drivers:
            return {"status": "no_drivers", "message": "No drivers currently available."}

        best_driver = None
        min_dist = float('inf')

        # Logic: Find nearest driver.
        # If 'dist < min_dist', we pick the new closer driver.
        # If 'dist == min_dist', we do nothing, effectively keeping the one we already found ("pick any one").
        for driver in available_drivers:
            dist = calculate_distance(sx, sy, driver['x_coordinate'], driver['y_coordinate'])
            if dist < min_dist:
                min_dist = dist
                best_driver = driver

        ride_data = {
            "rider_id": payload.rider_id,
            "pickup_station_id": payload.station_id,
            "matched_driver_id": best_driver['driver_id'],
            "status": "matched",
            "destination": payload.destination, 
            "arrival_time": payload.arrival_time
        }
        
        request_res = supabase.table("ride_requests").insert(ride_data).execute()

        supabase.table("driver_locations")\
            .update({"status": "busy"})\
            .eq("driver_id", best_driver['driver_id'])\
            .execute()

        return {
            "status": "matched",
            "driver_id": best_driver['driver_id'],
            "distance": round(min_dist, 2)
        }

    except Exception as e:
        print("Matching Error:", e)
        raise HTTPException(status_code=500, detail=str(e))