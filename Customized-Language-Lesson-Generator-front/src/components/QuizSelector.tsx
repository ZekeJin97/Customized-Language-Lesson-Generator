interface QuizSelectorProps {
    onStartVocabQuiz: () => void;
    onStartFillBlankQuiz: () => void;
    onStartReverseQuiz: () => void;
    onStartMistakesReview: () => void; // Added new prop
}

export default function QuizSelector({
    onStartVocabQuiz,
    onStartFillBlankQuiz,
    onStartReverseQuiz,
    onStartMistakesReview
}: QuizSelectorProps) {
    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-200 mb-6">Choose a Quiz</h2>
                <div className="space-y-4">
                    <button
                        onClick={onStartVocabQuiz}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
                    >
                        🧩 Vocabulary Matching
                        <p className="text-sm text-green-200 mt-1">English → Spanish</p>
                    </button>
                    <button
                        onClick={onStartReverseQuiz}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
                    >
                        🔄 Reverse Translation
                        <p className="text-sm text-orange-200 mt-1">Spanish → English</p>
                    </button>
                    <button
                        onClick={onStartFillBlankQuiz}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
                    >
                        📝 Fill in the Blanks
                        <p className="text-sm text-blue-200 mt-1">Complete Spanish sentences</p>
                    </button>

                    {/* New Mistakes Review Button */}
                    <div className="border-t border-gray-600 pt-4 mt-6">
                        <button
                            onClick={onStartMistakesReview}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
                        >
                            📋 Review Mistakes
                            <p className="text-sm text-red-200 mt-1">Practice your incorrect answers</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}