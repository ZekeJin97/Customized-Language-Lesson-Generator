interface QuizSelectorProps {
    onStartVocabQuiz: () => void;
    onStartFillBlankQuiz: () => void;
}

export default function QuizSelector({ onStartVocabQuiz, onStartFillBlankQuiz }: QuizSelectorProps) {
    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-200 mb-6">Choose a Quiz</h2>
                <div className="space-y-4">
                    <button
                        onClick={onStartVocabQuiz}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold"
                    >
                        🧩 Vocabulary Matching
                    </button>
                    <button
                        onClick={onStartFillBlankQuiz}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold"
                    >
                        📝 Fill in the Blanks
                    </button>
                </div>
            </div>
        </div>
    );
}