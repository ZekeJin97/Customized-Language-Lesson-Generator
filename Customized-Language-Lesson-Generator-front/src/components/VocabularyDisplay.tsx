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
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">📖 Vocabulary</h2>
            <div className="space-y-2 mb-6">
                {lesson.vocabulary.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                        <span className="font-medium text-gray-300">{item.native}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-400">{item.target}</span>
                            <button
                                onClick={() => speakText(item.target)}
                                className="text-blue-400 hover:text-blue-300 text-lg transition-colors"
                                title="Pronounce in Spanish"
                            >
                                🔊
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <h3 className="text-lg font-semibold text-gray-200 mb-2">📝 Grammar Tip</h3>
            <div className="bg-gray-800 p-3 rounded flex justify-between items-start">
                <p className="text-gray-300 text-sm flex-1">{lesson.grammar_notes}</p>
                <button
                    onClick={() => speakText(lesson.grammar_notes)}
                    className="text-blue-400 hover:text-blue-300 text-lg ml-3 transition-colors"
                    title="Read grammar notes"
                >
                    🔊
                </button>
            </div>
        </div>
    );
}
