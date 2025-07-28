import os
import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import httpx
import bcrypt
import jwt
from sqlalchemy.orm import Session

# Import our database models
from database import get_db, create_tables, User, LearningSession, QuestionAttempt, UserProgress

# ─── Setup ──────────────────────────────────────────────
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

app = FastAPI(title="LinguaPersonal API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
create_tables()

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()


# ─── Auth Models ────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# ─── Existing Models ────────────────────────────────────
class LessonRequest(BaseModel):
    user_prompt: str
    target_lang: str
    native_lang: str


class QuizAttempt(BaseModel):
    session_id: int
    question_text: str
    user_answer: str
    correct_answer: str
    is_correct: bool


# ─── Auth Functions ─────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ─── Auth Endpoints ─────────────────────────────────────
@app.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(email=user_data.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": user_data.email})
    return {"access_token": access_token, "token_type": "bearer"}


# ─── Core Function (Unchanged) ──────────────────────────
async def fetch_lesson_from_openai(prompt: str, target_lang: str, native_lang: str) -> Dict[str, Any]:
    system_prompt = f"""
You are a helpful Spanish teacher AI. Create a comprehensive lesson based on the user's topic.

EXPAND beyond the user's exact words to include:
- Related vocabulary that would naturally come up in this situation
- Common phrases and expressions
- Practical words someone would actually need

For the topic provided, include 6-8 vocabulary items that cover the real-world scenario.

Return ONLY a JSON object with this exact format:

{{
  "vocabulary": [{{"native": "...", "target": "..."}}],
  "grammar_notes": "...",
  "quiz": {{
    "vocab_matching": [{{"native": "...", "target": "..."}}],
    "mini_translations": [{{"native": "...", "target": "..."}}]
  }}
}}

Rules:
- Translate from '{native_lang}' to '{target_lang}'
- Include 6-8 vocabulary items that go beyond just the user's prompt words
- Add realistic phrases someone would use in this situation
- Make mini_translations practical and conversational
- Do NOT just break down the user's prompt - expand the vocabulary meaningfully
"""

    payload = {
        "model": "gpt-4",
        "temperature": 0.8,
        "messages": [
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": prompt.strip()}
        ]
    }

    headers = {
        "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
        "Content-Type": "application/json"
    }

    try:
        timeout = httpx.Timeout(30.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            logger.info("INFO:httpx:HTTP Request: POST https://api.openai.com/v1/chat/completions \"HTTP/1.1 200 OK\"")
            response = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
            response.raise_for_status()
            content = response.json()
            raw_json = json.loads(content["choices"][0]["message"]["content"])
            return raw_json
    except httpx.ReadTimeout:
        logger.error("⏰ Timeout: OpenAI API took too long to respond.")
        raise HTTPException(status_code=504, detail="OpenAI timeout.")
    except Exception as e:
        logger.exception("💥 Unexpected error while fetching lesson")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Updated Lesson Endpoint ───────────────────────────
@app.post("/generate-lesson")
async def generate_lesson(req: LessonRequest, current_user: User = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    logger.info("🔥 payload: %s", req.dict())
    try:
        # Create a learning session
        session = LearningSession(
            user_id=current_user.id,
            language=req.target_lang,
            topic=req.user_prompt
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        lesson = await fetch_lesson_from_openai(req.user_prompt, req.target_lang, req.native_lang)
        lesson["session_id"] = session.id  # Add session ID to response

        logger.info("🧠 LLM raw: %s", json.dumps(lesson, indent=2, ensure_ascii=False))
        return lesson
    except HTTPException as http_exc:
        raise http_exc
    except Exception:
        raise HTTPException(status_code=500, detail="Lesson generation failed.")


# Fixed submit_quiz_attempt function - replace in main.py

@app.post("/submit-quiz-attempt")
def submit_quiz_attempt(attempt: QuizAttempt, current_user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    # Verify session belongs to user
    session = db.query(LearningSession).filter(
        LearningSession.id == attempt.session_id,
        LearningSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save the attempt
    quiz_attempt = QuestionAttempt(
        session_id=attempt.session_id,
        question_text=attempt.question_text,
        user_answer=attempt.user_answer,
        correct_answer=attempt.correct_answer,
        is_correct=attempt.is_correct
    )
    db.add(quiz_attempt)

    # Update user progress
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.language == session.language
    ).first()

    if not progress:
        progress = UserProgress(user_id=current_user.id, language=session.language)
        db.add(progress)

    progress.total_questions += 1
    if attempt.is_correct:
        progress.correct_answers += 1
    progress.last_studied = datetime.utcnow()

    db.commit()

    return {"message": "Attempt recorded", "is_correct": attempt.is_correct}


@app.get("/user-progress")
async def get_user_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    return progress


@app.get("/user-mistakes")
async def get_user_mistakes(language: Optional[str] = None, current_user: User = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    query = db.query(QuestionAttempt).join(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        QuestionAttempt.is_correct == False
    )

    if language:
        query = query.filter(LearningSession.language == language)

    mistakes = query.limit(20).all()
    return mistakes