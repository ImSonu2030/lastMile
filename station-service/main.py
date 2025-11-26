from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Station(BaseModel):
    id: str
    name: str
    x_coordinate: float
    y_coordinate: float

@app.get("/stations", response_model=List[Station])
def get_stations():
    try:
        response = supabase.table("stations").select("*").execute()
        return response.data
    except Exception as e:
        print("Error fetching stations:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stations/{station_id}", response_model=Station)
def get_station(station_id: str):
    try:
        response = supabase.table("stations").select("*").eq("id", station_id).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Station not found")