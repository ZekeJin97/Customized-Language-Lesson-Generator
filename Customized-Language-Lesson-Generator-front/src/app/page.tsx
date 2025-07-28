"use client";
import { useState } from "react";
import { Lesson, CurrentStep } from '@/types/lesson';
import { generateLesson } from '@/services/lessonService';
import LessonInput from '@/components/LessonInput';
import VocabularyDisplay from '@/components/VocabularyDisplay';
import QuizSelector from '@/components/QuizSelector';
import VocabQuiz from '@/components/VocabQuiz';
import FillBlankQuiz from '@/components/FillBlankQuiz';
import ReverseQuiz from '@/components/ReverseQuiz';
import MistakesReview from '@/components/MistakesReview';

// Extended lesson type to include session_id
interface LessonWithSession extends Lesson {
    session_id: number;
}

// Extended CurrentStep type to include mistakes review
type ExtendedCurrentStep = CurrentStep | "mistakes_review";

export default function LinguaQuizApp() {
    const [prompt, setPrompt] = useState<string>("");
    const [lesson, setLesson] = useState<LessonWithSession | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<ExtendedCurrentStep>("input");

    const handleGenerateLesson = async (userPrompt: string) => {
        setLoading(true);
        setError(null);
        setPrompt(userPrompt);

        try {
            const lessonData = await generateLesson(userPrompt);
            setLesson(lessonData as LessonWithSession);
            setCurrentStep("lesson");
        } catch (e) {
            console.error(e);
            if (e instanceof Error && e.message.includes('Authentication required')) {
                setError("Please log in to generate lessons.");
            } else if (e instanceof Error && e.message.includes('Session expired')) {
                setError("Your session has expired. Please log in again.");
            } else {
                setError("Something went wrong. Please try again.");
            }
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
    if (!lesson && currentStep !== "mistakes_review") {
        return (
            <div className="min-h-screen bg-black">
                <LessonInput
                    onGenerateLesson={handleGenerateLesson}
                    loading={loading}
                    error={error}
                />
            </div>
        );
    }

    // Mistakes Review Screen (can be accessed without a lesson)
    if (currentStep === "mistakes_review") {
        return (
            <div className="min-h-screen bg-black">
                <div className="max-w-4xl mx-auto p-4">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-purple-400">📋 Review Your Mistakes</h1>
                        <div className="flex justify-center items-center gap-4 mt-2">
                            <button
                                onClick={() => {
                                    if (lesson) {
                                        setCurrentStep("lesson");
                                    } else {
                                        setCurrentStep("input");
                                    }
                                }}
                                className="text-purple-400 hover:text-purple-300 underline"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <MistakesReview
                            onBackToMenu={() => {
                                if (lesson) {
                                    setCurrentStep("lesson");
                                } else {
                                    setCurrentStep("input");
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Main Lesson Screen
    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-4xl mx-auto p-4">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-purple-400">📚 {prompt}</h1>
                    <div className="flex justify-center items-center gap-4 mt-2">
                        <button
                            onClick={reset}
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            ← Start Over
                        </button>
                        <button
                            onClick={() => setCurrentStep("mistakes_review")}
                            className="text-red-400 hover:text-red-300 underline"
                        >
                            📋 Review Mistakes
                        </button>
                        <span className="text-gray-500 text-sm">
                            Session ID: {lesson!.session_id}
                        </span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Vocabulary */}
                    <VocabularyDisplay lesson={lesson!} />

                    {/* Right: Quiz Area */}
                    {currentStep === "lesson" && (
                        <QuizSelector
                            onStartVocabQuiz={() => setCurrentStep("vocab_quiz")}
                            onStartFillBlankQuiz={() => setCurrentStep("fillblank_quiz")}
                            onStartReverseQuiz={() => setCurrentStep("reverse_quiz")}
                            onStartMistakesReview={() => setCurrentStep("mistakes_review")}
                        />
                    )}

                    {currentStep === "vocab_quiz" && (
                        <VocabQuiz
                            lesson={lesson!}
                            sessionId={lesson!.session_id}
                            onBackToMenu={() => setCurrentStep("lesson")}
                            onStartFillBlank={() => setCurrentStep("fillblank_quiz")}
                        />
                    )}

                    {currentStep === "fillblank_quiz" && (
                        <FillBlankQuiz
                            lesson={lesson!}
                            sessionId={lesson!.session_id}
                            onBackToMenu={() => setCurrentStep("lesson")}
                            onStartReverseQuiz={() => setCurrentStep("reverse_quiz")}
                        />
                    )}

                    {currentStep === "reverse_quiz" && (
                        <ReverseQuiz
                            lesson={lesson!}
                            sessionId={lesson!.session_id}
                            onBackToMenu={() => setCurrentStep("lesson")}
                            onStartVocabQuiz={() => setCurrentStep("vocab_quiz")}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}