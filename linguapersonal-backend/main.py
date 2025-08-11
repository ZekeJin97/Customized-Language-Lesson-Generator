# main.py - Complete file with 2FA support and database migration
import os
import logging
import json
import time
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

# Import our database models
from database import get_db, create_tables, User, LearningSession, QuestionAttempt, UserProgress, EmailVerificationCode, \
    engine

# ─── Setup ──────────────────────────────────────────────
load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LinguaPersonal API with 2FA",
    version="2.1",
    timeout_keep_alive=60
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database migration function
def run_migrations():
    """Run database migrations for existing tables"""
    try:
        logger.info("🔄 Running database migrations...")

        # Add the two_fa_enabled column if it doesn't exist
        with engine.connect() as connection:
            try:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT TRUE;"))
                connection.commit()
                logger.info("✅ Added two_fa_enabled column to users table")
            except Exception as e:
                logger.warning(f"⚠️ Column migration warning: {e}")

        logger.info("✅ Database migrations completed")

    except Exception as e:
        logger.error(f"❌ Migration error: {e}")


# Create database tables and run migrations on startup
create_tables()
run_migrations()

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Email Settings for 2FA
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

security = HTTPBearer()


# ─── Pydantic Models ────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginStep1Response(BaseModel):
    message: str
    requires_2fa: bool
    access_token: Optional[str] = None
    token_type: Optional[str] = None


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


# ─── Email Service ─────────────────────────────────────
async def send_verification_email(email: str, code: str):
    """Send verification code via email"""
    try:
        if not SMTP_EMAIL or not SMTP_PASSWORD:
            logger.error("❌ Email credentials not configured")
            raise HTTPException(status_code=500, detail="Email service not configured")

        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = email
        msg['Subject'] = "LinguaPersonal - Login Verification Code"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">LinguaPersonal</h1>
                <p style="color: #f0f0f0; margin: 10px 0 0 0;">Login Verification</p>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">Your Verification Code</h2>

                <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #8B5CF6; display: inline-block; margin: 20px 0;">
                    <h1 style="color: #8B5CF6; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">{code}</h1>
                </div>

                <p style="color: #666; margin: 20px 0 10px 0; font-size: 16px;">
                    Enter this code in your browser to complete login
                </p>

                <p style="color: #999; font-size: 14px; margin: 0;">
                    This code will expire in <strong>10 minutes</strong>
                </p>
            </div>

            <div style="margin-top: 20px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>Security Note:</strong> If you didn't request this code, please ignore this email and consider changing your password.
                </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    This email was sent by LinguaPersonal. Do not reply to this email.
                </p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_EMAIL, email, text)

        logger.info(f"✅ Verification email sent to {email}")

    except Exception as e:
        logger.error(f"❌ Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send verification email")


def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


# ─── Auth Helper Functions ──────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


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


# ─── Authentication Endpoints ───────────────────────────
@app.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    start_time = time.time()

    try:
        # Check if user exists
        logger.info(f"🔍 Checking if user exists: {user_data.email}")
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create new user
        logger.info("🔐 Hashing password...")
        hashed_password = hash_password(user_data.password)

        logger.info("👤 Creating new user...")
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            two_fa_enabled=True  # Enable 2FA by default
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create access token (skip 2FA for registration)
        logger.info("🎟️ Creating access token...")
        access_token = create_access_token(data={"sub": user_data.email})

        total_time = time.time() - start_time
        logger.info(f"✅ Registration completed in {total_time:.3f}s")

        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error during registration: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        db.rollback()
        total_time = time.time() - start_time
        logger.error(f"Registration failed after {total_time:.3f}s: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")


