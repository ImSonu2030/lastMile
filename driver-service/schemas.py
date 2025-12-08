from pydantic import BaseModel

class LocationUpdate(BaseModel):
    driver_id: str
    x: float
    y: float
    status: str

class RideCompletion(BaseModel):
    ride_id: str
    driver_id: str
    final_x: float
    final_y: float