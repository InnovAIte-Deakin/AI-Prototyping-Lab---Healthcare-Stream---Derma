import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uiTokens } from '../components/Layout';

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);

      let user;
      if (isSignup) {
        user = await signup({ email: email.trim(), password, role });
      } else {
        user = await login({ email: email.trim(), password });
      }

      // After login/signup, route based on role
      const userRole = user.role || role;

      if (userRole === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center space-y-6 px-4">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">SkinScope</p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {isSignup ? 'Create Account' : 'Login'}
        </h1>
        <p className="text-sm text-slate-500">
          Securely access AI-assisted dermatology tools.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={`${uiTokens.card} space-y-4 p-6`}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={uiTokens.input}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={uiTokens.input}
            placeholder="Enter your password"
          />
        </div>

        {isSignup && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-800">Role</span>
            <div className="flex gap-4 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  value="patient"
                  checked={role === 'patient'}
                  onChange={() => setRole('patient')}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Patient
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  value="doctor"
                  checked={role === 'doctor'}
                  onChange={() => setRole('doctor')}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Doctor
              </label>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`${uiTokens.primaryButton} w-full justify-center`}
        >
          {submitting ? 'Please wait...' : isSignup ? 'Sign Up' : 'Log In'}
        </button>

        <div className="pt-2 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
            }}
            className="text-blue-700 underline transition hover:text-blue-800"
          >
            {isSignup ? 'Already have an account? Log in' : 'Need an account? Sign up'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
