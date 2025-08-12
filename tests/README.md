# LinguaPersonal Test Suite

This comprehensive test suite covers both frontend and backend components of the LinguaPersonal language learning application with **24 frontend tests** and complete backend API coverage.

## 🏗️ Project Structure

```
tests/
├── backend/
│   ├── __init__.py                    # Package initialization
│   ├── backend_full_test.py           # Complete backend test suite
│   ├── test.db                        # SQLite test database
│   └── requirements-test.txt          # Python test dependencies
├── frontend/
│   ├── AuthForm.test.tsx              # Authentication component tests (15 tests)
│   ├── VocabQuiz.test.tsx             # Quiz component tests (8 tests) 
│   ├── AuthService.test.ts            # Service layer tests (1 test)
│   ├── jest.config.js                 # Jest configuration
│   ├── jest.setup.js                  # Test environment setup
│   └── package.json                   # Node.js test dependencies
└── README.md                          # This file
```

## 🚀 Quick Start

### Frontend Tests

1. **Install dependencies:**
   ```bash
   cd tests/frontend
   npm install
   ```

2. **Run tests:**
   ```bash
   # Run all tests (24 tests)
   npm test

   # Run with coverage report
   npm run test:coverage

   # Run in watch mode
   npm run test:watch

   # Run specific test file
   npm test AuthForm.test.tsx
   npm test VocabQuiz.test.tsx
   ```

3. **Expected output:**
   ```
   Test Suites: 3 passed, 3 total
   Tests:       24 passed, 24 total
   Time:        ~9.8s
   ```

### Backend Tests

1. **Install dependencies:**
   ```bash
   cd tests/backend
   pip install -r requirements-test.txt
   ```

2. **Run tests:**
   ```bash
   # Run all backend tests
   python backend_full_test.py

   # Run with pytest for detailed output
   pytest backend_full_test.py -v

   # Run with coverage
   pytest backend_full_test.py --cov=main --cov-report=html
   ```

## 🧪 Detailed Test Coverage

### Frontend Tests (24 total)

#### 🔐 **AuthForm.test.tsx** (15 tests)
**Authentication Flow Testing:**
- ✅ Login form rendering and validation
- ✅ Registration form switching and submission
- ✅ 2FA verification code input (digits only, 6 chars)
- ✅ Email verification flow navigation
- ✅ Error handling (API errors, validation errors)
- ✅ Loading states during form submission
- ✅ Form state persistence and clearing
- ✅ Token storage in localStorage
- ✅ Resend verification code with cooldown timer
- ✅ Back navigation between auth steps

#### 🎯 **VocabQuiz.test.tsx** (8 tests)
**Quiz Functionality Testing:**
- ✅ Question rendering and progress tracking
- ✅ Answer input validation and submission
- ✅ Correct/incorrect feedback display
- ✅ Question navigation and completion flow
- ✅ Final score calculation and display
- ✅ Text normalization (accent handling)
- ✅ Button state management (enable/disable)
- ✅ Quiz completion and next quiz navigation

#### ⚙️ **AuthService.test.ts** (1 test)
**Service Layer Testing:**
- ✅ Token management (get/set/remove/isAuthenticated)

### Backend Tests (Multiple test classes)

#### 🔐 **TestAuthenticationHelpers**
- ✅ Password hashing and verification with bcrypt
- ✅ JWT token creation and validation
- ✅ Verification code generation (6-digit)

#### 🗄️ **TestDatabase**
- ✅ User model creation and retrieval
- ✅ Email verification code storage
- ✅ Database session management

#### 🌐 **TestAPIEndpoints**
- ✅ Health check endpoint
- ✅ User registration (success + duplicate handling)
- ✅ Login step 1 with 2FA flow
- ✅ Login step 2 verification
- ✅ Error response handling

#### 📚 **TestLessonGeneration**
- ✅ OpenAI API integration (mocked)
- ✅ Learning session creation
- ✅ Lesson data structure validation

#### 📊 **TestQuizAndProgress**
- ✅ Quiz attempt submission
- ✅ User progress tracking
- ✅ Mistake logging and retrieval
- ✅ Progress statistics calculation

✅ **What We Test:**
- Authentication flows (security-critical)
- Quiz logic and scoring (core functionality)
- API endpoints and data validation
- Error handling and edge cases
- User interaction flows

❌ **What We Skip:**
- Simple display components 
- CSS/styling
- Basic button clicks without logic
- Duplicate functionality across similar components
