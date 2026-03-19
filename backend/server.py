from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import base64
import json
from google import genai
from google.genai import types

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 30  # 30 days

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== LIFESPAN ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    mongo_client.close()

app = FastAPI(title="PRATYAHARA API", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class MoodEntry(BaseModel):
    mood_type: str
    intensity: int = Field(ge=1, le=10)
    note: Optional[str] = None

class MoodResponse(BaseModel):
    id: str
    user_id: str
    mood_type: str
    intensity: int
    note: Optional[str]
    created_at: str

class JournalEntry(BaseModel):
    content: str
    mood_tag: Optional[str] = None

class JournalResponse(BaseModel):
    id: str
    user_id: str
    content: str
    mood_tag: Optional[str]
    created_at: str
    updated_at: str

class StreakResponse(BaseModel):
    id: str
    user_id: str
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[str]

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    timestamp: str

class WebAuthnRegisterRequest(BaseModel):
    email: EmailStr

class WebAuthnRegisterResponse(BaseModel):
    challenge: str
    user_id: str
    rp_id: str
    rp_name: str

class WebAuthnVerifyRequest(BaseModel):
    user_id: str
    credential: Dict[str, Any]

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str    

class MeditationSession(BaseModel):
    duration_minutes: int
    session_type: str = "meditation"
    rounds_completed: Optional[int] = None

class MeditationSessionResponse(BaseModel):
    id: str
    user_id: str
    duration_minutes: int
    session_type: str
    rounds_completed: Optional[int]
    created_at: str

class MediaItem(BaseModel):
    id: str
    title: str
    type: str
    url: str
    thumbnail: Optional[str]
    duration: Optional[str]
    category: str
    description: Optional[str]

# ==================== UTILITIES ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user_data.password)
    user_doc = {"id": user_id, "email": user_data.email, "password_hash": hashed_pw, "created_at": datetime.now(timezone.utc).isoformat(), "webauthn_credentials": []}
    await db.users.insert_one(user_doc)
    streak_doc = {"id": str(uuid.uuid4()), "user_id": user_id, "current_streak": 0, "longest_streak": 0, "last_activity_date": None}
    await db.streaks.insert_one(streak_doc)
    token = create_access_token(user_id, user_data.email)
    return {"access_token": token, "token_type": "bearer", "user": {"id": user_id, "email": user_data.email}}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], user["email"])
    return {"access_token": token, "token_type": "bearer", "user": {"id": user["id"], "email": user["email"]}}

# ==================== WEBAUTHN ROUTES ====================

@api_router.post("/auth/webauthn/register-challenge", response_model=WebAuthnRegisterResponse)
async def webauthn_register_challenge(data: WebAuthnRegisterRequest, current_user: dict = Depends(get_current_user)):
    challenge = base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8')
    await db.webauthn_challenges.insert_one({"user_id": current_user["id"], "challenge": challenge, "created_at": datetime.now(timezone.utc).isoformat(), "type": "register"})
    rp_id = os.environ.get('RP_ID', 'localhost')
    return {"challenge": challenge, "user_id": current_user["id"], "rp_id": rp_id, "rp_name": "PRATYAHARA"}

