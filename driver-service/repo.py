from database import supabase
from datetime import datetime

def update_driver_location_db(driver_id: str, x: float, y: float, status: str):
    payload = {
        "driver_id": driver_id,
        "x_coordinate": x,
        "y_coordinate": y,
        "status": status,
        "last_updated": datetime.utcnow().isoformat()
    }
    return supabase.table("driver_locations").upsert(payload).execute()

def set_driver_offline_db(driver_id: str):
    return supabase.table("driver_locations")\
        .update({"status": "offline"})\
        .eq("driver_id", driver_id)\
        .execute()

def get_assigned_ride_db(driver_id: str):
    # Fetch matched ride
    ride_res = supabase.table("ride_requests")\
        .select("*")\
        .eq("matched_driver_id", driver_id)\
        .eq("status", "matched")\
        .execute()
    
    if not ride_res.data:
        return None
        
    ride = ride_res.data[0]

    # Fetch station details for the ride
    station_id = ride.get("pickup_station_id")
    if station_id:
        station_res = supabase.table("stations")\
            .select("name, x_coordinate, y_coordinate")\
            .eq("id", station_id)\
            .execute()
        
        if station_res.data:
            ride['stations'] = station_res.data[0]
            
    return ride

def complete_ride_transaction(ride_id: str, driver_id: str, final_x: float, final_y: float):
    supabase.table("ride_requests")\
        .update({"status": "completed"})\
        .eq("id", ride_id)\
        .execute()
        
    return supabase.table("driver_locations")\
        .update({
            "status": "available",
            "x_coordinate": final_x,
            "y_coordinate": final_y
        })\
        .eq("driver_id", driver_id)\
        .execute()

def fetch_driver_location(driver_id: str):
    response = supabase.table("driver_locations")\
        .select("*")\
        .eq("driver_id", driver_id)\
        .single()\
        .execute()
    return response.data