"use client";
import { useState } from "react";

interface LessonInputProps {
    onGenerateLesson: (prompt: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export default function LessonInput({ onGenerateLesson, loading, error }: LessonInputProps) {
    const [prompt, setPrompt] = useState<string>("");

    const handleSubmit = async () => {
        if (prompt.trim()) {
            await onGenerateLesson(prompt);
        }
    };

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
                    onClick={handleSubmit}
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