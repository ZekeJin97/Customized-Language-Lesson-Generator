"use client";
import { useState } from "react";
import { Lesson, CurrentStep } from '@/types/lesson';
import { generateLesson } from '@/services/lessonService';
import LessonInput from '@/components/LessonInput';
import VocabularyDisplay from '@/components/VocabularyDisplay';
import QuizSelector from '@/components/QuizSelector';
import VocabQuiz from '@/components/VocabQuiz';
import FillBlankQuiz from '@/components/FillBlankQuiz';

export default function LinguaQuizApp() {
    const [prompt, setPrompt] = useState<string>("");
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<CurrentStep>("input");

    const handleGenerateLesson = async (userPrompt: string) => {
        setLoading(true);
        setError(null);
        setPrompt(userPrompt);

        try {
            const lessonData = await generateLesson(userPrompt);
            setLesson(lessonData);
            setCurrentStep("lesson");
        } catch (e) {
            console.error(e);
            setError("Something went wrong. Check if your backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setLesson(null);
        setCurrentStep("input");
        setPrompt("");
        setError(null);
    };

    // Input Screen
    if (!lesson) {
        return (
            <LessonInput
                onGenerateLesson={handleGenerateLesson}
                loading={loading}
                error={error}
            />
        );
    }

    // Main Lesson Screen
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
                    {/* Left: Vocabulary */}
                    <VocabularyDisplay lesson={lesson} />

                    {/* Right: Quiz Area */}
                    {currentStep === "lesson" && (
                        <QuizSelector
                            onStartVocabQuiz={() => setCurrentStep("vocab_quiz")}
                            onStartFillBlankQuiz={() => setCurrentStep("fillblank_quiz")}
                        />
                    )}

                    {currentStep === "vocab_quiz" && (
                        <VocabQuiz
                            lesson={lesson}
                            onBackToMenu={() => setCurrentStep("lesson")}
                            onStartFillBlank={() => setCurrentStep("fillblank_quiz")}
                        />
                    )}

                    {currentStep === "fillblank_quiz" && (
                        <FillBlankQuiz
                            lesson={lesson}
                            onBackToMenu={() => setCurrentStep("lesson")}
                            onStartVocabQuiz={() => setCurrentStep("vocab_quiz")}
                        />
                    )}
                </div>
            </div>
        </main>
    );
}