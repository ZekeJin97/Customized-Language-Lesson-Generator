import os
import logging
import json
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx

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

# ─── Models ─────────────────────────────────────────────
class LessonRequest(BaseModel):
    user_prompt: str
    target_lang: str
    native_lang: str

# ─── Core Function ──────────────────────────────────────
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

# ─── Endpoint ───────────────────────────────────────────
@app.post("/generate-lesson")
async def generate_lesson(req: LessonRequest):
    logger.info("🔥 payload: %s", req.dict())
    try:
        lesson = await fetch_lesson_from_openai(req.user_prompt, req.target_lang, req.native_lang)
        logger.info("🧠 LLM raw: %s", json.dumps(lesson, indent=2, ensure_ascii=False))
        return lesson
    except HTTPException as http_exc:
        raise http_exc
    except Exception:
        raise HTTPException(status_code=500, detail="Lesson generation failed.")
