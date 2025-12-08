from fastapi import APIRouter, HTTPException
from schemas import RideRequest
import repo
import utils

router = APIRouter()

@router.post("/request-ride")
def request_ride(payload: RideRequest):
    try:
        existing_ride = repo.get_active_ride(payload.rider_id)
        if existing_ride.data:
             return {"status": "error", "message": "Ride already in progress."}

        station_res = repo.get_station_by_id(payload.station_id)
        if not station_res.data:
            raise HTTPException(status_code=404, detail="Station not found")
        
        station = station_res.data
        sx, sy = station['x_coordinate'], station['y_coordinate']

        drivers_res = repo.get_available_drivers()
        available_drivers = drivers_res.data

        if not available_drivers:
            return {"status": "no_drivers", "message": "No drivers currently available."}

        best_driver = None
        min_dist = float('inf')

        for driver in available_drivers:
            dist = utils.calculate_distance(
                sx, sy, 
                driver['x_coordinate'], driver['y_coordinate']
            )
            
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
        
        repo.create_ride_request(ride_data)
        repo.set_driver_busy(best_driver['driver_id'])

        return {
            "status": "matched",
            "driver_id": best_driver['driver_id'],
            "distance": round(min_dist, 2)
        }

    except Exception as e:
        print("Matching Error:", e)
        raise HTTPException(status_code=500, detail=str(e))