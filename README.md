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

### 👤 **User Management & Progress**
- **Secure Authentication**: JWT-based user accounts with registration/login
- **Progress Tracking**: Detailed statistics on quiz performance and accuracy
- **Mistake Review**: Review and practice your incorrect answers with audio pronunciation
- **Session Management**: Each lesson generates unique learning sessions

### ✨ **Premium Experience**
- 🌙 **Dark Theme** – Easy on the eyes for extended study sessions
- 🔊 **Audio Pronunciation** – Native Spanish and English text-to-speech
- ⚡ **Real-Time Feedback** – Instant scoring with visual feedback
- 📱 **Responsive Design** – Works seamlessly on desktop and mobile
- 🎨 **Clean UI** – Split-screen design keeps vocabulary always visible

## 🛠 Tech Stack

### **Frontend**
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: React hooks with context
- **Audio**: Web Speech API for pronunciation
- **Testing**: React Testing Library + Jest

### **Backend** 
- **Framework**: FastAPI with Python 3.10+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI Integration**: OpenAI GPT-3.5-turbo for lesson generation
- **Deployment**: Docker containerization
- **Testing**: pytest with comprehensive test coverage

### **Infrastructure**
- **Deployment**: AWS EC2 with automated CI/CD
- **Database**: PostgreSQL hosted on AWS RDS
- **API Documentation**: Interactive Swagger/OpenAPI docs
- **Monitoring**: Comprehensive logging and error tracking

## 🏁 Quick Start

### **Prerequisites**
- Python 3.10+
- Next.js
- PostgreSQL database
- OpenAI API key

### **Environment Setup**

Create `.env` files:

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/linguapersonal
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET_KEY=your_secure_secret_key
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
2. **Generate Lesson**: Enter any topic (e.g., "ordering coffee", "job interview", "at the doctor")
3. **Study Content**: Review AI-generated vocabulary, grammar notes, and example sentences
4. **Take Quizzes**: Choose from three different quiz types to test your knowledge
5. **Track Progress**: Monitor your accuracy and review mistakes for focused practice

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
│   Tailwind CSS  │             │   + PostgreSQL   │                  │             │
└─────────────────┘ ◄────────── └──────────────────┘ ◄────────────── └─────────────┘
        │                               │
        │                               │
   ┌────────────┐                ┌─────────────┐
   │   User     │                │   Database  │
   │ Management │                │   - Users   │
   │ + Audio    │                │   - Sessions│
   └────────────┘                │   - Progress│
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
│   │   │   ├── AuthForm.tsx     # Login/register component
│   │   │   ├── ProtectedRoute.tsx# Authentication wrapper
│   │   │   ├── LessonInput.tsx  # Topic input screen
│   │   │   ├── VocabularyDisplay.tsx # Vocab + example sentences
│   │   │   ├── QuizSelector.tsx # Quiz type selection
│   │   │   ├── VocabQuiz.tsx    # Vocabulary matching quiz
│   │   │   ├── FillBlankQuiz.tsx# Fill-in-the-blank quiz
│   │   │   ├── ReverseQuiz.tsx  # Spanish to English quiz
│   │   │   └── MistakesReview.tsx# Review incorrect answers
│   │   ├── services/
│   │   │   └── lessonService.ts # API integration + auth
│   │   └── types/
│   │       └── lesson.ts        # TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.js
├── backend/                      # FastAPI backend application  
│   ├── main.py                  # FastAPI app + API routes
│   ├── database.py              # SQLAlchemy models + DB setup
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile              # Docker containerization
│   └── .env                    # Environment variables
├── tests/                       # Comprehensive test suite
└── README.md
```

## 🧪 Testing

### **Automated Backend Testing**
```bash
# Run comprehensive test suite
pytest tests/backend/ -v

# Test against live deployment
python tests/live_backend_test.py
```

### **Test Coverage**
- ✅ Authentication & JWT security
- ✅ OpenAI API integration  
- ✅ Database operations & data integrity
- ✅ Quiz functionality & scoring
- ✅ Progress tracking & mistake review
- ✅ Frontend component interactions
- ✅ Complete user workflows

## 🌟 Key Achievements

### **AI-Powered Learning**
- Generates contextually relevant vocabulary for any topic
- Creates practical grammar explanations tailored to user input
- Produces natural, conversational example sentences

### **Robust User Experience**
- Secure user authentication with JWT tokens
- Persistent progress tracking across sessions
- Audio pronunciation for enhanced learning
- Responsive design for all devices

### **Production-Ready Architecture**
- Scalable FastAPI backend with PostgreSQL
- Comprehensive error handling and logging
- Docker containerization for easy deployment
- Automated testing with high coverage

## 🔮 Roadmap

### Complete MVP) ✅
- ✅ Custom lesson generation with OpenAI
- ✅ Three quiz types with smart scoring
- ✅ User authentication and progress tracking
- ✅ Mistake review system with audio
- ✅ Responsive dark theme UI
- ✅ Production deployment on AWS

### Enhanced Features **
- 🔄 Spaced repetition algorithm for optimal learning
- 🔄 Difficulty level selection (beginner/intermediate/advanced)
- 🔄 Lesson favorites and bookmark system
- 🔄 Voice recognition for pronunciation practice
- 🔄 Multi-language support beyond Spanish

## 📈 Performance Metrics

- **Lesson Generation**: 4-6 seconds average response time
- **Quiz Accuracy**: Smart normalization handles accents and case variations  
- **User Retention**: Progress tracking encourages continued learning
- **Scalability**: Docker deployment supports horizontal scaling

**Built with ❤️ for language learners worldwide**

[Live Demo](http://linguapersonal-frontend-swift.s3-website.us-east-2.amazonaws.com/) | [API Documentation](http://3.144.210.134:8000/docs)