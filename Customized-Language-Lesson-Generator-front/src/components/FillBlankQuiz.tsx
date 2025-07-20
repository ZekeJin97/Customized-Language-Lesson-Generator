// REPLACE: src/components/FillBlankQuiz.tsx

import { useState } from 'react';
import { Lesson, VocabItem } from '@/types/lesson';

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

// Fill blank creation function
function createFillBlank(sentence: string, vocabList: VocabItem[]) {
    for (const vocab of vocabList) {
        if (sentence.toLowerCase().includes(vocab.target.toLowerCase())) {
            return {
                sentence: sentence.replace(new RegExp(vocab.target, 'gi'), '___'),
                answer: vocab.target,
                fullSentence: sentence
            };
        }
    }
    const words = sentence.split(' ');
    const lastWord = words.pop() || '';
    return {
        sentence: words.join(' ') + ' ___',
        answer: lastWord,
        fullSentence: sentence
    };
}

interface FillBlankQuizProps {
    lesson: Lesson;
    onBackToMenu: () => void;
    onStartReverseQuiz: () => void;
}

export default function FillBlankQuiz({ lesson, onBackToMenu, onStartReverseQuiz }: FillBlankQuizProps) {
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [answers, setAnswers] = useState<string[]>(new Array(lesson.quiz.mini_translations.length).fill(""));
    const [showResult, setShowResult] = useState<boolean>(false);
    const [isComplete, setIsComplete] = useState<boolean>(false);

    const totalQuestions = lesson.quiz.mini_translations.length;
    const currentItem = lesson.quiz.mini_translations[currentQuestion];
    const currentFillBlank = createFillBlank(currentItem.target, lesson.vocabulary);

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
        return normalizeText(answers[currentQuestion] || '') === normalizeText(currentFillBlank.answer);
    };

    const getOverallScore = () => {
        let correct = 0;
        lesson.quiz.mini_translations.forEach((item, index) => {
            const fillBlank = createFillBlank(item.target, lesson.vocabulary);
            const userAnswer = normalizeText(answers[index] || '');
            const correctAnswer = normalizeText(fillBlank.answer);
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
                    <h2 className="text-2xl font-bold text-blue-500 mb-4">🎉 Quiz Complete!</h2>
                    <div className="bg-blue-900 border border-blue-600 rounded-lg p-6 mb-6">
                        <h3 className="text-xl font-semibold text-blue-200 mb-2">Final Score</h3>
                        <p className="text-3xl font-bold text-blue-400">{score.correct}/{score.total}</p>
                        <p className="text-lg text-blue-300">{Math.round((score.correct / score.total) * 100)}%</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={onStartReverseQuiz}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-semibold"
                        >
                            Try Reverse Translation Next
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
                <h2 className="text-xl font-semibold text-blue-700">📝 Fill in the Blanks</h2>
                <div className="text-sm text-gray-400">
                    Question {currentQuestion + 1} of {totalQuestions}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                ></div>
            </div>

            {/* Question Card */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-600">
                <div className="text-center">
                    {/* English sentence */}
                    <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-1">English:</p>
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-lg text-gray-300">{currentItem.native}</p>
                            <button
                                onClick={() => speakText(currentItem.native, 'en-US')}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Pronounce English sentence"
                            >
                                🔊
                            </button>
                        </div>
                    </div>

                    {/* Spanish sentence with blank */}
                    <div className="mb-6">
                        <p className="text-gray-400 text-sm mb-2">Complete the Spanish sentence:</p>
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <h3 className="text-xl font-bold text-blue-400 leading-relaxed">
                                {currentFillBlank.sentence}
                            </h3>
                            <button
                                onClick={() => speakText(currentFillBlank.fullSentence, 'es-ES')}
                                className="text-blue-400 hover:text-blue-300 text-lg transition-colors"
                                title="Pronounce full Spanish sentence"
                            >
                                🔊
                            </button>
                        </div>
                    </div>

                    <input
                        type="text"
                        className="w-full max-w-md mx-auto p-3 text-center text-lg border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        placeholder="Fill in the blank..."
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
                                    <p className="text-green-300 mt-2">
                                        Complete sentence: <em>{currentFillBlank.fullSentence}</em>
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-red-400 font-bold text-lg">✗ Incorrect</p>
                                    <div className="mt-2">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <p className="text-red-300">Missing word: <strong>{currentFillBlank.answer}</strong></p>
                                            <button
                                                onClick={() => speakText(currentFillBlank.answer, 'es-ES')}
                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                                title="Pronounce missing word"
                                            >
                                                🔊
                                            </button>
                                        </div>
                                        <p className="text-red-200 text-sm">
                                            Complete sentence: <em>{currentFillBlank.fullSentence}</em>
                                        </p>
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
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Check Answer
                        </button>
                    ) : (
                        <button
                            onClick={nextQuestion}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                        >
                            {currentQuestion < totalQuestions - 1 ? 'Next Question →' : 'Finish Quiz'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}