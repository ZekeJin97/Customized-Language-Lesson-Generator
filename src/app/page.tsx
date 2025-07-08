"use client";
import { useState } from "react";

interface VocabItem {
    native: string;
    target: string;
}

interface Lesson {
    vocabulary: VocabItem[];
    grammar_notes: string;
    quiz: {
        vocab_matching: VocabItem[];
        mini_translations: Array<{
            native: string;
            target: string;
        }>;
    };
}

export default function SimpleLinguaQuiz() {
    const [prompt, setPrompt] = useState<string>("");
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentQuiz, setCurrentQuiz] = useState<"none" | "vocab" | "fillblank">("none");

    // Quiz states
    const [vocabAnswers, setVocabAnswers] = useState<string[]>([]);
    const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>([]);
    const [showResults, setShowResults] = useState<boolean>(false);

    async function generateLesson() {
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
            const lessonData: Lesson = await res.json();
            setLesson(lessonData);
        } catch (e) {
            console.error(e);
            setError("Something went wrong. Check if your backend is running.");
        } finally {
            setLoading(false);
        }
    }

    function startVocabQuiz() {
        setCurrentQuiz("vocab");
        setVocabAnswers(new Array(lesson?.quiz.vocab_matching.length || 0).fill(""));
        setShowResults(false);
    }

    function startFillBlankQuiz() {
        setCurrentQuiz("fillblank");
        setFillBlankAnswers(new Array(lesson?.quiz.mini_translations.length || 0).fill(""));
        setShowResults(false);
    }

    function checkAnswers() {
        setShowResults(true);
    }

    function reset() {
        setLesson(null);
        setCurrentQuiz("none");
        setVocabAnswers([]);
        setFillBlankAnswers([]);
        setShowResults(false);
        setPrompt("");
    }

    // Function to normalize text by removing accents
    function normalizeText(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remove accent marks
    }

    function getVocabScore() {
        if (!lesson?.quiz.vocab_matching) return { correct: 0, total: 0 };
        let correct = 0;
        lesson.quiz.vocab_matching.forEach((item, index) => {
            const userAnswer = normalizeText(vocabAnswers[index] || '');
            const correctAnswer = normalizeText(item.target);
            if (userAnswer === correctAnswer) {
                correct++;
            }
        });
        return { correct, total: lesson.quiz.vocab_matching.length };
    }

    function getFillBlankScore() {
        if (!lesson?.quiz.mini_translations) return { correct: 0, total: 0 };
        let correct = 0;
        lesson.quiz.mini_translations.forEach((item, index) => {
            // Extract the missing word from the target sentence
            const words = item.target.toLowerCase().split(" ");
            const userAnswer = normalizeText(fillBlankAnswers[index] || '');

            // Simple check if the user's answer matches any word in the sentence
            if (words.some(word => normalizeText(word) === userAnswer)) {
                correct++;
            }
        });
        return { correct, total: lesson.quiz.mini_translations.length };
    }

    // Create fill-in-the-blank sentences by removing one key word
    function createFillBlank(sentence: string, vocabList: VocabItem[]) {
        // Find a vocabulary word in the sentence and replace it with ___
        for (const vocab of vocabList) {
            if (sentence.toLowerCase().includes(vocab.target.toLowerCase())) {
                return {
                    sentence: sentence.replace(new RegExp(vocab.target, 'gi'), '___'),
                    answer: vocab.target
                };
            }
        }
        // If no vocab word found, just remove the last word
        const words = sentence.split(' ');
        const lastWord = words.pop() || '';
        return {
            sentence: words.join(' ') + ' ___',
            answer: lastWord
        };
    }

    // Input Screen
    if (!lesson) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 bg-black">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-purple-400 mb-2">LinguaPersonal</h1>
                    <p className="text-gray-300">Simple Spanish vocabulary practice</p>
                </div>

                <div className="w-full max-w-md space-y-4">
                    <textarea
                        className="w-full h-32 p-4 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                        placeholder="What would you like to learn? (e.g., ordering food, asking for directions)"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />

                    <button
                        onClick={generateLesson}
                        disabled={loading || !prompt.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50"
                    >
                        {loading ? "Generating..." : "Create Lesson"}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded max-w-md">
                        {error}
                    </div>
                )}
            </main>
        );
    }

    // Lesson + Quiz Screen
    return (
        <main className="min-h-screen p-4 bg-black">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-purple-400">📚 {prompt}</h1>
                    <button
                        onClick={reset}
                        className="mt-2 text-purple-400 hover:text-purple-300 underline"
                    >
                        ← Start Over
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Side: Lesson Content */}
                    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-200 mb-4">📖 Vocabulary</h2>
                        <div className="space-y-2 mb-6">
                            {lesson.vocabulary.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                                    <span className="font-medium text-gray-300">{item.native}</span>
                                    <span className="font-bold text-purple-400">{item.target}</span>
                                </div>
                            ))}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-200 mb-2">📝 Grammar Tip</h3>
                        <p className="text-gray-300 text-sm bg-gray-800 p-3 rounded">{lesson.grammar_notes}</p>
                    </div>

                    {/* Right Side: Quiz Area */}
                    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
                        {currentQuiz === "none" && (
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-gray-200 mb-6">Choose a Quiz</h2>
                                <div className="space-y-4">
                                    <button
                                        onClick={startVocabQuiz}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold"
                                    >
                                        🧩 Vocabulary Matching
                                    </button>
                                    <button
                                        onClick={startFillBlankQuiz}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold"
                                    >
                                        📝 Fill in the Blanks
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Vocabulary Quiz */}
                        {currentQuiz === "vocab" && (
                            <div>
                                <h2 className="text-xl font-semibold text-green-700 mb-4">🧩 Vocabulary Quiz</h2>
                                <div className="space-y-4">
                                    {lesson.quiz.vocab_matching.map((item, index) => (
                                        <div key={index} className="border border-gray-600 bg-gray-800 p-3 rounded">
                                            <p className="font-medium text-gray-300 mb-2">Translate: <strong className="text-white">{item.native}</strong></p>
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:ring-2 focus:ring-green-500 placeholder-gray-400"
                                                placeholder="Spanish translation..."
                                                value={vocabAnswers[index] || ""}
                                                onChange={(e) => {
                                                    const newAnswers = [...vocabAnswers];
                                                    newAnswers[index] = e.target.value;
                                                    setVocabAnswers(newAnswers);
                                                }}
                                                disabled={showResults}
                                            />
                                            {showResults && (
                                                <div className="mt-2">
                                                    {normalizeText(vocabAnswers[index] || '') === normalizeText(item.target) ? (
                                                        <span className="text-green-600 font-semibold">✓ Correct!</span>
                                                    ) : (
                                                        <span className="text-red-600 font-semibold">✗ Answer: {item.target}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {showResults && (
                                    <div className="mt-4 p-3 bg-green-900 border border-green-600 rounded">
                                        <strong className="text-green-200">Score: {getVocabScore().correct}/{getVocabScore().total}</strong>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-2">
                                    {!showResults ? (
                                        <button
                                            onClick={checkAnswers}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                                        >
                                            Check Answers
                                        </button>
                                    ) : (
                                        <button
                                            onClick={startFillBlankQuiz}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                                        >
                                            Try Fill-in-Blanks
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setCurrentQuiz("none")}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold"
                                    >
                                        Back to Menu
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Fill in the Blanks Quiz */}
                        {currentQuiz === "fillblank" && (
                            <div>
                                <h2 className="text-xl font-semibold text-blue-700 mb-4">📝 Fill in the Blanks</h2>
                                <div className="space-y-4">
                                    {lesson.quiz.mini_translations.map((item, index) => {
                                        const fillBlank = createFillBlank(item.target, lesson.vocabulary);
                                        return (
                                            <div key={index} className="border border-gray-600 bg-gray-800 p-3 rounded">
                                                <p className="text-sm text-gray-400 mb-1">English: {item.native}</p>
                                                <p className="font-medium text-gray-300 mb-2">
                                                    Spanish: {fillBlank.sentence}
                                                </p>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                                    placeholder="Fill in the blank..."
                                                    value={fillBlankAnswers[index] || ""}
                                                    onChange={(e) => {
                                                        const newAnswers = [...fillBlankAnswers];
                                                        newAnswers[index] = e.target.value;
                                                        setFillBlankAnswers(newAnswers);
                                                    }}
                                                    disabled={showResults}
                                                />
                                                {showResults && (
                                                    <div className="mt-2">
                                                        {normalizeText(fillBlankAnswers[index] || '') === normalizeText(fillBlank.answer) ? (
                                                            <span className="text-green-600 font-semibold">✓ Correct!</span>
                                                        ) : (
                                                            <span className="text-red-600 font-semibold">✗ Answer: {fillBlank.answer}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {showResults && (
                                    <div className="mt-4 p-3 bg-blue-900 border border-blue-600 rounded">
                                        <strong className="text-blue-200">Score: {getFillBlankScore().correct}/{getFillBlankScore().total}</strong>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-2">
                                    {!showResults ? (
                                        <button
                                            onClick={checkAnswers}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                                        >
                                            Check Answers
                                        </button>
                                    ) : (
                                        <button
                                            onClick={startVocabQuiz}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                                        >
                                            Try Vocab Quiz
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setCurrentQuiz("none")}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold"
                                    >
                                        Back to Menu
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}