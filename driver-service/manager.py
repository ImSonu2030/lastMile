from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        self.riders: List[WebSocket] = []
        self.driver_locations: Dict[str, dict] = {} 

    async def connect_rider(self, websocket: WebSocket):
        await websocket.accept()
        self.riders.append(websocket)
        # Send current state immediately upon connection
        active_data = {k:v for k,v in self.driver_locations.items() if v['status'] != 'offline'}
        await websocket.send_json(active_data)

    def disconnect_rider(self, websocket: WebSocket):
        if websocket in self.riders:
            self.riders.remove(websocket)

    async def broadcast_to_riders(self):
        # Filter out offline drivers before broadcasting
        active_data = {k:v for k,v in self.driver_locations.items() if v['status'] != 'offline'}
        
        for connection in self.riders:
            try:
                await connection.send_json(active_data)
            except Exception:
                pass

    async def update_driver_location(self, driver_id: str, data: dict):
        self.driver_locations[driver_id] = data
        await self.broadcast_to_riders()

    def mark_driver_offline(self, driver_id: str):
        if driver_id in self.driver_locations:
            self.driver_locations[driver_id]['status'] = 'offline'

manager = ConnectionManager()