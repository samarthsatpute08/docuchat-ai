import motor.motor_asyncio
import redis.asyncio as aioredis
from config import MONGO_URL, DB_NAME, REDIS_URL

# MongoDB connection
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]
users_collection = db["users"]

# Redis connection
redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)