# 🧠 LinguaPersonal
A personalized language learning app that generates custom Spanish lessons and quizzes from user prompts using OpenAI's GPT. Built with ❤️ for language learners who want personalized content that actually matters to them.
#### Check it out: http://linguapersonal-frontend-swift.s3-website.us-east-2.amazonaws.com

## Screenshots

### Main Interface
![Main Interface](Demo1.png)

### Quiz System
![Quiz System](Demo2.png)

# 🧠 LinguaPersonal
A personalized language learning app that generates custom Spanish lessons and quizzes from user prompts using OpenAI's GPT. Built with ❤️ for language learners who want personalized content that actually matters to them.
#### Check it out: http://linguapersonal-frontend-swift.s3-website.us-east-2.amazonaws.com

## Screenshots

### Main Interface
![Main Interface](Demo1.png)

### Quiz System
![Quiz System](Demo2.png)

## 🚀 Features

### 🎯 **Smart Learning Experience**
- **Personalized Lessons**: Input any topic and get a full Spanish lesson tailored to real-world scenarios
- **Contextual Vocabulary**: AI expands beyond your prompt to include related words you'll actually use
- **Grammar Integration**: Relevant grammar notes with practical examples for your specific topic

### 🧩 **Interactive Quiz System**
- **Vocabulary Matching**: English → Spanish translation practice
- **Reverse Translation**: Spanish → English comprehension testing  
- **Fill-in-the-Blanks**: Complete Spanish sentences in context
- **Smart Scoring**: Accent-tolerant answers with immediate feedback

### 🔐 **Enhanced Security & User Management**
- **Two-Factor Authentication (2FA)**: Email-based verification codes for secure login
- **JWT Security**: Secure token-based authentication with auto-refresh
- **Password Protection**: bcrypt encryption with secure password requirements
- **Progress Tracking**: Detailed statistics on quiz performance and accuracy
- **Mistake Review**: Review and practice your incorrect answers with audio pronunciation
- **Session Management**: Each lesson generates unique learning sessions with full audit trail

### ✨ **Premium Experience**
- 🌙 **Dark Theme** – Easy on the eyes for extended study sessions
- 🔊 **Audio Pronunciation** – Native Spanish and English text-to-speech
- ⚡ **Real-Time Feedback** – Instant scoring with visual feedback
- 📱 **Responsive Design** – Works seamlessly on desktop and mobile
- 🎨 **Clean UI** – Split-screen design keeps vocabulary always visible
- 📧 **Email Integration** – Automated verification codes and notifications

## 🛠 Tech Stack

### **Frontend**
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: React hooks with context
- **Audio**: Web Speech API for pronunciation
- **Testing**: React Testing Library + Jest (24 comprehensive tests)
- **Authentication**: JWT with 2FA verification flow

### **Backend** 
- **Framework**: FastAPI with Python 3.10+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with 2FA email verification
- **Security**: bcrypt password hashing + email-based 2FA codes
- **AI Integration**: OpenAI GPT-3.5-turbo for lesson generation
- **Email Service**: Automated verification code delivery
- **Deployment**: Docker containerization
- **Testing**: pytest with comprehensive test coverage

### **Infrastructure**
- **Deployment**: AWS EC2 with automated CI/CD
- **Database**: PostgreSQL hosted on AWS RDS
- **Email Service**: SMTP integration for 2FA codes
- **API Documentation**: Interactive Swagger/OpenAPI docs
- **Monitoring**: Comprehensive logging and error tracking

## 🏁 Quick Start

### **Prerequisites**
- Python 3.10+
- Next.js
- PostgreSQL database
- OpenAI API key
- SMTP server for email (Gmail, SendGrid, etc.)

### **Environment Setup**

Create `.env` files:

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/linguapersonal
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET_KEY=your_secure_secret_key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### **Installation & Running**

**Backend Setup:**
```bash
cd backend/
pip install -r requirements.txt
python main.py
# API available at http://localhost:8000
```

**Frontend Setup:**
```bash
cd frontend/
npm install
npm run dev  
# App available at http://localhost:3000
```

## 📱 How to Use

### **Getting Started**
1. **Create Account**: Register with email and secure password
2. **Verify Email**: Check your email for a 6-digit verification code
3. **Secure Login**: Use email + password + 2FA code for future logins
4. **Generate Lesson**: Enter any topic (e.g., "ordering coffee", "job interview", "at the doctor")
5. **Study Content**: Review AI-generated vocabulary, grammar notes, and example sentences
6. **Take Quizzes**: Choose from three different quiz types to test your knowledge
7. **Track Progress**: Monitor your accuracy and review mistakes for focused practice

### **Two-Factor Authentication Flow**
```
Registration → Email verification → Account created
Login → Email + Password → 2FA code sent → Code verification → Access granted
```

### **Example Learning Flow**
```
Input: "booking a hotel room"
↓
AI generates: vocabulary (reservation, room service, checkout), 
grammar notes, and contextual sentences
↓
Quiz options: vocabulary matching, fill-in-blanks, reverse translation
↓
Immediate feedback + progress tracking + mistake review
```

## 🏗️ Architecture

