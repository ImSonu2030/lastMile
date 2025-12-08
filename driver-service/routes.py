from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from datetime import datetime
from manager import manager
from schemas import LocationUpdate, RideCompletion
import repo

router = APIRouter()

# --- WebSockets ---

@router.websocket("/ws/driver/{driver_id}")
async def driver_socket(websocket: WebSocket, driver_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            
            # Extract Name from Email (Default to 'Driver' if missing)
            email = data.get('email', '')
            name = email.split('@')[0] if '@' in email else "Driver"
            
            payload = {
                "driver_id": driver_id,
                "name": name,
                "x_coordinate": data['x'],
                "y_coordinate": data['y'],
                "status": data['status'],
                "last_updated": datetime.utcnow().isoformat()
            }
            
            # Update in-memory manager which broadcasts to riders
            await manager.update_driver_location(driver_id, payload)
            
    except WebSocketDisconnect:
        print(f"Driver {driver_id} disconnected")
        
        # Mark offline in memory
        manager.mark_driver_offline(driver_id)
        
        # Update DB to offline
        try:
            repo.set_driver_offline_db(driver_id)
        except Exception as e:
            print(f"Failed to update DB on disconnect: {e}")

        # Broadcast update
        await manager.broadcast_to_riders()

@router.websocket("/ws/riders")
async def rider_socket(websocket: WebSocket):
    await manager.connect_rider(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep connection open
    except WebSocketDisconnect:
        manager.disconnect_rider(websocket)

# --- HTTP Endpoints ---

@router.post("/update-location")
def update_location(data: LocationUpdate):
    try:
        repo.update_driver_location_db(
            data.driver_id, data.x, data.y, data.status
        )
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assigned-ride/{driver_id}")
def get_assigned_ride(driver_id: str):
    try:
        ride = repo.get_assigned_ride_db(driver_id)
        return ride
    except Exception as e:
        print(f"Error fetching assigned ride: {e}")
        return None

@router.post("/complete-ride")
def complete_ride(payload: RideCompletion):
    try:
        repo.complete_ride_transaction(
            payload.ride_id, payload.driver_id, payload.final_x, payload.final_y
        )
        return {"status": "success"}
    except Exception as e:
        print(f"Error completing ride: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/location/{driver_id}")
def get_driver_location(driver_id: str):
    try:
        data = repo.fetch_driver_location(driver_id)
        if not data:
             return {"x_coordinate": 10, "y_coordinate": 10}
        return data
    except Exception as e:
        print(f"Error fetching location: {e}")
        return {"x_coordinate": 10, "y_coordinate": 10}