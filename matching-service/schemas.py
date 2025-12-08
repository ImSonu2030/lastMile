from pydantic import BaseModel

class RideRequest(BaseModel):
    rider_id: str
    station_id: str
    destination: str
    arrival_time: str