@app.post("/login-step1", response_model=LoginStep1Response)
async def login_step1(user_data: UserLogin, db: Session = Depends(get_db)):
    """Step 1: Verify credentials and send 2FA code if needed"""
    start_time = time.time()

    try:
        logger.info(f"🔍 Login attempt for: {user_data.email}")

        # Find user and verify password
        user = db.query(User).filter(User.email == user_data.email).first()
        if not user or not verify_password(user_data.password, user.password_hash):
            logger.warning(f"❌ Invalid credentials for: {user_data.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Check if 2FA is enabled
        if not user.two_fa_enabled:
            logger.info("⚡ 2FA disabled, completing login immediately")
            access_token = create_access_token(data={"sub": user_data.email})
            user.last_login = datetime.utcnow()
            db.commit()

            total_time = time.time() - start_time
            logger.info(f"✅ Direct login completed in {total_time:.3f}s")

            return {
                "message": "Login successful",
                "requires_2fa": False,
                "access_token": access_token,
                "token_type": "bearer"
            }

        # Generate and send verification code
        logger.info("📧 Generating 2FA code...")
        code = generate_verification_code()
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Clean up old codes for this user
        db.query(EmailVerificationCode).filter(
            EmailVerificationCode.user_id == user.id,
            EmailVerificationCode.used == False
        ).update({"used": True})

        # Create new verification code
        verification_code = EmailVerificationCode(
            user_id=user.id,
            code=code,
            expires_at=expires_at
        )
        db.add(verification_code)
        db.commit()

        # Send email
        await send_verification_email(user_data.email, code)

        total_time = time.time() - start_time
        logger.info(f"✅ 2FA code sent in {total_time:.3f}s")

        return {
            "message": "Verification code sent to your email",
            "requires_2fa": True
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        total_time = time.time() - start_time
        logger.error(f"Login step 1 failed after {total_time:.3f}s: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


@app.post("/login-step2", response_model=Token)
async def login_step2(verify_data: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Step 2: Verify the 2FA code and complete login"""
    start_time = time.time()

    try:
        logger.info(f"🔐 Verifying 2FA code for: {verify_data.email}")

        # Find the user
        user = db.query(User).filter(User.email == verify_data.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid request")

        # Find valid verification code
        verification = db.query(EmailVerificationCode).filter(
            EmailVerificationCode.user_id == user.id,
            EmailVerificationCode.code == verify_data.code,
            EmailVerificationCode.used == False,
            EmailVerificationCode.expires_at > datetime.utcnow()
        ).first()

        if not verification:
            logger.warning(f"❌ Invalid/expired code for: {verify_data.email}")
            raise HTTPException(status_code=401, detail="Invalid or expired verification code")

        # Mark code as used and update last login
        verification.used = True
        user.last_login = datetime.utcnow()
        db.commit()

        # Create access token
        access_token = create_access_token(data={"sub": user.email})

        total_time = time.time() - start_time
        logger.info(f"✅ 2FA login completed for {user.email} in {total_time:.3f}s")

        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        total_time = time.time() - start_time
        logger.error(f"Login step 2 failed after {total_time:.3f}s: {str(e)}")
        raise HTTPException(status_code=500, detail="Verification failed")


# Legacy login endpoint (redirects to new flow)
@app.post("/login", response_model=LoginStep1Response)
async def login_legacy(user_data: UserLogin, db: Session = Depends(get_db)):
    """Legacy login endpoint - now uses 2FA flow"""
    return await login_step1(user_data, db)


# ─── 2FA Management Endpoints ───────────────────────────
@app.post("/resend-verification-code")
async def resend_verification_code(email_data: dict, db: Session = Depends(get_db)):
    """Resend verification code if the previous one expired"""
    try:
        email = email_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate new code
        code = generate_verification_code()
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Mark old codes as used
        db.query(EmailVerificationCode).filter(
            EmailVerificationCode.user_id == user.id,
            EmailVerificationCode.used == False
        ).update({"used": True})

        # Create new code
        verification_code = EmailVerificationCode(
            user_id=user.id,
            code=code,
            expires_at=expires_at
        )
        db.add(verification_code)
        db.commit()

        # Send email
        await send_verification_email(email, code)

        logger.info(f"✅ Verification code resent to {email}")
        return {"message": "New verification code sent"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Resend verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resend code")


@app.post("/toggle-2fa")
async def toggle_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enable/disable 2FA for the current user"""
    try:
        current_user.two_fa_enabled = not current_user.two_fa_enabled
        db.commit()

        status = "enabled" if current_user.two_fa_enabled else "disabled"
        logger.info(f"🔧 2FA {status} for user: {current_user.email}")
        return {"message": f"2FA {status}", "two_fa_enabled": current_user.two_fa_enabled}

    except Exception as e:
        db.rollback()
        logger.error(f"Toggle 2FA failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update 2FA settings")


# ─── Cleanup Endpoint ───────────────────────────────────
@app.post("/cleanup-expired-codes")
async def cleanup_expired_codes(db: Session = Depends(get_db)):
    """Clean up expired verification codes (call this periodically)"""
    try:
        deleted_count = db.query(EmailVerificationCode).filter(
            EmailVerificationCode.expires_at < datetime.utcnow()
        ).delete()

        db.commit()
        logger.info(f"🧹 Cleaned up {deleted_count} expired verification codes")
        return {"message": f"Cleaned up {deleted_count} expired codes"}

    except Exception as e:
        db.rollback()
        logger.error(f"Cleanup failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Cleanup failed")


# ─── OpenAI Function ────────────────────────────────────
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
    "mini_translations": [
      {{"native": "...", "target": "..."}},
      {{"native": "...", "target": "..."}},
      {{"native": "...", "target": "..."}},
      {{"native": "...", "target": "..."}},
      {{"native": "...", "target": "..."}},
      {{"native": "...", "target": "..."}}
    ]
  }}
}}

