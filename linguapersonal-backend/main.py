import os, json, uuid, tempfile
from typing import List, Dict
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import spacy
from gtts import gTTS
from dotenv import load_dotenv
from openai import OpenAI

# ── Init ──────────────────────────────────────────────────────────────────────
load_dotenv()
client = OpenAI()
nlp = spacy.load("en_core_web_sm")

app = FastAPI(title="LinguaPersonal API", version="2.1.1-stable")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # open for dev, lock in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers ───────────────────────────────────────────────────────────────────
def detect_topic(text: str) -> str:
    doc = nlp(text.lower())
    ents = {e.label_: e.text for e in doc.ents}
    if ents.get("ORG"): return ents["ORG"]
    if ents.get("GPE"): return ents["GPE"]
    return max(doc.noun_chunks, key=len).text if doc.noun_chunks else "general"

def estimate_level(text: str) -> str:
    toks = [t for t in nlp(text) if t.is_alpha]
    avg = sum(len(t.text) for t in toks) / max(1, len(toks))
    return "advanced" if avg > 6 else "intermediate" if avg > 4 else "beginner"

def tts(words: str, lang: str) -> str:
    path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.mp3")
    gTTS(text=words, lang=lang, slow=False).save(path)
    return path

# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/version")
def version():
    return {"version": "2.1.2-stable"}

# ── Main Endpoint ─────────────────────────────────────────────────────────────
@app.post("/generate-lesson")
async def generate_lesson(req: Request):
    body = await req.json()
    print("🔥 payload:", body)

    user_prompt = body.get("user_prompt")
    target_lang = body.get("target_lang", "es")
    native_lang = body.get("native_lang", "en")

    if not user_prompt:
        raise HTTPException(400, "Missing user_prompt")

    topic = detect_topic(user_prompt)
    level = estimate_level(user_prompt)

    system_prompt = (
        "You are a Spanish language-teaching expert.  "
        "Generate a JSON lesson with:\n"
        "• vocabulary: list of 8–10 items using ONLY keys 'native' and 'target'\n"
        "• grammar_notes: a short explanation (≤100 words)\n"
        "• quiz: contains two sections: vocab_matching and mini_translations\n"
        "All grammar explanations should be in English. Avoid Spanish unless translating."
        " Output ONLY raw JSON, no markdown, no comments."
    )

    chat = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
    )

    raw = chat.choices[0].message.content
    print("🧠 LLM raw:", raw)

    try:
        data = json.loads(raw)

        # Handle vocab dict or list
        if isinstance(data["vocabulary"], dict):
            data["vocabulary"] = [
                {"native": k, "target": v} for k, v in data["vocabulary"].items()
            ]
        elif isinstance(data["vocabulary"], list):
            vocab = []
            for item in data["vocabulary"]:
                if "native" in item and "target" in item:
                    vocab.append(item)
                elif "English" in item and "Translation" in item:
                    vocab.append({
                        "native": item["English"],
                        "target": item["Translation"]
                    })
                else:
                    raise ValueError(f"Invalid vocab format: {item}")
            data["vocabulary"] = vocab
        else:
            raise ValueError("Vocab must be list or dict")

    except Exception as e:
        print("🚨 Error while parsing LLM output:", e)
        raise HTTPException(500, "LLM returned invalid JSON or unexpected format")

    # Gracefully fallback if keys are weird
    grammar_notes = data.get("grammar_notes") or data.get("grammar_note") or ""
    quiz = data.get("quiz") or {}

    vocab_targets = [v["target"] for v in data["vocabulary"]]
    audio_url = tts(", ".join(vocab_targets), target_lang)

    return JSONResponse(content={
        "topic":         topic,
        "difficulty":    level,
        "vocabulary":    data["vocabulary"],
        "grammar_notes": grammar_notes,
        "quiz":          quiz,
        "audio_url":     audio_url,
    })

# ── Run Dev ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
