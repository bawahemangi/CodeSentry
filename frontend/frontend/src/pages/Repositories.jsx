import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Shield,
  Trash2,
} from 'lucide-react';
import { repositoryService } from '../services/repositoryService';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ConnectRepoModal from '../components/repositories/ConnectRepoModal';
import { useToast } from '../context/ToastContext';

export const Repositories = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanningRepoId, setScanningRepoId] = useState(null);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const res = await repositoryService.getRepositories();
      setRepos(res.repos);
      if (res.isLive) {
        addToast('Connected with GitHub App installation repositories via Django backend', 'success');
      }
    } catch (err) {
      console.error('Failed to load repos:', err);
      addToast('Failed to load repositories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  const handleToggleScanning = async (repo) => {
    const nextState = !repo.scanning_enabled;
    const actionName = nextState ? 'Enabling bot webhook' : 'Removing bot webhook';
    addToast(`${actionName} for ${repo.name}...`, 'info');

    // Optimistic UI update
    setRepos((prev) =>
      prev.map((r) =>
        r.id === repo.id
          ? { ...r, scanning_enabled: nextState, webhook_installed: nextState }
          : r
      )
    );

    try {
      await repositoryService.toggleScanning(repo.id, nextState);
      addToast(
        nextState
          ? `Webhook registered for ${repo.name}. Bot is now monitoring pull requests!`
          : `Webhook removed for ${repo.name}. Bot monitoring disabled.`,
        'success'
      );
    } catch {
      addToast(`Failed to update webhook for ${repo.name}`, 'error');
      // Revert if error
      setRepos((prev) =>
        prev.map((r) =>
          r.id === repo.id
            ? { ...r, scanning_enabled: !nextState, webhook_installed: !nextState }
            : r
        )
      );
    }
  };

  const handleStartScan = async (repo) => {
    setScanningRepoId(repo.id);
    addToast(`Triggering full AST and LLM scan on ${repo.name}...`, 'info');

    try {
      await repositoryService.triggerScan(repo.full_name);
      addToast(`Scan completed for ${repo.name}! Check PR reviews for updated findings.`, 'success');
      setRepos((prev) =>
        prev.map((r) =>
          r.id === repo.id ? { ...r, last_scan: 'Just now' } : r
        )
      );
    } catch {
      addToast(`Failed to trigger scan on ${repo.name}`, 'error');
    } finally {
      setScanningRepoId(null);
    }
  };

  const handleRepoConnected = (newRepo) => {
    setRepos((prev) => [newRepo, ...prev]);
  };

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.risk_profile.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Top Header & Connect Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Repository Security Scans
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Configure GitHub webhook listeners and trigger on-demand PR reviews
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            <span>Connect Repository</span>
          </button>
        </div>
      </div>

      {/* Repositories Table Card (Matches Screenshot 3 Inspiration) */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title-group">
            <h2>Active Repositories ({filteredRepos.length})</h2>
            <p>GitHub repositories linked to the review bot</p>
          </div>

          <div className="table-controls-group">
            <div className="search-input-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadRepos}
              title="Refresh repository list"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton type="table" count={4} />
        ) : filteredRepos.length === 0 ? (
          <EmptyState
            type="repos"
            title="No repositories found"
            description="Connect a repository from your GitHub account to enable AI code reviews."
            actionLabel="Connect Repository"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Risk profile</th>
                  <th>Issues</th>
                  <th>Ignored</th>
                  <th>Last scan</th>
                  <th>Scanning enabled</th>
                  <th style={{ textAlign: 'right' }}>Scan</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepos.map((repo) => (
                  <tr
                    key={repo.id}
                    onClick={() => navigate(`/repositories/${repo.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Repository Name & Owner */}
                    <td>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                            {repo.name}
                          </span>
                          <a
                            href={repo.github_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--text-muted)' }}
                            title="Open on GitHub"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {repo.full_name} · {repo.visibility}
                        </div>
                      </div>
                    </td>

                    {/* Risk Profile */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Shield size={14} style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {repo.risk_profile}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            Standard sensitivity
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Issues Count */}
                    <td>
                      {repo.issues_count > 0 ? (
                        <span className="badge badge-warning">
                          {repo.issues_count}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Ignored */}
                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    </td>

                    {/* Last Scan */}
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {repo.last_scan || 'Recently'}
                    </td>

                    {/* Scanning Enabled Switch (Screenshot 3 inspiration) */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <label className="switch-wrap">
                        <input
                          type="checkbox"
                          className="switch-input"
                          checked={repo.scanning_enabled}
                          onChange={() => handleToggleScanning(repo)}
                        />
                        <span className="switch-slider"></span>
                      </label>
                    </td>

                    {/* Start Scan Button */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          backgroundColor: '#f97316',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          padding: '0.4rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                        }}
                        onClick={() => handleStartScan(repo)}
                        disabled={scanningRepoId === repo.id}
                      >
                        {scanningRepoId === repo.id ? (
                          <>
                            <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <span>Start Scan</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Connect Repo Modal */}
      <ConnectRepoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnected={handleRepoConnected}
      />
    </div>
  );
};

export default Repositories;
