import { useState, useEffect } from 'react';
import { getUserMistakes, MistakeItem } from '@/services/lessonService';

// TTS function
function speakText(text: string, lang: string = 'es-ES') {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
}

interface MistakesReviewProps {
    onBackToMenu: () => void;
}

export default function MistakesReview({ onBackToMenu }: MistakesReviewProps) {
    const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        loadMistakes();
    }, []);

    const loadMistakes = async () => {
        try {
            setLoading(true);
            const mistakeData = await getUserMistakes('Spanish');
            setMistakes(mistakeData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load mistakes');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading your mistakes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
                <div className="text-center">
                    <p className="text-red-400 mb-4">❌ {error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={loadMistakes}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={onBackToMenu}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold ml-3"
                        >
                            Back to Menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mistakes.length === 0) {
        return (
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-green-400 mb-2">Perfect Score!</h2>
                    <p className="text-gray-300 mb-6">
                        You haven't made any mistakes yet. Keep up the great work!
                    </p>
                    <button
                        onClick={onBackToMenu}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    const currentMistake = mistakes[currentIndex];

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-red-400">📋 Review Mistakes</h2>
                <div className="text-sm text-gray-400">
                    {currentIndex + 1} of {mistakes.length}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
                <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / mistakes.length) * 100}%` }}
                ></div>
            </div>

            {/* Mistake Card */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-600">
                <div className="space-y-4">
                    {/* Question */}
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Question:</p>
                        <div className="flex items-center gap-2">
                            <p className="text-lg text-white font-medium">{currentMistake.question_text}</p>
                            <button
                                onClick={() => {
                                    // Determine language based on content
                                    const isSpanish = /[ñáéíóúü]/.test(currentMistake.question_text);
                                    speakText(currentMistake.question_text, isSpanish ? 'es-ES' : 'en-US');
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Pronounce question"
                            >
                                🔊
                            </button>
                        </div>
                    </div>

                    {/* Your Answer (Incorrect) */}
                    <div>
                        <p className="text-red-400 text-sm mb-1">Your Answer:</p>
                        <div className="bg-red-900/30 border border-red-600 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <p className="text-red-300 font-medium">
                                    {currentMistake.user_answer || '(No answer provided)'}
                                </p>
                                {currentMistake.user_answer && (
                                    <button
                                        onClick={() => {
                                            const isSpanish = /[ñáéíóúü]/.test(currentMistake.user_answer);
                                            speakText(currentMistake.user_answer, isSpanish ? 'es-ES' : 'en-US');
                                        }}
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                        title="Pronounce your answer"
                                    >
                                        🔊
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Correct Answer */}
                    <div>
                        <p className="text-green-400 text-sm mb-1">Correct Answer:</p>
                        <div className="bg-green-900/30 border border-green-600 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <p className="text-green-300 font-bold">{currentMistake.correct_answer}</p>
                                <button
                                    onClick={() => {
                                        const isSpanish = /[ñáéíóúü]/.test(currentMistake.correct_answer);
                                        speakText(currentMistake.correct_answer, isSpanish ? 'es-ES' : 'en-US');
                                    }}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                    title="Pronounce correct answer"
                                >
                                    🔊
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-gray-500 text-right">
                        {new Date(currentMistake.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <button
                    onClick={onBackToMenu}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                    Back to Menu
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={() => setCurrentIndex(Math.min(mistakes.length - 1, currentIndex + 1))}
                        disabled={currentIndex === mistakes.length - 1}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="text-center text-sm text-gray-400">
                    Total mistakes to review: <span className="text-red-400 font-bold">{mistakes.length}</span>
                </div>
            </div>
        </div>
    );
}