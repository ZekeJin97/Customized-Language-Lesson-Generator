# tests/backend/backend_full_test.py - Single complete test file
import os
import sys
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import bcrypt
import jwt

# Set environment variables BEFORE any imports
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-for-testing'
os.environ['OPENAI_API_KEY'] = 'test-key'

# Add backend path
backend_path = os.path.join(os.path.dirname(__file__), '../../linguapersonal-backend')
sys.path.insert(0, os.path.abspath(backend_path))

# Create test database engine
test_engine = create_engine('sqlite:///./test.db', connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Mock the problematic database creation and import modules
with patch('database.create_engine', return_value=test_engine):
    with patch('database.engine', test_engine):
        with patch('main.create_tables'):
            with patch('main.run_migrations'):
                from database import Base, get_db, User, EmailVerificationCode, LearningSession, QuestionAttempt, \
                    UserProgress
                from main import app, hash_password, verify_password, create_access_token, generate_verification_code, \
                    SECRET_KEY, ALGORITHM

# Create tables
Base.metadata.create_all(bind=test_engine)


# Override database dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# Test fixtures
@pytest.fixture
def test_user_data():
    return {"email": "test@example.com", "password": "testpassword123"}


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def clean_db():
    db = TestingSessionLocal()
    try:
        db.query(EmailVerificationCode).delete()
        db.query(QuestionAttempt).delete()
        db.query(LearningSession).delete()
        db.query(UserProgress).delete()
        db.query(User).delete()
        db.commit()
    finally:
        db.close()


@pytest.fixture
def authenticated_user(clean_db, test_user_data, db_session):
    hashed_password = hash_password(test_user_data["password"])
    user = User(
        email=test_user_data["email"],
        password_hash=hashed_password,
        two_fa_enabled=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    return {"user": user, "token": token, "headers": headers}


# Tests
class TestAuthenticationHelpers:
    def test_hash_password(self):
        password = "testpassword123"
        hashed = hash_password(password)
        assert hashed != password
        assert len(hashed) > 20
        assert verify_password(password, hashed) == True
        assert verify_password("wrongpassword", hashed) == False

    def test_create_access_token(self):
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        assert isinstance(token, str)
        assert len(token) > 20
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "test@example.com"
        assert "exp" in payload

    def test_generate_verification_code(self):
        code = generate_verification_code()
        assert len(code) == 6
        assert code.isdigit()


class TestDatabase:
    def test_user_creation(self, clean_db, db_session):
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            two_fa_enabled=True
        )
        db_session.add(user)
        db_session.commit()

        retrieved_user = db_session.query(User).filter(User.email == "test@example.com").first()
        assert retrieved_user is not None
        assert retrieved_user.email == "test@example.com"
        assert retrieved_user.two_fa_enabled == True

    def test_verification_code_creation(self, clean_db, db_session):
        user = User(email="test@example.com", password_hash="hashed_password")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        code = EmailVerificationCode(
            user_id=user.id,
            code="123456",
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            used=False
        )
        db_session.add(code)
        db_session.commit()

        retrieved_code = db_session.query(EmailVerificationCode).filter(
            EmailVerificationCode.user_id == user.id
        ).first()
        assert retrieved_code is not None
        assert retrieved_code.code == "123456"
        assert retrieved_code.used == False


class TestAPIEndpoints:
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_register_success(self, clean_db, test_user_data):
        response = client.post("/register", json=test_user_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_register_duplicate_email(self, clean_db, test_user_data):
        client.post("/register", json=test_user_data)
        response = client.post("/register", json=test_user_data)
        assert response.status_code == 400

    @patch('main.send_verification_email')
    def test_login_step1_with_2fa(self, mock_email, clean_db, test_user_data):
        mock_email.return_value = AsyncMock()
        client.post("/register", json=test_user_data)
        response = client.post("/login-step1", json=test_user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["requires_2fa"] == True

    def test_login_step2_success(self, clean_db, test_user_data, db_session):
        client.post("/register", json=test_user_data)
        user = db_session.query(User).filter(User.email == test_user_data["email"]).first()
        verification_code = EmailVerificationCode(
            user_id=user.id,
            code="123456",
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            used=False
        )
        db_session.add(verification_code)
        db_session.commit()

        verify_data = {"email": test_user_data["email"], "code": "123456"}
        response = client.post("/login-step2", json=verify_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data


class TestLessonGeneration:
    @patch('main.fetch_lesson_from_openai')
    def test_generate_lesson_success(self, mock_openai, clean_db, authenticated_user):
        mock_lesson = {
            "vocabulary": [{"native": "hello", "target": "hola"}],
            "grammar_notes": "Basic greetings",
            "quiz": {
                "vocab_matching": [{"native": "hello", "target": "hola"}],
                "mini_translations": [{"native": "Hello", "target": "Hola"}]
            }
        }
        mock_openai.return_value = mock_lesson

        headers = authenticated_user["headers"]
        lesson_request = {
            "user_prompt": "basic greetings",
            "target_lang": "Spanish",
            "native_lang": "English"
        }

        response = client.post("/generate-lesson", json=lesson_request, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["vocabulary"] == mock_lesson["vocabulary"]


class TestQuizAndProgress:
    def test_submit_quiz_attempt_success(self, clean_db, authenticated_user, db_session):
        user = authenticated_user["user"]
        headers = authenticated_user["headers"]

        session = LearningSession(user_id=user.id, language="Spanish", topic="test topic")
        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)

        quiz_data = {
            "session_id": session.id,
            "question_text": "What is 'hello' in Spanish?",
            "user_answer": "hola",
            "correct_answer": "hola",
            "is_correct": True
        }

        response = client.post("/submit-quiz-attempt", json=quiz_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_correct"] == True

    def test_get_user_progress(self, clean_db, authenticated_user, db_session):
        user = authenticated_user["user"]
        headers = authenticated_user["headers"]

        progress = UserProgress(
            user_id=user.id,
            language="Spanish",
            total_questions=10,
            correct_answers=7,
            last_studied=datetime.utcnow()
        )
        db_session.add(progress)
        db_session.commit()

        response = client.get("/user-progress", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["language"] == "Spanish"

    def test_get_user_mistakes(self, clean_db, authenticated_user, db_session):
        user = authenticated_user["user"]
        headers = authenticated_user["headers"]

        session = LearningSession(user_id=user.id, language="Spanish", topic="test")
        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)

        mistake = QuestionAttempt(
            session_id=session.id,
            question_text="What is 'cat' in Spanish?",
            user_answer="perro",
            correct_answer="gato",
            is_correct=False
        )
        db_session.add(mistake)
        db_session.commit()

        response = client.get("/user-mistakes", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["is_correct"] == False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])