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

class LocationUpdate(BaseModel):
    driver_id: str
    x: float
    y: float
    status: str

@app.post("/update-location")
def update_location(data: LocationUpdate):
    try:
        payload = {
            "driver_id": data.driver_id,
            "x_coordinate": data.x,
            "y_coordinate": data.y,
            "status": data.status,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("driver_locations").upsert(payload).execute()
        return {"status": "updated"}
    except Exception as e:
        print("Location update failed:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/active-drivers")
def get_active_drivers():
    try:
        response = supabase.table("driver_locations")\
            .select("*")\
            .neq("status", "offline")\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))