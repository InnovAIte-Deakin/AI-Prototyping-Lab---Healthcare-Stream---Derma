import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════════════════
   LoginPage — The Welcome

   This is often the first real interaction someone has with SkinScope.
   It should feel welcoming, not like a barrier. Warm, simple, human.
   ═══════════════════════════════════════════════════════════════════════════ */

function LoginPage() {
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsSignup(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);

      let user;
      if (isSignup) {
        user = await signup({
          email: emailTrim,
          password,
          role: 'patient',
          public_session_id: searchParams.get('public_session_id')
        });
      } else {
        user = await login({ email: emailTrim, password });
      }

      const userRole = user.role;
      if (userRole === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      console.error(err);
      let msg = 'Authentication failed. Please check your credentials.';

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        msg = detail.map(d => {
          if (d.loc.includes('password') && d.type === 'string_too_short') {
            return 'Password must be at least 6 characters';
          }
          return d.msg;
        }).join('. ');
      } else if (detail) {
        msg = detail;
      }

      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center -mt-8 py-12">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pattern-cells opacity-30" aria-hidden="true" />

      <div className="relative w-full max-w-md px-4">
        {/* Card */}
        <div className="card-warm p-8 sm:p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-100 border border-warm-200">
              <svg className="h-7 w-7 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>

            <h1 className="mb-2 text-2xl font-semibold text-charcoal-900">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-charcoal-500">
              {isSignup
                ? 'Start your journey to better skin health'
                : 'Sign in to continue your skin health journey'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-charcoal-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-warm"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-charcoal-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-warm"
                placeholder={isSignup ? 'Create a secure password' : 'Enter your password'}
              />
              {isSignup && (
                <p className="text-xs text-charcoal-400 mt-1">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-warm w-full py-3.5 text-base"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                isSignup ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-charcoal-400">or</span>
            </div>
          </div>

          {/* Toggle Mode */}
          <div className="text-center">
            <p className="text-sm text-charcoal-600">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-warm-600 hover:text-warm-700 transition-colors"
              >
                {isSignup ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>

          {/* Try Anonymous Link */}
          <div className="mt-6 text-center">
            <Link
              to="/try-anonymous"
              className="inline-flex items-center gap-2 text-sm text-charcoal-500 hover:text-charcoal-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Try without an account
            </Link>
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-8 text-center text-xs text-charcoal-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
