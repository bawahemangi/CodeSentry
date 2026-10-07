import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import GithubIcon from '../common/GithubIcon';
import { useToast } from '../../context/ToastContext';

export const ConnectRepoModal = ({ isOpen, onClose, onConnected }) => {
  const { addToast } = useToast();
  const [repoName, setRepoName] = useState('');
  const [riskProfile, setRiskProfile] = useState('Standard sensitivity');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) {
      addToast('Please enter a valid repository name (e.g. org/repo)', 'error');
      return;
    }

    setLoading(true);
    try {
      const cleanName = repoName.includes('/') ? repoName : `nilakshib-star/${repoName.trim()}`;
      const newRepo = {
        id: Date.now(),
        name: cleanName.split('/')[1] || cleanName,
        full_name: cleanName,
        owner: cleanName.split('/')[0] || 'nilakshib-star',
        owner_avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
        github_url: `https://github.com/${cleanName}`,
        risk_profile: riskProfile,
        scanning_enabled: true,
        webhook_installed: true,
        last_scan: 'Just connected',
        total_prs: 0,
        total_reviews: 0,
        issues_count: 0,
        critical_issues: 0,
        language: 'Python',
        visibility,
      };

      await new Promise((res) => setTimeout(res, 600));
      addToast(`Successfully connected repository ${cleanName} with webhook registered!`, 'success');
      onConnected(newRepo);
      onClose();
    } catch {
      addToast('Failed to register webhook on repository', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#24292f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GithubIcon size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Connect GitHub Repository
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Register automated PR webhook with Django AI bot
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Repository Name / Full Path
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', height: '42px', paddingLeft: '1rem' }}
                placeholder="e.g. nilakshib-star/fastapi-service"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Will configure webhook endpoint: <code>/api/webhook/</code>
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Risk Profile & Sensitivity
              </label>
              <select
                className="filter-select"
                style={{ width: '100%', height: '42px' }}
                value={riskProfile}
                onChange={(e) => setRiskProfile(e.target.value)}
              >
                <option value="Standard sensitivity">Standard sensitivity (General Web App)</option>
                <option value="High sensitivity">High sensitivity (Core Backend / Auth)</option>
                <option value="Critical infrastructure">Critical infrastructure (Payment / Secrets)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Repository Visibility
              </label>
              <select
                className="filter-select"
                style={{ width: '100%', height: '42px' }}
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">Public Repository</option>
                <option value="private">Private Repository</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering Webhook...' : 'Connect & Enable Bot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectRepoModal;
