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
                answer: vocab.target
            };
        }
    }
    const words = sentence.split(' ');
    const lastWord = words.pop() || '';
    return {
        sentence: words.join(' ') + ' ___',
        answer: lastWord
    };
}

interface FillBlankQuizProps {
    lesson: Lesson;
    onBackToMenu: () => void;
    onStartVocabQuiz: () => void;
}

export default function FillBlankQuiz({ lesson, onBackToMenu, onStartVocabQuiz }: FillBlankQuizProps) {
    const [answers, setAnswers] = useState<string[]>(new Array(lesson.quiz.mini_translations.length).fill(""));
    const [showResults, setShowResults] = useState<boolean>(false);

    const getScore = () => {
        let correct = 0;
        lesson.quiz.mini_translations.forEach((item, index) => {
            const fillBlank = createFillBlank(item.target, lesson.vocabulary);
            const userAnswer = normalizeText(answers[index] || '');
            const correctAnswer = normalizeText(fillBlank.answer);
            if (userAnswer === correctAnswer) {
                correct++;
            }
        });
        return { correct, total: lesson.quiz.mini_translations.length };
    };

    const updateAnswer = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">📝 Fill in the Blanks</h2>

            <div className="space-y-4">
                {lesson.quiz.mini_translations.map((item, index) => {
                    const fillBlank = createFillBlank(item.target, lesson.vocabulary);
                    return (
                        <div key={index} className="border border-gray-600 bg-gray-800 p-3 rounded">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-gray-400">English: {item.native}</p>
                                <button
                                    onClick={() => speakText(item.native, 'en-US')}
                                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                    title="Pronounce English"
                                >
                                    🔊 EN
                                </button>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-gray-300">
                                    Spanish: {fillBlank.sentence}
                                </p>
                                <button
                                    onClick={() => speakText(item.target)}
                                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                    title="Pronounce full Spanish sentence"
                                >
                                    🔊 ES
                                </button>
                            </div>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                placeholder="Fill in the blank..."
                                value={answers[index] || ""}
                                onChange={(e) => updateAnswer(index, e.target.value)}
                                disabled={showResults}
                            />
                            {showResults && (
                                <div className="mt-2 flex items-center justify-between">
                                    {normalizeText(answers[index] || '') === normalizeText(fillBlank.answer) ? (
                                        <span className="text-green-600 font-semibold">✓ Correct!</span>
                                    ) : (
                                        <span className="text-red-600 font-semibold">✗ Answer: {fillBlank.answer}</span>
                                    )}
                                    <button
                                        onClick={() => speakText(fillBlank.answer)}
                                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                        title="Pronounce correct answer"
                                    >
                                        🔊
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showResults && (
                <div className="mt-4 p-3 bg-blue-900 border border-blue-600 rounded">
                    <strong className="text-blue-200">Score: {getScore().correct}/{getScore().total}</strong>
                </div>
            )}

            <div className="mt-4 flex gap-2">
                {!showResults ? (
                    <button
                        onClick={() => setShowResults(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                    >
                        Check Answers
                    </button>
                ) : (
                    <button
                        onClick={onStartVocabQuiz}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                    >
                        Try Vocab Quiz
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
