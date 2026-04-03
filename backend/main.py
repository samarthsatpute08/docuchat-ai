from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from auth import hash_password, verify_password, create_access_token, decode_token
from database import users_collection, redis_client

app = FastAPI(title="DocuChat AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str


@app.get("/health")
async def health():
    return {"status": "ok", "message": "DocuChat AI is running"}


@app.post("/register")
async def register(req: RegisterRequest):
    # Check if user already exists in MongoDB
    existing = await users_collection.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Save new user to MongoDB
    await users_collection.insert_one({
        "email": req.email,
        "password": hash_password(req.password)
    })

    token = create_access_token({"sub": req.email})

    # Save token in Redis with 30 min expiry
    await redis_client.setex(f"token:{token}", 1800, req.email)

    return {"token": token, "email": req.email, "message": "Registered successfully"}


@app.post("/login")
async def login(req: LoginRequest):
    # Find user in MongoDB
    user = await users_collection.find_one({"email": req.email})

    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Wrong email or password")

    token = create_access_token({"sub": req.email})

    # Save token in Redis
    await redis_client.setex(f"token:{token}", 1800, req.email)

    return {"token": token, "email": req.email, "message": "Login successful"}


@app.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Delete token from Redis - this is how logout works
    await redis_client.delete(f"token:{credentials.credentials}")
    return {"message": "Logged out successfully"}


@app.get("/me")
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    # Check if token exists in Redis
    email = await redis_client.get(f"token:{token}")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"email": email, "message": "Token is valid"}