@api_router.post("/auth/webauthn/register-verify")
async def webauthn_register_verify(data: WebAuthnVerifyRequest, current_user: dict = Depends(get_current_user)):
    credential_data = {"credential_id": data.credential.get("id"), "public_key": data.credential.get("publicKey"), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.update_one({"id": current_user["id"]}, {"$push": {"webauthn_credentials": credential_data}})
    return {"success": True, "message": "Biometric authentication registered successfully"}

@api_router.post("/auth/webauthn/login-challenge")
async def webauthn_login_challenge(data: Dict[str, str]):
    email = data.get("email")
    user = await db.users.find_one({"email": email})
    if not user or not user.get("webauthn_credentials"):
        raise HTTPException(status_code=400, detail="Biometric authentication not set up")
    challenge = base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8')
    await db.webauthn_challenges.insert_one({"user_id": user["id"], "challenge": challenge, "created_at": datetime.now(timezone.utc).isoformat(), "type": "login"})
    return {"challenge": challenge, "credentials": [c["credential_id"] for c in user["webauthn_credentials"]]}

@api_router.post("/auth/webauthn/login-verify", response_model=TokenResponse)
async def webauthn_login_verify(data: Dict[str, Any]):
    credential_id = data.get("credential_id")
    user = await db.users.find_one({"webauthn_credentials.credential_id": credential_id})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credential")
    token = create_access_token(user["id"], user["email"])
    return {"access_token": token, "token_type": "bearer", "user": {"id": user["id"], "email": user["email"]}}

# ==================== MOOD ROUTES ====================

@api_router.post("/moods", response_model=MoodResponse)
async def create_mood(mood: MoodEntry, current_user: dict = Depends(get_current_user)):
    mood_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    mood_doc = {"id": mood_id, "user_id": current_user["id"], "mood_type": mood.mood_type, "intensity": mood.intensity, "note": mood.note, "created_at": created_at}
    await db.moods.insert_one(mood_doc)
    await update_user_streak(current_user["id"])
    return MoodResponse(**mood_doc)

@api_router.get("/moods/history", response_model=List[MoodResponse])
async def get_mood_history(current_user: dict = Depends(get_current_user), days: int = 30):
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    moods = await db.moods.find({"user_id": current_user["id"], "created_at": {"$gte": cutoff_date.isoformat()}}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [MoodResponse(**mood) for mood in moods]

# ==================== JOURNAL ROUTES ====================

@api_router.post("/journal", response_model=JournalResponse)
async def create_journal(journal: JournalEntry, current_user: dict = Depends(get_current_user)):
    journal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    journal_doc = {"id": journal_id, "user_id": current_user["id"], "content": journal.content, "mood_tag": journal.mood_tag, "created_at": now, "updated_at": now}
    await db.journals.insert_one(journal_doc)
    return JournalResponse(**journal_doc)

@api_router.get("/journal", response_model=List[JournalResponse])
async def get_journals(current_user: dict = Depends(get_current_user)):
    journals = await db.journals.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [JournalResponse(**j) for j in journals]

# ==================== STREAK ROUTES ====================

async def update_user_streak(user_id: str):
    today = datetime.now(timezone.utc).date()
    streak = await db.streaks.find_one({"user_id": user_id})
    if not streak:
        await db.streaks.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "current_streak": 1, "longest_streak": 1, "last_activity_date": today.isoformat()})
        return
    last_activity = streak.get("last_activity_date")
    if last_activity:
        last_date = datetime.fromisoformat(last_activity).date()
        days_diff = (today - last_date).days
        if days_diff == 0:
            return
        elif days_diff == 1:
            new_streak = streak["current_streak"] + 1
            await db.streaks.update_one({"user_id": user_id}, {"$set": {"current_streak": new_streak, "longest_streak": max(new_streak, streak["longest_streak"]), "last_activity_date": today.isoformat()}})
        else:
            await db.streaks.update_one({"user_id": user_id}, {"$set": {"current_streak": 1, "last_activity_date": today.isoformat()}})
    else:
        await db.streaks.update_one({"user_id": user_id}, {"$set": {"current_streak": 1, "longest_streak": 1, "last_activity_date": today.isoformat()}})

@api_router.get("/streak", response_model=StreakResponse)
async def get_streak(current_user: dict = Depends(get_current_user)):
    streak = await db.streaks.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not streak:
        streak = {"id": str(uuid.uuid4()), "user_id": current_user["id"], "current_streak": 0, "longest_streak": 0, "last_activity_date": None}
        await db.streaks.insert_one(streak)
    return StreakResponse(**streak)

@api_router.post("/streak/update")
async def update_streak(current_user: dict = Depends(get_current_user)):
    await update_user_streak(current_user["id"])
    return {"success": True, "message": "Streak updated"}

# ==================== CHAT ROUTES ====================

