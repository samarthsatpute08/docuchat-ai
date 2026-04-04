from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from auth import hash_password, verify_password, create_access_token, decode_token
from database import users_collection, redis_client
from rag.ingest import ingest_pdf
from rag.query import query_pdf
import os
import uuid
import shutil
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="DocuChat AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    doc_id: str
    question: str


@app.get("/health")
async def health():
    return {"status": "ok", "message": "DocuChat AI is running"}


@app.post("/register")
async def register(req: RegisterRequest):
    existing = await users_collection.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    await users_collection.insert_one({
        "email": req.email,
        "password": hash_password(req.password)
    })
    token = create_access_token({"sub": req.email})
    await redis_client.setex(f"token:{token}", 1800, req.email)
    return {"token": token, "email": req.email, "message": "Registered successfully"}


@app.post("/login")
async def login(req: LoginRequest):
    user = await users_collection.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Wrong email or password")
    token = create_access_token({"sub": req.email})
    await redis_client.setex(f"token:{token}", 1800, req.email)
    return {"token": token, "email": req.email, "message": "Login successful"}


@app.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    await redis_client.delete(f"token:{credentials.credentials}")
    return {"message": "Logged out successfully"}


@app.get("/me")
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    email = await redis_client.get(f"token:{token}")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"email": email, "message": "Token is valid"}


@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    email = await redis_client.get(f"token:{credentials.credentials}")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    doc_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{doc_id}.pdf"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    chunk_count = ingest_pdf(file_path, doc_id)

    await users_collection.database["documents"].insert_one({
        "doc_id": doc_id,
        "filename": file.filename,
        "email": email,
        "chunks": chunk_count
    })

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "chunks": chunk_count,
        "message": "PDF uploaded and processed successfully"
    }


@app.post("/chat")
async def chat(
    req: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    email = await redis_client.get(f"token:{credentials.credentials}")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Rate limiting - max 10 requests per minute per user
    rate_key = f"ratelimit:{email}"
    count = await redis_client.incr(rate_key)
    if count == 1:
        await redis_client.expire(rate_key, 60)
    if count > 10:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Max 10 questions per minute."
        )

    # Get answer from RAG
    answer = query_pdf(req.doc_id, req.question)

    # Save to MongoDB
    await users_collection.database["chats"].insert_one({
        "doc_id": req.doc_id,
        "email": email,
        "question": req.question,
        "answer": answer
    })

    # Cache last 5 messages in Redis for this doc
    cache_key = f"history:{email}:{req.doc_id}"
    message = f"Q: {req.question}|||A: {answer}"
    await redis_client.lpush(cache_key, message)
    await redis_client.ltrim(cache_key, 0, 4)
    await redis_client.expire(cache_key, 3600)

    return {
        "question": req.question,
        "answer": answer
    }


@app.get("/history/{doc_id}")
async def get_history(
    doc_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    email = await redis_client.get(f"token:{credentials.credentials}")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Get full history from MongoDB
    chats = await users_collection.database["chats"].find(
        {"doc_id": doc_id, "email": email},
        {"_id": 0}
    ).to_list(50)

    return {"history": chats}


@app.get("/documents")
async def get_documents(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    email = await redis_client.get(f"token:{credentials.credentials}")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    docs = await users_collection.database["documents"].find(
        {"email": email},
        {"_id": 0}
    ).to_list(100)

    return {"documents": docs}