from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from database import url, key
from supabase import create_client
from pydantic import BaseModel
from datetime import datetime
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.riders: list[WebSocket] = []
        self.driver_locations = {} 

    async def connect_rider(self, websocket: WebSocket):
        await websocket.accept()
        self.riders.append(websocket)
        await websocket.send_json(self.driver_locations)

    def disconnect_rider(self, websocket: WebSocket):
        if websocket in self.riders:
            self.riders.remove(websocket)

    async def broadcast_to_riders(self):
        active_data = {k:v for k,v in self.driver_locations.items() if v['status'] != 'offline'}
        
        for connection in self.riders:
            try:
                await connection.send_json(active_data)
            except Exception:
                pass # Handle broken connections gracefully

    async def update_driver_location(self, driver_id: str, data: dict):
        self.driver_locations[driver_id] = data
        
        await self.broadcast_to_riders()

manager = ConnectionManager()

@app.websocket("/ws/driver/{driver_id}")
async def driver_socket(websocket: WebSocket, driver_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            
            payload = {
                "driver_id": driver_id,
                "x_coordinate": data['x'],
                "y_coordinate": data['y'],
                "status": data['status'],
                "last_updated": datetime.utcnow().isoformat()
            }
            
            await manager.update_driver_location(driver_id, payload)
            
    except WebSocketDisconnect:
        print(f"Driver {driver_id} disconnected")
        if driver_id in manager.driver_locations:
             manager.driver_locations[driver_id]['status'] = 'offline'
        
        try:
            supabase = create_client(url, key)
            supabase.table("driver_locations")\
                .update({"status": "offline"})\
                .eq("driver_id", driver_id)\
                .execute()
        except Exception as e:
            print(f"Failed to update DB on disconnect: {e}")

        await manager.broadcast_to_riders()

@app.websocket("/ws/riders")
async def rider_socket(websocket: WebSocket):
    await manager.connect_rider(websocket)
    try:
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect_rider(websocket)


class LocationUpdate(BaseModel):
    driver_id: str
    x: float
    y: float
    status: str

@app.post("/update-location")
def update_location(data: LocationUpdate):
    try:
        supabase = create_client(url, key)
        payload = {
            "driver_id": data.driver_id,
            "x_coordinate": data.x,
            "y_coordinate": data.y,
            "status": data.status,
            "last_updated": datetime.utcnow().isoformat()
        }
        supabase.table("driver_locations").upsert(payload).execute()
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/assigned-ride/{driver_id}")
def get_assigned_ride(driver_id: str):
    try:
        supabase = create_client(url, key)
        response = supabase.table("ride_requests")\
            .select("*, stations(name, x_coordinate, y_coordinate)")\
            .eq("matched_driver_id", driver_id)\
            .eq("status", "matched")\
            .maybe_single()\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))