import { Lesson } from '@/types/lesson';

// TTS function
function speakText(text: string, lang: string = 'es-ES') {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.7;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    speechSynthesis.speak(utterance);
}

interface VocabularyDisplayProps {
    lesson: Lesson;
}

export default function VocabularyDisplay({ lesson }: VocabularyDisplayProps) {
    return (
        <div className="space-y-6">
            {/* Vocabulary Section */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">📖 Vocabulary</h2>
                <div className="space-y-2 mb-6">
                    {lesson.vocabulary.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg border border-gray-700">
                            <span className="font-medium text-gray-300">{item.native}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-purple-400">{item.target}</span>
                                <button
                                    onClick={() => speakText(item.target)}
                                    className="text-blue-400 hover:text-blue-300 text-lg transition-colors p-1 rounded hover:bg-gray-700"
                                    title="Pronounce in Spanish"
                                >
                                    🔊
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <h3 className="text-lg font-semibold text-gray-200 mb-3">📝 Grammar Tip</h3>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-start">
                    <p className="text-gray-300 text-sm flex-1 leading-relaxed">{lesson.grammar_notes}</p>
                    <button
                        onClick={() => speakText(lesson.grammar_notes, 'en-US')}
                        className="text-blue-400 hover:text-blue-300 text-lg ml-3 transition-colors p-1 rounded hover:bg-gray-700"
                        title="Read grammar notes"
                    >
                        🔊
                    </button>
                </div>
            </div>

            {/* Mini Translations Section */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">💭 Example Sentences</h2>
                <div className="space-y-3">
                    {lesson.quiz.mini_translations.map((item, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            {/* English sentence */}
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-300 text-sm font-medium">{item.native}</p>
                                <button
                                    onClick={() => speakText(item.native, 'en-US')}
                                    className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-gray-700"
                                    title="Pronounce English sentence"
                                >
                                    🔊
                                </button>
                            </div>

                            {/* Spanish sentence */}
                            <div className="flex justify-between items-center">
                                <p className="text-purple-400 font-semibold italic">{item.target}</p>
                                <button
                                    onClick={() => speakText(item.target, 'es-ES')}
                                    className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-gray-700"
                                    title="Pronounce Spanish sentence"
                                >
                                    🔊
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}