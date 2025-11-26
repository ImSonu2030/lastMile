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

def calculate_distance(x1, y1, x2, y2):
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

@app.post("/request-ride")
def request_ride(payload: RideRequest):
    try:
        # 1. Get Pickup Station Coordinates
        station_res = supabase.table("stations").select("*").eq("id", payload.station_id).single().execute()
        if not station_res.data:
            raise HTTPException(status_code=404, detail="Station not found")
        
        station = station_res.data
        sx, sy = station['x_coordinate'], station['y_coordinate']

        # 2. Get All AVAILABLE Drivers
        drivers_res = supabase.table("driver_locations").select("*").eq("status", "available").execute()
        available_drivers = drivers_res.data

        if not available_drivers:
            return {"status": "no_drivers", "message": "No drivers currently available."}

        # 3. Find Nearest Driver
        best_driver = None
        min_dist = float('inf')

        for driver in available_drivers:
            dist = calculate_distance(sx, sy, driver['x_coordinate'], driver['y_coordinate'])
            if dist < min_dist:
                min_dist = dist
                best_driver = driver

        # 4. Create the Ride Record (Matched)
        ride_data = {
            "rider_id": payload.rider_id,
            "pickup_station_id": payload.station_id,
            "matched_driver_id": best_driver['driver_id'],
            "status": "matched"
        }
        
        request_res = supabase.table("ride_requests").insert(ride_data).execute()

        # 5. Update Driver Status to 'busy' so they don't get matched again
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