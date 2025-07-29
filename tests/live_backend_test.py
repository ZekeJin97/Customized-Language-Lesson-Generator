# tests/live_backend_test.py
"""
Live Backend Tests - Tests against your actual deployed backend
Run with: python tests/live_backend_test.py
"""
import requests
import json
import time
import random
from datetime import datetime

# Your live backend URL
BASE_URL = "http://18.216.241.178:8000"


class LiveBackendTester:
    def __init__(self):
        self.token = None
        self.session_id = None

    def test_user_registration_and_login(self):
        """Test actual user registration and login flow"""
        print("🧪 Testing User Registration & Login...")

        # Generate unique email for testing
        timestamp = int(time.time())
        test_email = f"test_{timestamp}@example.com"
        test_password = "testpassword123"

        # Test Registration
        print(f"📝 Registering user: {test_email}")
        register_data = {
            "email": test_email,
            "password": test_password
        }

        register_response = requests.post(f"{BASE_URL}/register", json=register_data)

        if register_response.status_code == 200:
            register_result = register_response.json()
            print(f"✅ Registration successful!")
            print(f"   Token received: {register_result['access_token'][:50]}...")
            self.token = register_result['access_token']
        else:
            print(f"❌ Registration failed: {register_response.status_code}")
            print(f"   Error: {register_response.text}")
            return False

        # Test Login with same credentials
        print(f"🔐 Testing login with same credentials...")
        login_response = requests.post(f"{BASE_URL}/login", json=register_data)

        if login_response.status_code == 200:
            login_result = login_response.json()
            print(f"✅ Login successful!")
            print(f"   New token: {login_result['access_token'][:50]}...")
            self.token = login_result['access_token']  # Use login token
            return True
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"   Error: {login_response.text}")
            return False

    def test_lesson_generation(self, prompt):
        """Test actual lesson generation with different prompts"""
        print(f"\n🧪 Testing Lesson Generation with prompt: '{prompt}'")

        if not self.token:
            print("❌ No authentication token available")
            return None

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        lesson_data = {
            "user_prompt": prompt,
            "target_lang": "Spanish",
            "native_lang": "English"
        }

        print("📡 Calling OpenAI via your backend...")
        start_time = time.time()

        lesson_response = requests.post(f"{BASE_URL}/generate-lesson",
                                        headers=headers,
                                        json=lesson_data)

        end_time = time.time()
        duration = end_time - start_time

        if lesson_response.status_code == 200:
            lesson = lesson_response.json()
            self.session_id = lesson.get('session_id')

            print(f"✅ Lesson generated successfully in {duration:.2f} seconds!")
            print(f"   Session ID: {self.session_id}")
            print(f"   Vocabulary items: {len(lesson.get('vocabulary', []))}")
            print(f"   Quiz questions: {len(lesson.get('quiz', {}).get('vocab_matching', []))}")
            print(f"   Mini translations: {len(lesson.get('quiz', {}).get('mini_translations', []))}")

            # Show sample vocabulary
            print("\n📖 Sample Vocabulary:")
            for i, vocab in enumerate(lesson.get('vocabulary', [])[:3]):
                print(f"   {i + 1}. {vocab['native']} → {vocab['target']}")

            # Show sample quiz questions
            print("\n❓ Sample Quiz Questions:")
            for i, quiz in enumerate(lesson.get('quiz', {}).get('vocab_matching', [])[:3]):
                print(f"   {i + 1}. {quiz['native']} → {quiz['target']}")

            # Show mini translations
            print("\n💬 Sample Sentences:")
            for i, trans in enumerate(lesson.get('quiz', {}).get('mini_translations', [])[:2]):
                print(f"   {i + 1}. {trans['native']}")
                print(f"      → {trans['target']}")

            print(f"\n📝 Grammar Notes:")
            print(f"   {lesson.get('grammar_notes', 'N/A')[:100]}...")

            return lesson
        else:
            print(f"❌ Lesson generation failed: {lesson_response.status_code}")
            print(f"   Error: {lesson_response.text}")
            return None

    def test_quiz_submission(self, lesson):
        """Test submitting quiz attempts"""
        print(f"\n🧪 Testing Quiz Attempt Submission...")

        if not self.token or not self.session_id or not lesson:
            print("❌ Missing required data for quiz test")
            return False

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        # Get quiz questions
        vocab_questions = lesson.get('quiz', {}).get('vocab_matching', [])
        if not vocab_questions:
            print("❌ No quiz questions available")
            return False

        # Test with first question - submit correct answer
        first_question = vocab_questions[0]
        correct_attempt = {
            "session_id": self.session_id,
            "question_text": first_question['native'],
            "user_answer": first_question['target'],
            "correct_answer": first_question['target'],
            "is_correct": True
        }

        print(f"✅ Submitting CORRECT answer:")
        print(f"   Question: {first_question['native']}")
        print(f"   Answer: {first_question['target']}")

        correct_response = requests.post(f"{BASE_URL}/submit-quiz-attempt",
                                         headers=headers,
                                         json=correct_attempt)

        if correct_response.status_code == 200:
            result = correct_response.json()
            print(f"✅ Correct answer submitted successfully!")
            print(f"   Response: {result}")
        else:
            print(f"❌ Failed to submit correct answer: {correct_response.status_code}")

        # Test with second question - submit wrong answer
        if len(vocab_questions) > 1:
            second_question = vocab_questions[1]
            wrong_attempt = {
                "session_id": self.session_id,
                "question_text": second_question['native'],
                "user_answer": "wrong_answer",
                "correct_answer": second_question['target'],
                "is_correct": False
            }

            print(f"\n❌ Submitting WRONG answer:")
            print(f"   Question: {second_question['native']}")
            print(f"   Wrong Answer: wrong_answer")
            print(f"   Correct Answer: {second_question['target']}")

            wrong_response = requests.post(f"{BASE_URL}/submit-quiz-attempt",
                                           headers=headers,
                                           json=wrong_attempt)

            if wrong_response.status_code == 200:
                result = wrong_response.json()
                print(f"✅ Wrong answer submitted successfully!")
                print(f"   Response: {result}")
            else:
                print(f"❌ Failed to submit wrong answer: {wrong_response.status_code}")

        return True

    def test_user_progress(self):
        """Test retrieving user progress"""
        print(f"\n🧪 Testing User Progress Retrieval...")

        if not self.token:
            print("❌ No authentication token available")
            return False

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        progress_response = requests.get(f"{BASE_URL}/user-progress", headers=headers)

        if progress_response.status_code == 200:
            progress_data = progress_response.json()
            print(f"✅ Progress retrieved successfully!")

            if progress_data:
                for progress in progress_data:
                    accuracy = (progress['correct_answers'] / progress['total_questions'] * 100) if progress[
                                                                                                        'total_questions'] > 0 else 0
                    print(f"   Language: {progress['language']}")
                    print(f"   Total Questions: {progress['total_questions']}")
                    print(f"   Correct Answers: {progress['correct_answers']}")
                    print(f"   Accuracy: {accuracy:.1f}%")
            else:
                print("   No progress data yet")

            return True
        else:
            print(f"❌ Failed to retrieve progress: {progress_response.status_code}")
            return False

    def test_user_mistakes(self):
        """Test retrieving user mistakes"""
        print(f"\n🧪 Testing User Mistakes Retrieval...")

        if not self.token:
            print("❌ No authentication token available")
            return False

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        mistakes_response = requests.get(f"{BASE_URL}/user-mistakes", headers=headers)

        if mistakes_response.status_code == 200:
            mistakes_data = mistakes_response.json()
            print(f"✅ Mistakes retrieved successfully!")

            if mistakes_data:
                print(f"   Found {len(mistakes_data)} mistakes:")
                for i, mistake in enumerate(mistakes_data[:3]):  # Show first 3
                    print(f"   {i + 1}. Question: {mistake.get('question_text', 'N/A')}")
                    print(f"      Your Answer: {mistake.get('user_answer', 'N/A')}")
                    print(f"      Correct Answer: {mistake.get('correct_answer', 'N/A')}")
            else:
                print("   No mistakes found (perfect score!)")

            return True
        else:
            print(f"❌ Failed to retrieve mistakes: {mistakes_response.status_code}")
            return False


