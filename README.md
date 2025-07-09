# 🧠 LinguaPersonal

A personalized language learning app that generates custom Spanish lessons and quizzes from user prompts using OpenAI's GPT-4. Think Duolingo — but actually gives a damn about your interests.

## 🚀 Features

🎯 Personalized Learning: Input any topic and get a full Spanish lesson
📖 Smart Vocabulary: AI expands beyond your prompt to include contextual words
📝 Grammar Context: Relevant grammar notes tailored to your lesson topic

🧩 Interactive Quizzes:

Vocabulary matching (English → Spanish)
Fill-in-the-blank exercises


🌙 Dark Theme: Easy-on-the-eyes interface for extended learning
⚡ Real-time Feedback: Instant scoring with accent-mark tolerance
🎨 Clean UI: Split-screen design with lesson content always visible

## 🛠 Tech Stack

- **Frontend**: Next.js + Tailwind CSS
- **Backend**: FastAPI
- **Model API**: OpenAI
- **Infra**: Docker

### Environment Setup

Create `.env` in the backend directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Run the Application
 
### Terminal 1: Start backend (from backend/)
```bash
python main.py
```

# or
```bash
uvicorn main:app --reload
```

### Terminal 2: Start frontend (from frontend/)
```bash
npm run dev
```

##📱 How to Use

Enter a Topic: Type what you want to learn (e.g., "ordering coffee", "at the airport")

Review Lesson: Study the vocabulary and grammar notes

Take Quizzes: Choose between vocabulary matching or fill-in-the-blank

Get Feedback: See immediate results with correct answers

Repeat: Generate new lessons on any topic
