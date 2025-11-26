from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from models import UserRegisterRequest, UserProfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register")
def register_user(payload: UserRegisterRequest):
    try:
        data = {
            "id": payload.id,
            "email": payload.email,
            "role": payload.role
        }

        result = supabase.table("user_profiles").insert(data).execute()

        print("RESULT:", result)
        print("RESULT TYPE:", type(result))

        if getattr(result, "error", None):
            raise HTTPException(
                status_code=400,
                detail=result.error.message
            )

        return {"status": "success"}

    except Exception as e:
        print("REGISTER USER EXCEPTION:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profile/{user_id}", response_model=UserProfile)
def get_profile(user_id: str):
    try:
        result = supabase.table("user_profiles").select("*").eq("id", user_id).single().execute()

        if getattr(result, "error", None):
            raise HTTPException(
                status_code=404,
                detail="User profile not found"
            )
    except Exception as e:
        print("GET PROFILE EXCEPTION:", e)
        raise HTTPException(status_code=500, detail=str(e))
    return result.data
