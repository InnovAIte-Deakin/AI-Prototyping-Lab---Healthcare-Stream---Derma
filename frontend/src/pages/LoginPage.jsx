import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      // Note: login response has 'role', signup response has 'role'
      const userRole = user.role || role;
      
      if (userRole === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: '3rem', textAlign: 'center' }}>
      <h1>{isSignup ? 'Create Account' : 'Login'}</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: '1.5rem',
          display: 'inline-block',
          textAlign: 'left',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #ddd',
          minWidth: '280px',
          background: '#fff',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 500 }}>
            Email
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                marginTop: '0.25rem',
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.4rem',
                border: '1px solid #ccc',
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 500 }}>
            Password
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                marginTop: '0.25rem',
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.4rem',
                border: '1px solid #ccc',
              }}
            />
          </label>
        </div>

        {isSignup && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontWeight: 500 }}>Role</span>
            <div style={{ marginTop: '0.25rem' }}>
              <label style={{ marginRight: '1rem' }}>
                <input
                  type="radio"
                  value="patient"
                  checked={role === 'patient'}
                  onChange={() => setRole('patient')}
                />{' '}
                Patient
              </label>
              <label>
                <input
                  type="radio"
                  value="doctor"
                  checked={role === 'doctor'}
                  onChange={() => setRole('doctor')}
                />{' '}
                Doctor
              </label>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: 'red', marginBottom: '0.75rem' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0.6rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: submitting ? '#9aa6ff' : '#6675ff',
            color: '#fff',
            fontWeight: 600,
            cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Log In')}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6675ff',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {isSignup ? 'Already have an account? Log in' : 'Need an account? Sign up'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
