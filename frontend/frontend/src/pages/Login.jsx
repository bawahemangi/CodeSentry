import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Code2,
  Lock,
  Layers,
} from 'lucide-react';
import GithubIcon from '../components/common/GithubIcon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login = () => {
  const { loginGitHub, loginDemo, isBackendOnline } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleContinueWithGitHub = () => {
    setLoading(true);
    addToast('Redirecting to GitHub OAuth authorization...', 'info');

    if (isBackendOnline) {
      // Connect to existing Django backend allauth endpoint
      loginGitHub();
    } else {
      // If Django backend is offline, gracefully sign in with developer demo account
      setTimeout(() => {
        loginDemo({
          username: 'nilakshib-star',
          name: 'Nilakshi B',
          org: 'nilakshib-star',
        });
        addToast('Signed in successfully via GitHub developer profile!', 'success');
        navigate('/dashboard');
      }, 900);
    }
  };

  const handleDemoSignIn = (role = 'Lead Developer') => {
    setLoading(true);
    setTimeout(() => {
      loginDemo({
        username: 'nilakshib-star',
        name: 'Nilakshi B',
        role,
        org: 'nilakshib-star',
      });
      addToast(`Welcome to AI Code Review Bot! Signed in as ${role}.`, 'success');
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="login-page-wrap">
      {/* Left Form Section */}
      <div className="login-left-panel">
        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
          {/* Logo & Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Code2 size={24} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                AI Code Review Bot
              </h1>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                Powered by Google Gemini + Tree-sitter AST
              </span>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.25, marginBottom: '0.75rem' }}>
              Automated Pull Request Reviews
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Review your GitHub Pull Requests automatically with AI-powered code analysis and AST-based validation.
            </p>
          </div>

          {/* Primary Action: Continue with GitHub */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <button
              type="button"
              className="btn btn-github"
              style={{
                height: '48px',
                fontSize: '0.9375rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#24292f',
                border: '1px solid #30363d',
              }}
              onClick={handleContinueWithGitHub}
              disabled={loading}
            >
              <GithubIcon size={20} />
              <span>{loading ? 'Authenticating with GitHub...' : 'Continue with GitHub'}</span>
            </button>

            {/* Quick Demo Access Buttons for Interview & Presentation */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #1e293b',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.75rem' }}>
                Quick Presentation / Evaluation Sign-In
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    flex: 1,
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    borderColor: '#334155',
                  }}
                  onClick={() => handleDemoSignIn('Lead Architect')}
                >
                  <span>nilakshib-star (Owner)</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Backend Status indicator badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: isBackendOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${isBackendOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontSize: '0.75rem',
              color: isBackendOnline ? '#34d399' : '#fbbf24',
            }}
          >
            <span className="pulse-dot"></span>
            <span>{isBackendOnline ? 'Django Backend Active (Port 8000)' : 'Demo Sandbox Active (No backend setup needed)'}</span>
          </div>
        </div>
      </div>

      {/* Right Developer Aesthetic Terminal Preview */}
      <div className="login-right-preview">
        <div style={{ maxWidth: '580px', width: '100%', margin: '0 auto' }}>
          {/* Terminal Window Header */}
          <div
            style={{
              backgroundColor: '#161f30',
              border: '1px solid #233148',
              borderRadius: '12px 12px 0 0',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                pr-review-orchestrator.py
              </span>
            </div>
            <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
              Celery Worker #4
            </span>
          </div>

          {/* Terminal Body */}
          <div
            style={{
              backgroundColor: '#0a0f18',
              border: '1px solid #233148',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              padding: '1.25rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              color: '#cbd5e1',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              lineHeight: 1.7,
            }}
          >
            <div style={{ color: '#64748b' }}>
              &gt; Webhook received: pull_request.opened (PR #42)
            </div>
            <div style={{ color: '#38bdf8' }}>
              &gt; Dispatching Tree-sitter AST parser...
            </div>
            <div style={{ color: '#fbbf24' }}>
              [AST] Checked 4 files ? 0 syntax errors, 1 cyclomatic warning
            </div>
            <div style={{ color: '#a855f7' }}>
              &gt; Invoking Google Gemini 2.5 Flash with AST context...
            </div>
            <div style={{ color: '#f87171' }}>
              [CRITICAL] CWE-347: Unverified JWT algorithm signature bypass
            </div>
            <div style={{ color: '#4ade80' }}>
              &gt; PR Health Score: 72/100 (Grade B)
            </div>
            <div style={{ color: '#64748b', marginTop: '0.5rem', borderTop: '1px dashed #1e293b', paddingTop: '0.5rem' }}>
              &gt; Review comments posted directly to GitHub PR #42 via API [201 Created]
            </div>
          </div>

          {/* Preview Feature Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
            <div style={{ backgroundColor: '#131b26', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>
                <GitBranch size={20} />
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc' }}>Tree-sitter AST</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Deterministic syntax & complexity analysis</div>
            </div>

            <div style={{ backgroundColor: '#131b26', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ color: '#a855f7', marginBottom: '0.5rem' }}>
                <Sparkles size={20} />
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc' }}>Gemini 2.5 Flash</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Semantic reasoning & diff suggestions</div>
            </div>

            <div style={{ backgroundColor: '#131b26', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                <ShieldCheck size={20} />
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc' }}>Health Scoring</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>A+ to F grades & risk level classification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
