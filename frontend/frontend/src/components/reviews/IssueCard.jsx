import React, { useState } from 'react';
import { Copy, Check, ExternalLink, EyeOff, FileCode } from 'lucide-react';
import SeverityBadge from '../common/SeverityBadge';
import SourceBadge from '../common/SourceBadge';
import { useToast } from '../../context/ToastContext';

export const IssueCard = ({ issue, onIgnore }) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [ignored, setIgnored] = useState(false);

  const severityClass = `severity-${(issue.severity || 'low').toLowerCase()}`;

  const handleCopySuggestion = () => {
    const textToCopy = issue.code_diff?.suggested || issue.suggestion || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    addToast('Code suggestion copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleIgnore = () => {
    setIgnored(true);
    addToast(`Ignored issue: ${issue.title}`, 'info');
    if (onIgnore) onIgnore(issue.id);
  };

  if (ignored) {
    return (
      <div
        className="issue-card"
        style={{
          opacity: 0.6,
          backgroundColor: 'var(--bg-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
        }}
      >
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Issue <strong>{issue.title}</strong> marked as ignored for this review.
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setIgnored(false)}
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className={`issue-card ${severityClass}`}>
      {/* Header with badges and file path */}
      <div className="issue-header">
        <div className="issue-badges-row">
          <SeverityBadge severity={issue.severity} />
          <span className="badge badge-neutral">{issue.finding_type || 'Code Quality'}</span>
          <SourceBadge source={issue.analysis_source} />
        </div>

        <div className="issue-file-locator">
          <FileCode size={14} style={{ color: 'var(--brand-primary)' }} />
          <span>{issue.file_path}</span>
          {issue.line_number && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>:{issue.line_number}</span>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="issue-title">{issue.title}</h3>
      <p className="issue-description">{issue.description}</p>

      {/* Why it is a problem */}
      {issue.why_problem && (
        <div className="issue-section-box">
          <div className="issue-section-title">Why this is a problem</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {issue.why_problem}
          </p>
        </div>
      )}

      {/* Suggested Improvement & Code Diff */}
      {issue.suggestion && (
        <div className="issue-section-box" style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div className="issue-section-title" style={{ color: 'var(--color-success-text)' }}>
              Suggested Improvement
            </div>
            {issue.code_diff && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopySuggestion}
                title="Copy suggested code block"
              >
                {copied ? <Check size={13} style={{ color: 'var(--color-success)' }} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy Fix'}</span>
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {issue.suggestion}
          </p>

          {issue.code_diff && (
            <div className="code-diff-block">
              {issue.code_diff.original && (
                <div className="diff-line-del">
                  <span style={{ userSelect: 'none', marginRight: '0.5rem', opacity: 0.6 }}>-</span>
                  {issue.code_diff.original}
                </div>
              )}
              {issue.code_diff.suggested && (
                <div className="diff-line-add">
                  <span style={{ userSelect: 'none', marginRight: '0.5rem', opacity: 0.6 }}>+</span>
                  {issue.code_diff.suggested}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleIgnore}
          title="Ignore this issue in this PR"
        >
          <EyeOff size={13} />
          <span>Ignore Issue</span>
        </button>
      </div>
    </div>
  );
};

export default IssueCard;