```
┌─────────────────┐    HTTPS    ┌──────────────────┐    OpenAI API    ┌─────────────┐
│   Next.js App   │   Requests  │   FastAPI        │     Requests     │   GPT-3.5   │
│   (Frontend)    │ ──────────► │   (Backend)      │ ──────────────► │   Turbo     │
│   + 2FA Flow    │             │   + PostgreSQL   │                  │             │
└─────────────────┘ ◄────────── └──────────────────┘ ◄────────────── └─────────────┘
        │                               │                               
        │                               │                               
   ┌────────────┐                ┌─────────────┐              ┌───────────────┐
   │   User     │                │   Database  │              │  Email Server │
   │ Management │                │   - Users   │              │  (2FA Codes)  │
   │ + Audio    │                │   - Sessions│ ◄──────────► │  - SMTP       │
   └────────────┘                │   - Progress│              │  - Verification│
                                 │   - 2FA Codes│             └───────────────┘
                                 └─────────────┘
```

## 📂 Project Structure

```
linguapersonal/
├── frontend/                     # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Main application component
│   │   │   └── layout.tsx       # App layout with authentication
│   │   ├── components/
│   │   │   ├── AuthForm.tsx     # Login/register with 2FA
│   │   │   ├── ProtectedRoute.tsx# Authentication wrapper
│   │   │   ├── LessonInput.tsx  # Topic input screen
│   │   │   ├── VocabularyDisplay.tsx # Vocab + example sentences
│   │   │   ├── QuizSelector.tsx # Quiz type selection
│   │   │   ├── VocabQuiz.tsx    # Vocabulary matching quiz
│   │   │   ├── FillBlankQuiz.tsx# Fill-in-the-blank quiz
│   │   │   ├── ReverseQuiz.tsx  # Spanish to English quiz
│   │   │   └── MistakesReview.tsx# Review incorrect answers
│   │   ├── services/
│   │   │   └── lessonService.ts # API integration + auth + 2FA
│   │   └── types/
│   │       └── lesson.ts        # TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.js
├── backend/                      # FastAPI backend application  
│   ├── main.py                  # FastAPI app + API routes + 2FA
│   ├── database.py              # SQLAlchemy models + DB setup
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile              # Docker containerization
│   └── .env                    # Environment variables
├── tests/                       # Comprehensive test suite
│   ├── frontend/                # Frontend tests (24 tests)
│   │   ├── AuthForm.test.tsx    # Authentication flow tests (15 tests)
│   │   ├── VocabQuiz.test.tsx   # Quiz functionality tests (8 tests)
│   │   ├── AuthService.test.ts  # Service layer tests (1 test)
│   │   ├── jest.config.js       # Jest configuration
│   │   └── jest.setup.js        # Test environment setup
│   └── backend/                 # Backend tests
│       └── backend_full_test.py # Complete API and database tests
└── README.md
```

## 🧪 Comprehensive Testing Suite

### **Frontend Testing **

**AuthForm Tests :**
```bash
cd tests/frontend
npm test AuthForm.test.tsx
```
- ✅ Registration and login flows
- ✅ 2FA verification code handling
- ✅ Form validation and error states
- ✅ Loading states and user feedback
- ✅ Navigation between auth steps
- ✅ Token management and persistence

**VocabQuiz Tests :**
```bash
npm test VocabQuiz.test.tsx
```
- ✅ Quiz question rendering and navigation
- ✅ Answer validation and scoring
- ✅ Progress tracking and completion
- ✅ Text normalization (accent handling)

**AuthService Tests :**
```bash
npm test AuthService.test.ts
```
- ✅ Token storage and authentication state

### **Backend Testing (Comprehensive Coverage)**

```bash
cd tests/backend
python backend_full_test.py
```

**Authentication & Security:**
- ✅ Password hashing and verification
- ✅ JWT token creation and validation
- ✅ 2FA code generation and verification
- ✅ Email verification flow

**Database Operations:**
- ✅ User registration and management
- ✅ Learning session creation
- ✅ Quiz attempt tracking
- ✅ Progress statistics

**API Endpoints:**
- ✅ Health checks and monitoring
- ✅ Complete authentication flow
- ✅ Lesson generation with OpenAI
- ✅ Quiz submission and scoring
- ✅ Error handling and edge cases

### **Test Execution**
```bash
# Run all frontend tests (24 tests, ~9.8s)
cd tests/frontend && npm test

# Run all backend tests
cd tests/backend && python backend_full_test.py

# Frontend test coverage report
cd tests/frontend && npm run test:coverage
```

## 🔮 Roadmap

### **✅ Complete MVP (DONE)**
- ✅ Custom lesson generation with OpenAI
- ✅ Three quiz types with smart scoring
- ✅ User authentication with 2FA email verification
- ✅ Progress tracking and mistake review system
- ✅ Responsive dark theme UI
- ✅ Production deployment on AWS
- ✅ Comprehensive test suite 

### **🔄 Enhanced Features (Next)**
- 🔄 Spaced repetition algorithm for optimal learning
- 🔄 Difficulty level selection (beginner/intermediate/advanced)
- 🔄 Lesson favorites and bookmark system
- 🔄 Voice recognition for pronunciation practice
- 🔄 Multi-language support beyond Spanish
- 🔄 Mobile app development (React Native)

**Built with ❤️ for language learners worldwide**

[Live Demo](http://linguapersonal-frontend-swift.s3-website.us-east-2.amazonaws.com/) | [API Documentation](http://3.21.12.136:8000/docs)