IMPORTANT REQUIREMENTS:
- Include exactly 6-8 vocabulary items in "vocabulary"
- Include exactly 6-8 items in "vocab_matching" (same as vocabulary)
- Include exactly 6 items in "mini_translations" (complete sentences)
- Make mini_translations practical, conversational sentences that use the vocabulary
- Translate from '{native_lang}' to '{target_lang}'
- Do NOT just break down the user's prompt - expand the vocabulary meaningfully
- Each mini_translation should be a complete, useful sentence someone would actually say
"""

    payload = {
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 2000,
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
        timeout = httpx.Timeout(90.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            logger.info("🤖 Calling OpenAI API...")
            response = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
            response.raise_for_status()
            content = response.json()
            raw_json = json.loads(content["choices"][0]["message"]["content"])
            logger.info("✅ OpenAI API call successful")
            return raw_json
    except httpx.ReadTimeout:
        logger.error("⏰ Timeout: OpenAI API took longer than 90 seconds.")
        raise HTTPException(status_code=504, detail="OpenAI API is taking too long. Please try again.")
    except Exception as e:
        logger.exception("💥 Unexpected error while fetching lesson")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Lesson Generation Endpoint ─────────────────────────
@app.post("/generate-lesson")
async def generate_lesson(req: LessonRequest, current_user: User = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    logger.info(f"📚 Lesson request from {current_user.email}: {req.user_prompt}")
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

        # Call OpenAI
        lesson = await fetch_lesson_from_openai(req.user_prompt, req.target_lang, req.native_lang)
        lesson["session_id"] = session.id

        logger.info(f"✅ Lesson generated successfully for session {session.id}")
        return lesson

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"💥 Lesson generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Lesson generation failed.")


# ─── Quiz and Progress Endpoints ────────────────────────
@app.post("/submit-quiz-attempt")
def submit_quiz_attempt(attempt: QuizAttempt, current_user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    try:
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
            progress = UserProgress(
                user_id=current_user.id,
                language=session.language,
                total_questions=0,
                correct_answers=0
            )
            db.add(progress)

        progress.total_questions += 1
        if attempt.is_correct:
            progress.correct_answers += 1
        progress.last_studied = datetime.utcnow()

        db.commit()

        return {"message": "Attempt recorded", "is_correct": attempt.is_correct}

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in submit_quiz_attempt: {e}")
        raise HTTPException(status_code=500, detail="Database error")


@app.get("/user-progress")
async def get_user_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
        return progress
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_user_progress: {e}")
        raise HTTPException(status_code=500, detail="Database error")


@app.get("/user-mistakes")
async def get_user_mistakes(language: Optional[str] = None, current_user: User = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    try:
        query = db.query(QuestionAttempt).join(LearningSession).filter(
            LearningSession.user_id == current_user.id,
            QuestionAttempt.is_correct == False
        )

        if language:
            query = query.filter(LearningSession.language == language)

        mistakes = query.limit(20).all()
        return mistakes
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_user_mistakes: {e}")
        raise HTTPException(status_code=500, detail="Database error")


# ─── Health Check ───────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "features": ["2FA", "email_verification", "quiz_tracking"],
        "version": "2.1"
    }