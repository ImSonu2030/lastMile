from database import supabase

def get_active_ride(rider_id: str):
    return supabase.table("ride_requests")\
        .select("*")\
        .eq("rider_id", rider_id)\
        .eq("status", "matched")\
        .execute()

def get_station_by_id(station_id: str):
    return supabase.table("stations")\
        .select("*")\
        .eq("id", station_id)\
        .single()\
        .execute()

def get_available_drivers():
    return supabase.table("driver_locations")\
        .select("*")\
        .eq("status", "available")\
        .execute()

def create_ride_request(ride_data: dict):
    return supabase.table("ride_requests").insert(ride_data).execute()

def set_driver_busy(driver_id: str):
    return supabase.table("driver_locations")\
        .update({"status": "busy"})\
        .eq("driver_id", driver_id)\
        .execute()