import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

/**
 * Login page — email + password form.
 * Redirects to /dashboard on successful authentication.
 */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    await login(email, password);

    // Check if login succeeded (no error thrown means success)
    // We need to read from authService directly since state update is async
    // Actually, useAuth sets user state — but navigate needs to fire after state update.
    // The login function in AuthContext catches errors and sets error state.
    // If no error, we navigate.
  }

  // Use effect-like approach: if user is set and we just submitted, navigate
  const { user } = useAuth();

  // Navigate after successful login
  if (user && !isLoading) {
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">HortiSort</h1>
          <p className="text-gray-500 mt-1">Machine Monitoring Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
