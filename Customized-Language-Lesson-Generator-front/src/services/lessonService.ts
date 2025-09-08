import { Lesson } from '@/types/lesson';

const API_BASE_URL = 'http://lingua-backend-alb-1866016173.us-east-2.elb.amazonaws.com';


export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginStep1Response {
  message: string;
  requires_2fa: boolean;
  access_token?: string;
  token_type?: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
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

export interface MistakeItem {
  question_text: string;
  user_answer: string;
  correct_answer: string;
  timestamp: string;
  language: string;
}

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

function getAuthHeaders(): HeadersInit {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function register(credentials: UserCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) throw new Error(await res.text());
  const authResponse: AuthResponse = await res.json();

  AuthService.setToken(authResponse.access_token);
  return authResponse;
}

export async function loginStep1(credentials: UserCredentials): Promise<LoginStep1Response> {
  const res = await fetch(`${API_BASE_URL}/login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) throw new Error(await res.text());
  const response: LoginStep1Response = await res.json();

  if (response.access_token) {
    AuthService.setToken(response.access_token);
  }

  return response;
}

export async function loginStep2(verifyData: VerifyCodeRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/login-step2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyData),
  });

  if (!res.ok) throw new Error(await res.text());
  const authResponse: AuthResponse = await res.json();

  AuthService.setToken(authResponse.access_token);
  return authResponse;
}

export async function resendVerificationCode(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/resend-verification-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function login(credentials: UserCredentials): Promise<LoginStep1Response> {
  return await loginStep1(credentials);
}

export function logout(): void {
  AuthService.removeToken();
}

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

export async function getUserMistakes(language?: string): Promise<MistakeItem[]> {
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