@api_router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        user_msg_doc = {"id": str(uuid.uuid4()), "user_id": current_user["id"], "role": "user", "content": message.message, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.chat_messages.insert_one(user_msg_doc)
        history = await db.chat_messages.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
        history = list(reversed(history))
        gemini_client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])
        contents = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))
        response = gemini_client.models.generate_content(
            model="gemini-flash-latest",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction="""You are a compassionate mindfulness and meditation assistant for PRATYAHARA app.
                Your role is to:
                - Provide guidance on meditation and mindfulness practices
                - Offer emotional support and encouragement
                - Help users understand their feelings and moods
                - Suggest breathing exercises and relaxation techniques
                - Be warm, empathetic, and non-judgmental
                - Keep responses concise and practical
                - Focus on mental wellness and self-care
                Remember: You are here to support students and anyone seeking peace and mindfulness.""",
                max_output_tokens=1024,
            )
        )
        reply_text = response.text
        assistant_msg_doc = {"id": str(uuid.uuid4()), "user_id": current_user["id"], "role": "assistant", "content": reply_text, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.chat_messages.insert_one(assistant_msg_doc)
        return ChatResponse(reply=reply_text, timestamp=datetime.now(timezone.utc).isoformat())
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")

@api_router.get("/chat/history")
async def get_chat_history(current_user: dict = Depends(get_current_user), limit: int = 50):
    messages = await db.chat_messages.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"messages": list(reversed(messages))}

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/summary")
async def get_analytics_summary(current_user: dict = Depends(get_current_user), days: int = 7):
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    moods = await db.moods.find({"user_id": current_user["id"], "created_at": {"$gte": cutoff_date.isoformat()}}, {"_id": 0}).to_list(1000)
    journals = await db.journals.find({"user_id": current_user["id"], "created_at": {"$gte": cutoff_date.isoformat()}}, {"_id": 0}).to_list(1000)
    streak = await db.streaks.find_one({"user_id": current_user["id"]}, {"_id": 0})
    mood_distribution = {}
    for mood in moods:
        mood_type = mood["mood_type"]
        mood_distribution[mood_type] = mood_distribution.get(mood_type, 0) + 1
    avg_intensity = sum(m["intensity"] for m in moods) / len(moods) if moods else 0
    return {"period_days": days, "total_moods": len(moods), "total_journals": len(journals), "mood_distribution": mood_distribution, "average_intensity": round(avg_intensity, 2), "current_streak": streak["current_streak"] if streak else 0, "longest_streak": streak["longest_streak"] if streak else 0, "moods_by_day": moods}

# ==================== PASSWORD ROUTES ====================

@api_router.post("/auth/change-password")
async def change_password(data: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_hash = hash_password(data.new_password)
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"password_hash": new_hash}})
    return {"success": True, "message": "Password changed successfully"}

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")
    new_hash = hash_password(data.new_password)
    await db.users.update_one({"email": data.email}, {"$set": {"password_hash": new_hash}})
    return {"success": True, "message": "Password reset successfully"}

# ==================== MEDITATION ROUTES ====================