def run_live_tests():
    """Run all live tests against the deployed backend"""
    print("🚀 Starting Live Backend Tests")
    print(f"🌐 Testing against: {BASE_URL}")
    print("=" * 60)

    tester = LiveBackendTester()

    # Test different lesson prompts
    test_prompts = [
        "ordering food at a restaurant",
        "asking for directions in a city",
        "shopping for clothes"
    ]

    try:
        # Test authentication
        if not tester.test_user_registration_and_login():
            print("❌ Authentication tests failed, stopping...")
            return

        # Test lesson generation with different prompts
        lessons = []
        for prompt in test_prompts:
            lesson = tester.test_lesson_generation(prompt)
            if lesson:
                lessons.append(lesson)

                # Test quiz submission for this lesson
                tester.test_quiz_submission(lesson)

            print("\n" + "-" * 40)

        # Test progress and mistakes
        tester.test_user_progress()
        tester.test_user_mistakes()

        print("\n" + "=" * 60)
        print("🎉 Live backend tests completed!")
        print(f"✅ Tested {len(lessons)} lesson generations")
        print("✅ Tested user authentication")
        print("✅ Tested quiz submissions")
        print("✅ Tested progress tracking")
        print("✅ Tested mistake recording")

    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to backend at {BASE_URL}")
        print("   Make sure your backend is running and accessible")
    except Exception as e:
        print(f"💥 Test failed with error: {e}")


if __name__ == "__main__":
    run_live_tests()