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

interface VocabQuizProps {
    lesson: Lesson;
    onBackToMenu: () => void;
    onStartFillBlank: () => void;
}

export default function VocabQuiz({ lesson, onBackToMenu, onStartFillBlank }: VocabQuizProps) {
    const [answers, setAnswers] = useState<string[]>(new Array(lesson.quiz.vocab_matching.length).fill(""));
    const [showResults, setShowResults] = useState<boolean>(false);

    const getScore = () => {
        let correct = 0;
        lesson.quiz.vocab_matching.forEach((item, index) => {
            const userAnswer = normalizeText(answers[index] || '');
            const correctAnswer = normalizeText(item.target);
            if (userAnswer === correctAnswer) {
                correct++;
            }
        });
        return { correct, total: lesson.quiz.vocab_matching.length };
    };

    const updateAnswer = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-green-700 mb-4">🧩 Vocabulary Quiz</h2>

            <div className="space-y-4">
                {lesson.quiz.vocab_matching.map((item, index) => (
                    <div key={index} className="border border-gray-600 bg-gray-800 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-300">
                                Translate: <strong className="text-white">{item.native}</strong>
                            </p>
                            <button
                                onClick={() => speakText(item.native, 'en-US')}
                                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                title="Pronounce English word"
                            >
                                🔊 EN
                            </button>
                        </div>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:ring-2 focus:ring-green-500 placeholder-gray-400"
                            placeholder="Spanish translation..."
                            value={answers[index] || ""}
                            onChange={(e) => updateAnswer(index, e.target.value)}
                            disabled={showResults}
                        />
                        {showResults && (
                            <div className="mt-2 flex items-center justify-between">
                                {normalizeText(answers[index] || '') === normalizeText(item.target) ? (
                                    <span className="text-green-600 font-semibold">✓ Correct!</span>
                                ) : (
                                    <span className="text-red-600 font-semibold">✗ Answer: {item.target}</span>
                                )}
                                <button
                                    onClick={() => speakText(item.target)}
                                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                    title="Pronounce correct answer"
                                >
                                    🔊 ES
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showResults && (
                <div className="mt-4 p-3 bg-green-900 border border-green-600 rounded">
                    <strong className="text-green-200">Score: {getScore().correct}/{getScore().total}</strong>
                </div>
            )}

            <div className="mt-4 flex gap-2">
                {!showResults ? (
                    <button
                        onClick={() => setShowResults(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                    >
                        Check Answers
                    </button>
                ) : (
                    <button
                        onClick={onStartFillBlank}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                    >
                        Try Fill-in-Blanks
                    </button>
                )}
                <button
                    onClick={onBackToMenu}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold"
                >
                    Back to Menu
                </button>
            </div>
        </div>
    );
}