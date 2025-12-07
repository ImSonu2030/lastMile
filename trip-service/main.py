from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TripCreate(BaseModel):
    ride_request_id: str
    driver_id: str
    rider_id: str

@app.post("/create")
def create_trip(payload: TripCreate):
    try:
        data = {
            "ride_request_id": payload.ride_request_id,
            "driver_id": payload.driver_id,
            "rider_id": payload.rider_id,
            "status": "scheduled"
        }
        res = supabase.table("trips").insert(data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/{trip_id}/start")
def start_trip(trip_id: str):
    try:
        data = {
            "status": "active",
            "pickup_time": datetime.utcnow().isoformat()
        }
        res = supabase.table("trips").update(data).eq("id", trip_id).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/{trip_id}/complete")
def complete_trip(trip_id: str):
    try:
        data = {
            "status": "completed",
            "dropoff_time": datetime.utcnow().isoformat()
        }
        res = supabase.table("trips").update(data).eq("id", trip_id).execute()
        
        trip = res.data[0]
        supabase.table("driver_locations").update({"status": "available"}).eq("driver_id", trip['driver_id']).execute()
        
        return trip
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/current/{driver_id}")
def get_current_trip(driver_id: str):
    res = supabase.table("trips").select("*").eq("driver_id", driver_id).neq("status", "completed").execute()
    if res.data:
        return res.data[0]
    return None