import { Lesson } from '@/types/lesson';

// Update this to your current backend URL
const API_BASE_URL = 'http://3.14.82.39:8000';

// Authentication types
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface QuizAttempt {
  session_id: number;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export interface UserProgress {
  user_id: number;
  language: string;
  total_questions: number;
  correct_answers: number;
  last_studied: string;
}

// Token management
export class AuthService {
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Authentication endpoints
export async function register(credentials: UserCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) throw new Error(await res.text());
  const authResponse: AuthResponse = await res.json();

  // Store token automatically
  AuthService.setToken(authResponse.access_token);
  return authResponse;
}

export async function login(credentials: UserCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) throw new Error(await res.text());
  const authResponse: AuthResponse = await res.json();

  // Store token automatically
  AuthService.setToken(authResponse.access_token);
  return authResponse;
}

export function logout(): void {
  AuthService.removeToken();
}

// Updated lesson generation with authentication
export async function generateLesson(prompt: string): Promise<Lesson & { session_id: number }> {
  const token = AuthService.getToken();
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  const res = await fetch(`${API_BASE_URL}/generate-lesson`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      user_prompt: prompt,
      target_lang: 'Spanish',
      native_lang: 'English',
    }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      AuthService.removeToken();
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(await res.text());
  }

  return await res.json();
}

// Quiz attempt submission
export async function submitQuizAttempt(attempt: QuizAttempt): Promise<{ message: string; is_correct: boolean }> {
  const res = await fetch(`${API_BASE_URL}/submit-quiz-attempt`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(attempt),
  });

  if (!res.ok) {
    if (res.status === 401) {
      AuthService.removeToken();
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(await res.text());
  }

  return await res.json();
}

// Get user progress
export async function getUserProgress(): Promise<UserProgress[]> {
  const res = await fetch(`${API_BASE_URL}/user-progress`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401) {
      AuthService.removeToken();
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(await res.text());
  }

  return await res.json();
}

// Get user mistakes
export async function getUserMistakes(language?: string): Promise<any[]> {
  const url = language
    ? `${API_BASE_URL}/user-mistakes?language=${encodeURIComponent(language)}`
    : `${API_BASE_URL}/user-mistakes`;

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401) {
      AuthService.removeToken();
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(await res.text());
  }

  return await res.json();
}