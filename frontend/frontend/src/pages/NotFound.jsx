import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--brand-primary)', lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
          The requested page does not exist or may have been moved.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          <Home size={15} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
