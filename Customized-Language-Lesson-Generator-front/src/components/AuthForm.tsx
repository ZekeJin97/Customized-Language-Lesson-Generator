'use client';

import { useState } from 'react';
import { loginStep1, loginStep2, register, resendVerificationCode, UserCredentials, VerifyCodeRequest } from '@/services/lessonService';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

type AuthStep = 'credentials' | 'verification' | 'register';

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [step, setStep] = useState<AuthStep>('credentials');
  const [credentials, setCredentials] = useState<UserCredentials>({
    email: '',
    password: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (step === 'register') {
        await register(credentials);
        onAuthSuccess();
      } else {
        const response = await loginStep1(credentials);

        if (response.requires_2fa) {
          setStep('verification');
        } else {
          onAuthSuccess();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await loginStep2({
        email: credentials.email,
        code: verificationCode,
      });
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError('');

    try {
      await resendVerificationCode(credentials.email);
      setResendCooldown(60);

      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  if (step === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full space-y-8 p-8 bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-purple-400">LinguaPersonal</h1>
            <div className="w-16 h-1 bg-purple-400 mx-auto mt-2 rounded"></div>
            <h2 className="text-2xl font-bold text-white mt-4">
              Check Your Email
            </h2>
            <p className="mt-2 text-gray-400">
              We sent a 6-digit code to
            </p>
            <p className="text-purple-400 font-medium">{credentials.email}</p>
          </div>

          <form onSubmit={handleVerificationSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <span className="text-lg mr-2">❌</span>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify & Sign In'
              )}
            </button>
          </form>

          <div className="text-center space-y-3">
            <button
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || isLoading}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? (
                <span>Resend code in {resendCooldown}s</span>
              ) : (
                <span>📧 Resend code</span>
              )}
            </button>

            <div>
              <button
                onClick={() => {
                  setStep('credentials');
                  setVerificationCode('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-300 text-sm font-medium transition-colors"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
        <div className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-purple-400">LinguaPersonal</h1>
            <div className="w-16 h-1 bg-purple-400 mx-auto mt-2 rounded"></div>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {step === 'register' ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="mt-2 text-gray-400">
            {step === 'register'
              ? 'Start your Spanish learning journey'
              : 'Welcome back to LinguaPersonal'
            }
          </p>
        </div>

        <form onSubmit={handleCredentialsSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={credentials.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={credentials.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              autoComplete={step === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-2">❌</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {step === 'credentials' && (
            <div className="bg-blue-900/50 border border-blue-600 text-blue-300 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-2">🔒</span>
                <div className="text-sm">
                  <p className="font-medium">Two-factor authentication enabled</p>
                  <p className="text-blue-400 text-xs mt-1">
                    We&apos;ll send a verification code to your email after login
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              step === 'register' ? 'Create Account' : 'Continue'
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setStep(step === 'register' ? 'credentials' : 'register');
              setError('');
              setCredentials({ email: '', password: '' });
            }}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            {step === 'register'
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        <div className="text-center pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}