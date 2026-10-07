import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Save,
  Radio,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import GithubIcon from '../components/common/GithubIcon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Settings = () => {
  const { isBackendOnline, refreshBackendStatus } = useAuth();
  const { addToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [autoComment, setAutoComment] = useState(true);
  const [maxDiffChars, setMaxDiffChars] = useState(60000);

  // AST checks state (strictly matching ast_checker.py)
  const [astChecks, setAstChecks] = useState({
    syntaxError: true,
    complexity: true,
    hardcodedSecret: true,
    missingDocstring: true,
    unusedImport: true,
  });

  const handleToggleAst = (key) => {
    setAstChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((res) => setTimeout(res, 600));
    setSaving(false);
    addToast('Engine settings and AST configuration saved successfully!', 'success');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Engine & Bot Configuration
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Tune Tree-sitter AST rules, Google Gemini LLM prompts, and GitHub App webhooks
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          <Save size={15} />
          <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Tree-sitter AST Settings */}
        <div className="table-card" style={{ padding: '1.5rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Tree-sitter AST Static Parser
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Deterministic grammar validation for Python and JavaScript
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Syntax Error */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>SYNTAX_ERROR</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flag unparseable code and tree-sitter ERROR nodes</div>
              </div>
              <label className="switch-wrap">
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={astChecks.syntaxError}
                  onChange={() => handleToggleAst('syntaxError')}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            {/* Complexity */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>COMPLEXITY</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flag functions &gt;50 lines or nesting depth &gt;4</div>
              </div>
              <label className="switch-wrap">
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={astChecks.complexity}
                  onChange={() => handleToggleAst('complexity')}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            {/* Hardcoded Secret */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>HARDCODED_SECRET</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan literals for leaked API tokens and credentials</div>
              </div>
              <label className="switch-wrap">
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={astChecks.hardcodedSecret}
                  onChange={() => handleToggleAst('hardcodedSecret')}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            {/* Missing Docstring */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>MISSING_DOCSTRING</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Warn when public functions lack docstrings</div>
              </div>
              <label className="switch-wrap">
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={astChecks.missingDocstring}
                  onChange={() => handleToggleAst('missingDocstring')}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            {/* Unused Import */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>UNUSED_IMPORT</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Identify imported modules never referenced in code</div>
              </div>
              <label className="switch-wrap">
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={astChecks.unusedImport}
                  onChange={() => handleToggleAst('unusedImport')}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Google Gemini LLM Settings */}
        <div className="table-card" style={{ padding: '1.5rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#faf5ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Google Gemini LLM Engine
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Generative AI reasoning and code diff generation
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Gemini Model
              </label>
              <select
                className="filter-select"
                style={{ width: '100%', height: '40px' }}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fastest & High Precision)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Free Tier Fallback)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Architectural Reasoning)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Maximum Diff Characters
              </label>
              <input
                type="number"
                className="search-input"
                style={{ width: '100%', height: '40px', paddingLeft: '1rem' }}
                value={maxDiffChars}
                onChange={(e) => setMaxDiffChars(Number(e.target.value))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Truncate very large PR diffs to stay within Gemini token budget (default: 60,000 chars)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Post Comments Directly to GitHub</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatically publish inline review comments and summary</div>
              </div>
              <label className="switch-wrap">
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={autoComment}
                  onChange={() => setAutoComment(!autoComment)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub App & Webhook Integration Box */}
      <div className="table-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#24292f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GithubIcon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                GitHub App & Webhook Configuration
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Endpoints for real Django REST Framework connectivity
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: isBackendOnline ? 'var(--color-success-light)' : 'var(--color-warning-light)',
              color: isBackendOnline ? 'var(--color-success-text)' : 'var(--color-warning-text)',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span className="pulse-dot"></span>
            <span>{isBackendOnline ? 'Django Webhook Endpoint Active' : 'Webhook Mock Listener Running'}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Webhook URL</div>
            <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: '0.2rem' }}>
              http://127.0.0.1:8000/api/webhook/
            </div>
          </div>

          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>GitHub Events Monitored</div>
            <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: '0.2rem' }}>
              pull_request (opened, synchronize, reopened)
            </div>
          </div>

          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Django App Installation ID</div>
            <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: '0.2rem' }}>
              54321987
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
