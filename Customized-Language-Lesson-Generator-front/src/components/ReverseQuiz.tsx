
import { useState } from 'react';
import { Lesson } from '@/types/lesson';

// TTS function
function speakText(text: string, lang: string = 'es-ES') {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
}

// Normalization function
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

interface ReverseQuizProps {
    lesson: Lesson;
    onBackToMenu: () => void;
    onStartVocabQuiz: () => void;
}

export default function ReverseQuiz({ lesson, onBackToMenu, onStartVocabQuiz }: ReverseQuizProps) {
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [answers, setAnswers] = useState<string[]>(new Array(lesson.quiz.vocab_matching.length).fill(""));
    const [showResult, setShowResult] = useState<boolean>(false);
    const [isComplete, setIsComplete] = useState<boolean>(false);

    const totalQuestions = lesson.quiz.vocab_matching.length;
    const currentItem = lesson.quiz.vocab_matching[currentQuestion];

    const checkAnswer = () => {
        setShowResult(true);
    };

    const nextQuestion = () => {
        if (currentQuestion < totalQuestions - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setShowResult(false);
        } else {
            setIsComplete(true);
        }
    };

    const updateCurrentAnswer = (value: string) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = value;
        setAnswers(newAnswers);
    };

    const isCorrect = () => {
        return normalizeText(answers[currentQuestion] || '') === normalizeText(currentItem.native);
    };

    const getOverallScore = () => {
        let correct = 0;
        lesson.quiz.vocab_matching.forEach((item, index) => {
            const userAnswer = normalizeText(answers[index] || '');
            const correctAnswer = normalizeText(item.native);
            if (userAnswer === correctAnswer) {
                correct++;
            }
        });
        return { correct, total: totalQuestions };
    };

    // Completion screen
    if (isComplete) {
        const score = getOverallScore();
        return (
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-orange-500 mb-4">🎉 Quiz Complete!</h2>
                    <div className="bg-orange-900 border border-orange-600 rounded-lg p-6 mb-6">
                        <h3 className="text-xl font-semibold text-orange-200 mb-2">Final Score</h3>
                        <p className="text-3xl font-bold text-orange-400">{score.correct}/{score.total}</p>
                        <p className="text-lg text-orange-300">{Math.round((score.correct / score.total) * 100)}%</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={onStartVocabQuiz}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold"
                        >
                            Try Vocabulary Quiz Next
                        </button>
                        <button
                            onClick={onBackToMenu}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold"
                        >
                            Back to Quiz Menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Question card
    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-orange-500">🔄 Reverse Translation</h2>
                <div className="text-sm text-gray-400">
                    Question {currentQuestion + 1} of {totalQuestions}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
                <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                ></div>
            </div>

            {/* Question Card */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-600">
                <div className="text-center">
                    <p className="text-gray-300 text-lg mb-2">Translate this Spanish word to English:</p>
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <h3 className="text-3xl font-bold text-orange-400">{currentItem.target}</h3>
                        <button
                            onClick={() => speakText(currentItem.target, 'es-ES')}
                            className="text-blue-400 hover:text-blue-300 text-xl transition-colors"
                            title="Pronounce Spanish word"
                        >
                            🔊
                        </button>
                    </div>

                    <input
                        type="text"
                        className="w-full max-w-md mx-auto p-3 text-center text-lg border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
                        placeholder="Enter English translation..."
                        value={answers[currentQuestion] || ""}
                        onChange={(e) => updateCurrentAnswer(e.target.value)}
                        disabled={showResult}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !showResult && answers[currentQuestion]?.trim()) {
                                checkAnswer();
                            }
                        }}
                    />
                </div>

                {/* Result */}
                {showResult && (
                    <div className="mt-6 text-center">
                        <div className={`p-4 rounded-lg ${isCorrect() ? 'bg-green-900 border border-green-600' : 'bg-red-900 border border-red-600'}`}>
                            {isCorrect() ? (
                                <div>
                                    <p className="text-green-400 font-bold text-lg">✓ Correct!</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-red-400 font-bold text-lg">✗ Incorrect</p>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <p className="text-red-300">Correct answer: <strong>{currentItem.native}</strong></p>
                                        <button
                                            onClick={() => speakText(currentItem.native, 'en-US')}
                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                            title="Pronounce correct answer"
                                        >
                                            🔊
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
                    {!showResult ? (
                        <button
                            onClick={checkAnswer}
                            disabled={!answers[currentQuestion]?.trim()}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Check Answer
                        </button>
                    ) : (
                        <button
                            onClick={nextQuestion}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold"
                        >
                            {currentQuestion < totalQuestions - 1 ? 'Next Question →' : 'Finish Quiz'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}