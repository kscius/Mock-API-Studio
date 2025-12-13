import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      navigate('/login');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      toast.success(`Successfully signed in with ${provider}!`);
      navigate('/');
    } else {
      toast.error('No authentication token received');
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    }}>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h2>Completing authentication...</h2>
        <p style={{ color: '#6b7280', marginTop: '12px' }}>
          Please wait while we complete your sign-in.
        </p>
        <div style={{ marginTop: '24px' }}>
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  );
}

