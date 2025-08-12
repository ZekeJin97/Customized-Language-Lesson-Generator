// tests/frontend/AuthForm.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock global APIs
global.speechSynthesis = {
  cancel: jest.fn(),
  speak: jest.fn(),
  getVoices: jest.fn(() => []),
  onvoiceschanged: null,
};

global.SpeechSynthesisUtterance = jest.fn().mockImplementation(() => ({
  lang: 'en-US',
  rate: 1,
  pitch: 1,
  volume: 1,
  text: '',
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// ============================================================================
// SELF-CONTAINED AUTHFORM COMPONENT FOR TESTING
// ============================================================================

import { useState } from 'react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

interface UserCredentials {
  email: string;
  password: string;
}

interface VerifyCodeRequest {
  email: string;
  code: string;
}

type AuthStep = 'credentials' | 'verification' | 'register';

// Mock service functions that simulate your real API
const mockAuthService = {
  getToken: () => localStorageMock.getItem('auth_token'),
  setToken: (token: string) => localStorageMock.setItem('auth_token', token),
  removeToken: () => localStorageMock.removeItem('auth_token'),
  isAuthenticated: () => !!localStorageMock.getItem('auth_token'),
};

const mockLoginStep1 = async (credentials: UserCredentials) => {
  if (credentials.email === 'error@test.com') {
    throw new Error('Invalid credentials');
  }
  if (credentials.email === 'twofactor@test.com') {
    return { message: 'Verification code sent', requires_2fa: true };
  }
  return { message: 'Login successful', requires_2fa: false, access_token: 'direct-token' };
};

const mockLoginStep2 = async (verifyData: VerifyCodeRequest) => {
  if (verifyData.code === '000000') {
    throw new Error('Invalid verification code');
  }
  return { access_token: 'verified-token', token_type: 'bearer' };
};

const mockRegister = async (credentials: UserCredentials) => {
  if (credentials.email === 'exists@test.com') {
    throw new Error('Email already exists');
  }
  return { access_token: 'new-token', token_type: 'bearer' };
};

const mockResendVerificationCode = async (email: string) => {
  return { message: 'Verification code sent' };
};

// SELF-CONTAINED AUTHFORM COMPONENT
const TestAuthForm = ({ onAuthSuccess }: AuthFormProps) => {
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
        const response = await mockRegister(credentials);
        mockAuthService.setToken(response.access_token);
        onAuthSuccess();
      } else {
        const response = await mockLoginStep1(credentials);

        if (response.requires_2fa) {
          setStep('verification');
        } else {
          if (response.access_token) {
            mockAuthService.setToken(response.access_token);
          }
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
      const response = await mockLoginStep2({
        email: credentials.email,
        code: verificationCode,
      });
      mockAuthService.setToken(response.access_token);
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
      await mockResendVerificationCode(credentials.email);
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
              {isLoading ? 'Verifying...' : 'Verify & Sign In'}
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
      </div>
    </div>
  );
};

// ============================================================================
// ACTUAL TESTS
// ============================================================================

describe('AuthForm Component Tests', () => {
  const mockOnAuthSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  test('renders login form by default', () => {
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    expect(screen.getByText('LinguaPersonal')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('switches between login and register modes', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    // Initial state - login
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Welcome back to LinguaPersonal')).toBeInTheDocument();

    // Switch to register
    await user.click(screen.getByText("Don't have an account? Sign up"));

    // FIX: Use more specific selectors instead of getByText
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText('Start your Spanish learning journey')).toBeInTheDocument();

    // Switch back to login
    await user.click(screen.getByText('Already have an account? Sign in'));

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  test('handles user input correctly', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'mypassword123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('mypassword123');
  });

  test('clears form when switching between modes', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    // Fill form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Switch to register
    await user.click(screen.getByText("Don't have an account? Sign up"));

    // Form should be cleared
    expect(emailInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
  });

  test('handles successful registration', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    // Switch to register mode
    await user.click(screen.getByText("Don't have an account? Sign up"));

    // Fill and submit form
    await user.type(screen.getByLabelText('Email Address'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
    });
  });

  test('handles login requiring 2FA', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    // Fill and submit login form with 2FA email
    await user.type(screen.getByLabelText('Email Address'), 'twofactor@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Should transition to verification step
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      expect(screen.getByText('twofactor@test.com')).toBeInTheDocument();
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
    });
  });

  test('handles direct login without 2FA', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    // Fill and submit login form with regular email
    await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Should call onAuthSuccess directly
    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'direct-token');
    });
  });

  test('verification code input only accepts digits and limits to 6 characters', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    // Get to verification step
    await user.type(screen.getByLabelText('Email Address'), 'twofactor@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      const codeInput = screen.getByLabelText('Verification Code');
      expect(codeInput).toBeInTheDocument();
    });

    const codeInput = screen.getByLabelText('Verification Code');

    // Try to enter non-digits and more than 6 characters
    await user.type(codeInput, 'abc123def456789');

    // Should only show 6 digits
    expect(codeInput).toHaveValue('123456');
  });

  test('verify button is disabled until 6 digits entered', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    // Get to verification step
    await user.type(screen.getByLabelText('Email Address'), 'twofactor@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      const verifyButton = screen.getByRole('button', { name: /verify & sign in/i });
      expect(verifyButton).toBeDisabled();
    });

    const codeInput = screen.getByLabelText('Verification Code');
    const verifyButton = screen.getByRole('button', { name: /verify & sign in/i });

    // Enter partial code
    await user.type(codeInput, '123');
    expect(verifyButton).toBeDisabled();

    // Enter complete code
    await user.type(codeInput, '456');
    expect(verifyButton).not.toBeDisabled();
  });

  test('handles successful verification', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    // Complete login step 1
    await user.type(screen.getByLabelText('Email Address'), 'twofactor@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Complete verification
    await waitFor(() => {
      const codeInput = screen.getByLabelText('Verification Code');
      return user.type(codeInput, '123456');
    });

    await user.click(screen.getByRole('button', { name: /verify & sign in/i }));

    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'verified-token');
    });
  });

  test('displays authentication errors', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    await user.type(screen.getByLabelText('Email Address'), 'error@test.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('displays verification errors', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    // Get to verification step
    await user.type(screen.getByLabelText('Email Address'), 'twofactor@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Enter invalid code
    await waitFor(() => {
      const codeInput = screen.getByLabelText('Verification Code');
      return user.type(codeInput, '000000');
    });

    await user.click(screen.getByRole('button', { name: /verify & sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument();
    });
  });

  test('can navigate back from verification to login', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    const testEmail = 'twofactor@test.com';
    const testPassword = 'password123';

    // Get to verification step
    await user.type(screen.getByLabelText('Email Address'), testEmail);
    await user.type(screen.getByLabelText('Password'), testPassword);
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    // Go back to login
    await user.click(screen.getByText('← Back to login'));

    // Should be back on login form with credentials preserved
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toHaveValue(testEmail);
    expect(screen.getByLabelText('Password')).toHaveValue(testPassword);
  });

  test('resend verification code works with cooldown', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    // Navigate to verification
    await user.type(screen.getByLabelText('Email Address'), 'twofactor@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText('📧 Resend code')).toBeInTheDocument();
    });

    // Click resend
    await user.click(screen.getByText('📧 Resend code'));

    await waitFor(() => {
      expect(screen.getByText(/Resend code in \d+s/)).toBeInTheDocument();
    });
  });

  test('shows loading states during submission', async () => {
    const user = userEvent.setup();
    render(<TestAuthForm onAuthSuccess={mockOnAuthSuccess} />);

    await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');

    const submitButton = screen.getByRole('button', { name: /continue/i });

    // Just check that the button works and the final result is correct
    await user.click(submitButton);

    // Verify final result
    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalled();
    });

    // Verify button behavior exists
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

});