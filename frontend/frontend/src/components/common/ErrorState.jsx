import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Unable to connect to the service or process the request. Please check your network and backend server status.',
  onRetry,
}) => {
  return (
    <div
      style={{
        padding: '2.5rem 2rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--color-danger-border)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        margin: '1.5rem 0',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <AlertCircle size={26} />
      </div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          <RefreshCw size={14} />
          Retry Connection
        </button>
      )}
    </div>
  );
};

export default ErrorState;
