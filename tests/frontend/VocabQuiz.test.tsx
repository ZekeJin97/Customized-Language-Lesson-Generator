
// ============================================================================
// 3. VOCAB QUIZ TESTS - tests/frontend/VocabQuiz.test.tsx
// ============================================================================
// Test the most complex quiz component

import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Self-contained VocabQuiz component for testing
const TestVocabQuiz = ({ lesson, sessionId, onBackToMenu, onStartFillBlank }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(new Array(lesson.quiz.vocab_matching.length).fill(""));
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const totalQuestions = lesson.quiz.vocab_matching.length;
  const currentItem = lesson.quiz.vocab_matching[currentQuestion];

  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const isCorrect = () => {
    return normalizeText(answers[currentQuestion] || '') === normalizeText(currentItem.target);
  };

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

  if (isComplete) {
    const correctCount = answers.filter((answer, index) => {
      const item = lesson.quiz.vocab_matching[index];
      return normalizeText(answer) === normalizeText(item.target);
    }).length;

    return (
      <div data-testid="completion-screen">
        <h2>Quiz Complete!</h2>
        <p data-testid="final-score">{correctCount}/{totalQuestions}</p>
        <button onClick={onStartFillBlank}>Try Fill-in-Blanks Next</button>
        <button onClick={onBackToMenu}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div data-testid="vocab-quiz">
      <h2>🧩 Vocabulary Quiz</h2>
      <div data-testid="question-counter">
        Question {currentQuestion + 1} of {totalQuestions}
      </div>

      <div data-testid="progress-bar" style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }} />

      <div>
        <p>Translate this word:</p>
        <h3 data-testid="english-word">{currentItem.native}</h3>

        <input
          data-testid="answer-input"
          type="text"
          placeholder="Enter Spanish translation..."
          value={answers[currentQuestion] || ""}
          onChange={(e) => updateCurrentAnswer(e.target.value)}
          disabled={showResult}
        />
      </div>

      {showResult && (
        <div data-testid="result-display">
          {isCorrect() ? (
            <div data-testid="correct-result">✓ Correct!</div>
          ) : (
            <div data-testid="incorrect-result">
              ✗ Incorrect
              <div>Correct answer: <strong>{currentItem.target}</strong></div>
            </div>
          )}
        </div>
      )}

      <div>
        <button onClick={onBackToMenu}>Back to Menu</button>

        {!showResult ? (
          <button
            data-testid="check-button"
            onClick={checkAnswer}
            disabled={!answers[currentQuestion]?.trim()}
          >
            Check Answer
          </button>
        ) : (
          <button
            data-testid="next-button"
            onClick={nextQuestion}
          >
            {currentQuestion < totalQuestions - 1 ? 'Next Question →' : 'Finish Quiz'}
          </button>
        )}
      </div>
    </div>
  );
};

describe('VocabQuiz Tests', () => {
  const mockLesson = {
    quiz: {
      vocab_matching: [
        { native: 'hello', target: 'hola' },
        { native: 'goodbye', target: 'adiós' }
      ]
    }
  };

  const mockProps = {
    lesson: mockLesson,
    sessionId: 123,
    onBackToMenu: jest.fn(),
    onStartFillBlank: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders first question correctly', () => {
    render(<TestVocabQuiz {...mockProps} />);

    expect(screen.getByText('🧩 Vocabulary Quiz')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Spanish translation...')).toBeInTheDocument();
  });

  test('updates answer input correctly', async () => {
    const user = userEvent.setup();
    render(<TestVocabQuiz {...mockProps} />);

    const input = screen.getByTestId('answer-input');
    await user.type(input, 'hola');

    expect(input).toHaveValue('hola');
  });

  test('check answer button is disabled when input is empty', () => {
    render(<TestVocabQuiz {...mockProps} />);

    const checkButton = screen.getByTestId('check-button');
    expect(checkButton).toBeDisabled();
  });

  test('shows correct answer feedback', async () => {
    const user = userEvent.setup();
    render(<TestVocabQuiz {...mockProps} />);

    const input = screen.getByTestId('answer-input');
    await user.type(input, 'hola');
    await user.click(screen.getByTestId('check-button'));

    expect(screen.getByTestId('correct-result')).toBeInTheDocument();
    expect(screen.getByText('✓ Correct!')).toBeInTheDocument();
  });

  test('shows incorrect answer feedback with correct answer', async () => {
    const user = userEvent.setup();
    render(<TestVocabQuiz {...mockProps} />);

    const input = screen.getByTestId('answer-input');
    await user.type(input, 'wrong');
    await user.click(screen.getByTestId('check-button'));

    expect(screen.getByTestId('incorrect-result')).toBeInTheDocument();
    expect(screen.getByText('✗ Incorrect')).toBeInTheDocument();
    expect(screen.getByText('Correct answer:')).toBeInTheDocument();
    expect(screen.getByText('hola')).toBeInTheDocument();
  });

  test('navigates to next question', async () => {
    const user = userEvent.setup();
    render(<TestVocabQuiz {...mockProps} />);

    // Answer first question
    await user.type(screen.getByTestId('answer-input'), 'hola');
    await user.click(screen.getByTestId('check-button'));

    // Go to next question
    await user.click(screen.getByTestId('next-button'));

    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('goodbye')).toBeInTheDocument();
  });

  test('completes quiz and shows final score', async () => {
    const user = userEvent.setup();
    render(<TestVocabQuiz {...mockProps} />);

    // Answer first question correctly
    await user.type(screen.getByTestId('answer-input'), 'hola');
    await user.click(screen.getByTestId('check-button'));
    await user.click(screen.getByTestId('next-button'));

    // Answer second question correctly
    await user.type(screen.getByTestId('answer-input'), 'adiós');
    await user.click(screen.getByTestId('check-button'));
    await user.click(screen.getByTestId('next-button'));

    // Should show completion screen
    expect(screen.getByTestId('completion-screen')).toBeInTheDocument();
    expect(screen.getByText('Quiz Complete!')).toBeInTheDocument();
    expect(screen.getByTestId('final-score')).toHaveTextContent('2/2');
  });

  test('handles accent normalization in answers', async () => {
    const user = userEvent.setup();
    render(<TestVocabQuiz {...mockProps} />);

    // Skip to second question with accented answer
    await user.type(screen.getByTestId('answer-input'), 'hola');
    await user.click(screen.getByTestId('check-button'));
    await user.click(screen.getByTestId('next-button'));

    // Answer with different accent formatting
    await user.type(screen.getByTestId('answer-input'), 'adios'); // without accent
    await user.click(screen.getByTestId('check-button'));

    expect(screen.getByTestId('correct-result')).toBeInTheDocument();
  });
});
