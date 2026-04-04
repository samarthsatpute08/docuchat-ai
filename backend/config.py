import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = "your-super-secret-key-change-this-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "docuchat"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")