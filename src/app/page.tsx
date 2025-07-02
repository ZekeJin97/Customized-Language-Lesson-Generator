"use client";
import { useState } from "react";

export default function Home() {
    const [prompt, setPrompt] = useState("");
    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:8000/generate-lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_prompt: prompt,
                    target_lang: "es",
                    native_lang: "en",
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            setLesson(await res.json());
        } catch (e) {
            console.error(e);
            setError("Something went wrong. Probably your backend is dead.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center p-8 gap-6 bg-zinc-50 text-zinc-900">
            <h1 className="text-3xl font-bold text-purple-700">LinguaPersonal (MVP)</h1>

            <textarea
                className="w-full max-w-xl h-32 p-3 border border-zinc-300 rounded"
                placeholder="Describe a topic…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />

            <button
                onClick={submit}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded disabled:opacity-50"
            >
                {loading ? "Generating…" : "Generate Lesson"}
            </button>

            {error && <p className="text-red-600 font-semibold">{error}</p>}

            {lesson && (
                <section className="w-full max-w-xl space-y-6 bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold">📌 Topic: {lesson.topic}</h2>
                    <p className="text-sm italic">Level: {lesson.difficulty}</p>

                    {/* Vocabulary */}
                    <div>
                        <h3 className="font-semibold text-lg">📖 Vocabulary</h3>
                        {Array.isArray(lesson.vocabulary) && (
                            <ul className="list-disc ml-5 mt-2 space-y-1">
                                {lesson.vocabulary.map((v: any, i: number) => (
                                    <li key={`${v.target}-${i}`}>
                                        <b>{v.target}</b> — {v.native}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {lesson.audio_url && (
                            <audio controls src={lesson.audio_url} className="mt-3" />
                        )}
                    </div>

                    {/* Grammar Notes */}
                    <div>
                        <h3 className="font-semibold text-lg">📝 Grammar Notes</h3>
                        <p className="mt-2">{lesson.grammar_notes}</p>
                    </div>

                    {/* Mini Translations */}
                    {lesson.quiz?.mini_translations && Array.isArray(lesson.quiz.mini_translations) && (
                        <div>
                            <h3 className="font-semibold text-lg">🧠 Mini Translations</h3>
                            <ul className="mt-2 space-y-2">
                                {lesson.quiz.mini_translations.map((item: any, i: number) => (
                                    <li key={i} className="bg-zinc-100 p-3 rounded">
                                        <p><b>EN:</b> {item.question}</p>
                                        <p><b>ES:</b> {item.answer}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}
