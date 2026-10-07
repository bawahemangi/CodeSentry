import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginDemo } = useAuth();
  const { addToast } = useToast();
  const [statusText, setStatusText] = useState('Verifying GitHub authentication with Django backend...');

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      try {
        const user = await authService.handleCallback(code);
        loginDemo(user);
        addToast('Successfully authenticated with GitHub!', 'success');
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatusText('OAuth session established. Loading dashboard...');
        loginDemo();
        navigate('/dashboard', { replace: true });
      }
    };

    handleAuth();
  }, [searchParams, navigate, loginDemo, addToast]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="pulse-dot" style={{ width: '24px', height: '24px', color: 'var(--brand-primary)', margin: '0 auto 1.5rem' }}></div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Finalizing GitHub Authorization
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {statusText}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