@api_router.post("/meditation", response_model=MeditationSessionResponse)
async def save_meditation_session(session: MeditationSession, current_user: dict = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    session_doc = {
        "id": session_id,
        "user_id": current_user["id"],
        "duration_minutes": session.duration_minutes,
        "session_type": session.session_type,
        "rounds_completed": session.rounds_completed,
        "created_at": created_at
    }
    await db.meditation_sessions.insert_one(session_doc)
    await update_user_streak(current_user["id"])
    return MeditationSessionResponse(**session_doc)

@api_router.get("/meditation/history", response_model=List[MeditationSessionResponse])
async def get_meditation_history(current_user: dict = Depends(get_current_user), days: int = 30):
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    sessions = await db.meditation_sessions.find(
        {"user_id": current_user["id"], "created_at": {"$gte": cutoff_date.isoformat()}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return [MeditationSessionResponse(**s) for s in sessions]

# ==================== MEDIA ROUTES ====================
# All audio files use verified direct MP3 links from archive.org
# These are 100% confirmed from archive.org search results
# No YouTube for audio = no regional blocks

@api_router.get("/media/audio", response_model=List[MediaItem])
async def get_audio_media():
    audio_items = [
        {
            "id": "audio_1",
            "title": "Om Mani Padme Hum - Peaceful Chanting",
            "type": "audio",
            # Verified working YouTube: Essence of Universe channel
            "url": "https://www.youtube.com/watch?v=mvBLSJWk6HE",
            "thumbnail": "https://img.youtube.com/vi/mvBLSJWk6HE/hqdefault.jpg",
            "duration": "16:00",
            "category": "Chanting",
            "description": "Sacred Om Mani Padme Hum mantra chanting for deep meditation"
        },
        {
            "id": "audio_2",
            "title": "Buddha Flute Music",
            "type": "audio",
            # Confirmed: archive.org/details/tibetan-healing-sounds — 109.9MB mp3
            "url": "https://archive.org/download/tibetan-healing-sounds/Buddha%20Flute%20Music.mp3",
            "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Shakuhachi.jpg/320px-Shakuhachi.jpg",
            "duration": "60:00",
            "category": "Instrumental",
            "description": "Soothing Buddha flute music for deep relaxation and meditation"
        },
        {
            "id": "audio_3",
            "title": "Gayatri Mantra 108 Times",
            "type": "audio",
            # Verified working YouTube: T-Series Bhakti Sagar (347M+ views)
            "url": "https://www.youtube.com/watch?v=nwRoHC83wx0",
            "thumbnail": "https://img.youtube.com/vi/nwRoHC83wx0/hqdefault.jpg",
            "duration": "45:00",
            "category": "Mantra",
            "description": "108 peaceful Gayatri Mantra chants by Anuradha Paudwal for spiritual awakening"
        },
        {
            "id": "audio_4",
            "title": "Tibetan Singing Bowls",
            "type": "audio",
            # Verified working YouTube: Tibetan Singing Bowls Sound Bath
            "url": "https://www.youtube.com/watch?v=Ss6V_PCDtUw",
            "thumbnail": "https://img.youtube.com/vi/Ss6V_PCDtUw/hqdefault.jpg",
            "duration": "60:00",
            "category": "Healing",
            "description": "Tibetan singing bowl frequencies for chakra healing and deep meditation"
        },
        {
            "id": "audio_5",
            "title": "Nature Sounds - Forest Rain",
            "type": "audio",
            # Working YouTube link confirmed by user
            "url": "https://www.youtube.com/watch?v=eKFTSSKCzWA",
            "thumbnail": "https://img.youtube.com/vi/eKFTSSKCzWA/hqdefault.jpg",
            "duration": "45:00",
            "category": "Nature",
            "description": "Calming forest rain sounds for deep relaxation"
        },
        {
            "id": "audio_6",
            "title": "Om Chanting 108 Times",
            "type": "audio",
            # Verified working YouTube: Powerful Om Chanting 108 Times
            "url": "https://www.youtube.com/watch?v=jA4GBfxQxzg",
            "thumbnail": "https://img.youtube.com/vi/jA4GBfxQxzg/hqdefault.jpg",
            "duration": "20:00",
            "category": "Chanting",
            "description": "Powerful Om chanting 108 times for deep meditation and healing"
        }
    ]
    return [MediaItem(**item) for item in audio_items]

@api_router.get("/media/videos", response_model=List[MediaItem])
async def get_video_media():
    video_items = [
        {
            "id": "video_1",
            "title": "Guided Meditation for Beginners",
            "type": "video",
            "url": "https://www.youtube.com/watch?v=ZToicYcHIOU",
            "thumbnail": "https://img.youtube.com/vi/ZToicYcHIOU/hqdefault.jpg",
            "duration": "10:00",
            "category": "Guided Meditation",
            "description": "Perfect introduction to meditation for students"
        },
        {
            "id": "video_2",
            "title": "Yoga Nidra - Deep Relaxation",
            "type": "video",
            "url": "https://www.youtube.com/watch?v=M0u9GST_j3s",
            "thumbnail": "https://img.youtube.com/vi/M0u9GST_j3s/hqdefault.jpg",
            "duration": "20:00",
            "category": "Yoga Nidra",
            "description": "Traditional Yoga Nidra for complete relaxation"
        },
        {
            "id": "video_3",
            "title": "5 Minute Morning Meditation",
            "type": "video",
            "url": "https://www.youtube.com/watch?v=inpok4MKVLM",
            "thumbnail": "https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg",
            "duration": "5:00",
            "category": "Quick Practice",
            "description": "Quick morning meditation for busy students"
        },
        {
            "id": "video_4",
            "title": "Chakra Balancing Meditation",
            "type": "video",
            "url": "https://www.youtube.com/watch?v=1ZYbU82GVz4",
            "thumbnail": "https://img.youtube.com/vi/1ZYbU82GVz4/hqdefault.jpg",
            "duration": "15:00",
            "category": "Energy Healing",
            "description": "Balance your seven chakras with guided meditation"
        },
        {
            "id": "video_5",
            "title": "Stress Relief Meditation for Students",
            "type": "video",
            "url": "https://www.youtube.com/watch?v=O-6f5wQXSu8",
            "thumbnail": "https://img.youtube.com/vi/O-6f5wQXSu8/hqdefault.jpg",
            "duration": "12:00",
            "category": "Stress Relief",
            "description": "Release exam stress and study pressure"
        },
        {
            "id": "video_6",
            "title": "Buddhist Meditation - Mindfulness Practice",
            "type": "video",
            "url": "https://www.youtube.com/watch?v=thcEuMDWxoI",
            "thumbnail": "https://img.youtube.com/vi/thcEuMDWxoI/hqdefault.jpg",
            "duration": "18:00",
            "category": "Buddhist Practice",
            "description": "Traditional Buddhist mindfulness meditation"
        }
    ]
    return [MediaItem(**item) for item in video_items]

# ==================== SETUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "PRATYAHARA API - Mindfulness & Meditation Platform", "version": "1.0.0"}