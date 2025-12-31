import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uiTokens } from '../components/Layout';

const accent = 'from-[#e7f7f4] via-white to-[#f7ecf7]';
const heroTitleAccent = 'text-[#4c7dff]';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Role is now auto-assigned: Patient for signup, auto-detected for login.
  // const [role, setRole] = useState('patient'); 
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Detect mode from URL (e.g. /login?mode=signup)
  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsSignup(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const emailTrim = email.trim();
    if (!emailTrim || !password) { // Don't trim password
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);

      let user;
      if (isSignup) {
        // Signup forces 'patient' role for now
        user = await signup({ 
          email: emailTrim, 
          password, 
          role: 'patient',
          public_session_id: searchParams.get('public_session_id')
        });
      } else {
        // Login detects role automatically
        user = await login({ email: emailTrim, password });
      }

      // Route based on role
      const userRole = user.role;
      if (userRole === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      console.error(err);
      // Enhanced Error Parsing
      let msg = 'Authentication failed. Please check your credentials.';

      const detail = err.response?.data?.detail;
      
      if (Array.isArray(detail)) {
        // Pydantic validation error array
        msg = detail.map(d => {
          if (d.loc.includes('password') && d.type === 'string_too_short') {
            return 'Password has to be greater than 6 characters';
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
    <div className="relative mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-6 py-16">
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-br ${accent}`}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-6 top-12 h-72 w-72 rounded-full bg-teal-200/25 blur-[120px]" />
        <div className="absolute right-8 bottom-12 h-72 w-72 rounded-full bg-pink-200/30 blur-[120px]" />
      </div>

      <div className="grid w-full items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 text-center md:text-left hidden md:block">
          {/* Left side content - same as before but hidden on mobile for cleaner login focus */}
          <p className="inline-flex rounded-full bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm backdrop-blur">
            SkinScope
          </p>
          <h1 className="text-5xl font-black leading-tight text-slate-900 sm:text-6xl">
            Identify skin concerns{' '}
            <span className={heroTitleAccent}>instantly</span> with AI
          </h1>
          <p className="max-w-xl text-lg text-[#333]">
            Login to access your dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-md space-y-6 rounded-[32px] border border-white/70 bg-white/90 p-10 shadow-[0_25px_65px_-40px_rgba(40,50,80,0.55)] backdrop-blur"
        >
          <div className="space-y-1 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isSignup ? 'Start your journey as a Patient' : 'Please enter your details'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`${uiTokens.input} rounded-[26px] text-[#1f2933]`}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${uiTokens.input} rounded-[26px] text-[#1f2933]`}
              placeholder="Enter your password"
            />
            {isSignup && <p className="text-xs text-slate-400 px-2">Must be at least 6 characters.</p>}
          </div>

          {/* Role selection removed */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`${uiTokens.primaryButton} w-full justify-center rounded-[26px] bg-gradient-to-r from-[#4c7dff] to-[#5f8dff] text-white shadow-md hover:from-[#426ef0] hover:to-[#557ff5]`}
          >
            {submitting ? 'Please wait...' : isSignup ? 'Sign Up' : 'Log In'}
          </button>

          <div className="pt-2 text-center text-sm">
            <button
              type="button"
              onClick={toggleMode}
              className="text-[#4c7dff] underline transition hover:text-[#3f6ae0]"
            >
              {isSignup ? 'Already have an account? Log in' : 'Need an account? Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
