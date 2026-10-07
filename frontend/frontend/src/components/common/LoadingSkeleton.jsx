import React from 'react';

export const LoadingSkeleton = ({ type = 'table', count = 4 }) => {
  if (type === 'cards') {
    return (
      <div className="stats-grid-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="stat-card" style={{ height: '120px' }}>
            <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '1rem' }}></div>
            <div className="skeleton" style={{ height: '32px', width: '60%', marginBottom: '0.75rem' }}></div>
            <div className="skeleton" style={{ height: '12px', width: '50%' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'findings') {
    return (
      <div>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="issue-card" style={{ height: '160px' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="skeleton" style={{ height: '22px', width: '80px' }}></div>
              <div className="skeleton" style={{ height: '22px', width: '120px' }}></div>
            </div>
            <div className="skeleton" style={{ height: '20px', width: '70%', marginBottom: '0.75rem' }}></div>
            <div className="skeleton" style={{ height: '14px', width: '90%', marginBottom: '0.5rem' }}></div>
            <div className="skeleton" style={{ height: '14px', width: '85%' }}></div>
          </div>
        ))}
      </div>
    );
  }

  // Default table skeleton
  return (
    <div style={{ padding: '1rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: '16px', width: '35%', marginBottom: '0.4rem' }}></div>
              <div className="skeleton" style={{ height: '12px', width: '20%' }}></div>
            </div>
          </div>
          <div className="skeleton" style={{ height: '24px', width: '90px', borderRadius: '9999px' }}></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
