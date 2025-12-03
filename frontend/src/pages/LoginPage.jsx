import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    try {
      setSubmitting(true);
      await login({ email: email.trim(), role });

      // After login, route based on role
      if (role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: '3rem', textAlign: 'center' }}>
      {/* Keep this text so existing tests still pass */}
      <h1>Login Page</h1>

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
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
