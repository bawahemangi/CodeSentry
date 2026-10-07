import React from 'react';
import { X, GitPullRequest, ArrowRight, Server, Cpu, Database, CheckCircle, ExternalLink, Sparkles, GitBranch } from 'lucide-react';

export const ArchitectureModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      title: '1. GitHub Webhook Trigger',
      desc: 'Developer opens or pushes commits to a Pull Request. GitHub triggers a webhook event payload (`pull_request`) via HMAC SHA256 signature.',
      icon: GitPullRequest,
      color: '#24292f',
    },
    {
      title: '2. Django REST Framework',
      desc: 'Django endpoint `/api/webhook/` validates `X-Hub-Signature-256`, parses event payload, and extracts repository & commit SHA.',
      icon: Server,
      color: '#047857',
    },
    {
      title: '3. Celery + Redis Broker',
      desc: 'Asynchronous task queue dispatches `run_pr_review()` background worker without blocking GitHub webhook response (200 OK delivery).',
      icon: Cpu,
      color: '#c2410c',
    },
    {
      title: '4. Tree-sitter AST Static Parser',
      desc: 'Python Tree-sitter parses raw unified diffs, detects syntax anomalies, cyclomatic complexity spikes, missing docstrings, and hardcoded secrets.',
      icon: GitBranch,
      color: '#2563eb',
    },
    {
      title: '5. Google Gemini LLM Review',
      desc: 'AST findings + diff hunks are fed into Gemini 2.5 Flash to synthesize semantic bugs, logic errors, security impact, and structured code diff suggestions.',
      icon: Sparkles,
      color: '#7e22ce',
    },
    {
      title: '6. PostgreSQL Storage & GitHub Comments',
      desc: 'Review metrics & Health Score (0-100) are persisted to PostgreSQL DB while PyGithub posts inline review comments directly to the PR.',
      icon: Database,
      color: '#0284c7',
    },
    {
      title: '7. React Frontend Dashboard',
      desc: 'Modern developer dashboard monitors reviews in real-time, displays AST vs AI metrics, and provides interactive repository management.',
      icon: CheckCircle,
      color: '#10b981',
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              System Architecture & Pipeline Flow
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Hybrid AI + Tree-sitter AST Static Analysis Engine
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Architecture Pipeline Flowchart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {steps.map((st, i) => {
              const Icon = st.icon;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: `${st.color}15`,
                      color: st.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {st.title}
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              fontSize: '0.8125rem',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              💡 <strong>Deterministic AST + Generative AI</strong>: Tree-sitter catches syntax errors and secrets with 100% precision, while Gemini provides contextual reasoning.
            </span>
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Architecture
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureModal;
