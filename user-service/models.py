from pydantic import BaseModel, EmailStr

class UserRegisterRequest(BaseModel):
    id: str
    email: EmailStr
    role: str

class UserProfile(BaseModel):
    id: str
    email: str
    role: str