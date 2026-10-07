import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const HealthScoreGauge = ({ report, healthScore, healthGrade, riskLevel }) => {
  const score = healthScore ?? report?.score ?? 85;
  const grade = healthGrade || report?.grade || 'B';
  const risk = riskLevel || report?.risk_level || 'Low';

  let gradeColor = '#10b981'; // Green
  let gradeBg = '#ecfdf5';
  if (grade.startsWith('B')) {
    gradeColor = '#2563eb';
    gradeBg = '#eff6ff';
  } else if (grade.startsWith('C')) {
    gradeColor = '#f59e0b';
    gradeBg = '#fffbeb';
  } else if (grade.startsWith('D') || grade === 'F') {
    gradeColor = '#ef4444';
    gradeBg = '#fef2f2';
  }

  const badges = report?.badges || ['⚡ Fast Review', '🛡️ AST Syntax Validated'];
  const recommendations = report?.recommendations || [
    'Add unit test cases to verify error boundary paths',
    'Follow PEP8 guidelines for inline import ordering',
  ];

  return (
    <div className="table-card" style={{ marginBottom: '1.75rem' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Codebase Health
          </span>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
            PR Health Evaluation
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {badges.map((b, idx) => (
            <span key={idx} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem', alignItems: 'center' }}>
        {/* Score Radial / Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem', borderRight: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: gradeBg,
              border: `3px solid ${gradeColor}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: gradeColor, lineHeight: 1 }}>
              {grade}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {score}/100
            </span>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Risk: {risk}
            </span>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Actionable Recommendations
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <CheckCircle size={15} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: '2px' }} />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthScoreGauge;
