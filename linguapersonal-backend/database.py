# database.py - Optimized version
import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.pool import QueuePool
from datetime import datetime

# Database URL from environment variable
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/linguapersonal')

# Optimized engine configuration for PostgreSQL
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,              # Number of connections to maintain
    max_overflow=20,           # Additional connections beyond pool_size
    pool_pre_ping=True,        # Validates connections before use
    pool_recycle=3600,         # Recycle connections after 1 hour
    echo=False,                # Set to True for SQL debugging
    connect_args={
        "connect_timeout": 10,  # Connection timeout in seconds
        "application_name": "linguapersonal_api"
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# User model with optimized indexing
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)  # Added length limit
    password_hash = Column(String(255))  # Added length limit
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_login = Column(DateTime, index=True)  # Added index for performance

    # Explicit indexes for better query performance
    __table_args__ = (
        Index('idx_user_email_unique', 'email', unique=True),
        Index('idx_user_last_login', 'last_login'),
    )

    sessions = relationship("LearningSession", back_populates="user", lazy="select")
    progress = relationship("UserProgress", back_populates="user", lazy="select")


# Learning session model
class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    language = Column(String(50), index=True)
    topic = Column(String(500))
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime)

    # Composite index for common queries
    __table_args__ = (
        Index('idx_session_user_lang', 'user_id', 'language'),
        Index('idx_session_user_started', 'user_id', 'started_at'),
    )

    user = relationship("User", back_populates="sessions")
    attempts = relationship("QuestionAttempt", back_populates="session", lazy="select")


# Question attempt model
class QuestionAttempt(Base):
    __tablename__ = "question_attempts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("learning_sessions.id"), index=True)
    question_text = Column(Text)
    user_answer = Column(Text)
    correct_answer = Column(Text)
    is_correct = Column(Boolean, index=True)
    attempt_time = Column(DateTime, default=datetime.utcnow, index=True)

    # Index for finding mistakes by user
    __table_args__ = (
        Index('idx_attempt_session_correct', 'session_id', 'is_correct'),
    )

    session = relationship("LearningSession", back_populates="attempts")


# User progress model
class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    language = Column(String(50), index=True)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    last_studied = Column(DateTime, default=datetime.utcnow, index=True)

    # Composite index for user progress queries
    __table_args__ = (
        Index('idx_progress_user_lang', 'user_id', 'language', unique=True),
    )

    user = relationship("User", back_populates="progress")


# Create tables with error handling
def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise


# Optimized database session with better error handling
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()