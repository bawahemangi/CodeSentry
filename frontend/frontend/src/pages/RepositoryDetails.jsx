import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  ExternalLink,
  GitPullRequest,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { repositoryService } from '../services/repositoryService';
import { reviewService } from '../services/reviewService';
import { useToast } from '../context/ToastContext';

export const RepositoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [repo, setRepo] = useState(null);
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const repoData = await repositoryService.getRepositoryById(id);
        setRepo(repoData);

        const prs = await reviewService.getPullRequests(repoData?.id);
        setPullRequests(prs);
      } catch (err) {
        console.error('Failed to load repo details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleToggleBot = async () => {
    if (!repo) return;
    const nextState = !repo.scanning_enabled;
    setRepo((prev) => ({ ...prev, scanning_enabled: nextState }));

    try {
      await repositoryService.toggleScanning(repo.id, nextState);
      addToast(
        nextState
          ? `Review bot enabled for ${repo.name}`
          : `Review bot disabled for ${repo.name}`,
        'success'
      );
    } catch {
      setRepo((prev) => ({ ...prev, scanning_enabled: !nextState }));
      addToast('Failed to toggle bot status', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: '36px', width: '250px', marginBottom: '1.5rem' }}></div>
        <LoadingSkeleton type="cards" count={4} />
        <LoadingSkeleton type="table" count={4} />
      </div>
    );
  }

  if (!repo) {
    return (
      <EmptyState
        type="repos"
        title="Repository not found"
        description="The requested repository does not exist or has not been connected yet."
        actionLabel="Back to Repositories"
        onAction={() => navigate('/repositories')}
      />
    );
  }

  const criticalIssuesCount = pullRequests.reduce((acc, curr) => acc + (curr.critical_count || 0), 0);
  const totalIssuesCount = pullRequests.reduce((acc, curr) => acc + (curr.issues_count || 0), 0);

  return (
    <div>
      {/* Top Breadcrumb & Action */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/repositories"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to All Repositories</span>
        </Link>
      </div>

      {/* Repository Main Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          backgroundColor: 'var(--bg-surface)',
          padding: '1.5rem 1.75rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
            }}
          >
            <FolderGit2 size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {repo.name}
              </h1>
              <a
                href={repo.github_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="View on GitHub"
              >
                <span>GitHub</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Owner: <strong>{repo.owner}</strong> · Risk Profile: <strong>{repo.risk_profile}</strong> · Language: <strong>{repo.language}</strong>
            </div>
          </div>
        </div>

        {/* Bot Status Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {repo.scanning_enabled ? '🟢 Review Bot Enabled' : '⚪ Review Bot Paused'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {repo.scanning_enabled ? 'Webhook active on /api/webhook/' : 'No webhook listener'}
            </div>
          </div>

          <label className="switch-wrap">
            <input
              type="checkbox"
              className="switch-input"
              checked={repo.scanning_enabled}
              onChange={handleToggleBot}
            />
            <span className="switch-slider"></span>
          </label>
        </div>
      </div>

      {/* 4 KPI Statistics Cards */}
      <div className="stats-grid-4">
        <StatCard
          label="Total Pull Requests"
          value={pullRequests.length}
          icon={GitPullRequest}
          trend="Monitored by Bot"
          trendType="neutral"
        />
        <StatCard
          label="Total Reviews"
          value={repo.total_reviews || pullRequests.length}
          icon={ShieldCheck}
          trend="Tree-sitter + Gemini"
          trendType="up"
        />
        <StatCard
          label="Issues Detected"
          value={totalIssuesCount}
          icon={AlertTriangle}
          trend="In this repository"
          trendType="neutral"
        />
        <StatCard
          label="Critical Issues"
          value={criticalIssuesCount}
          icon={ShieldAlert}
          trend={criticalIssuesCount > 0 ? 'High security risk' : 'Clean'}
          trendType={criticalIssuesCount > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Pull Requests List for this Repository */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title-group">
            <h2>Pull Requests ({pullRequests.length})</h2>
            <p>Pull Requests analyzed by AST parser and Gemini LLM</p>
          </div>
        </div>

        {pullRequests.length === 0 ? (
          <EmptyState
            type="prs"
            title="No pull requests found"
            description="Create or open a pull request in this repository to trigger an automated AI review."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PR #</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Review Result</th>
                  <th>Health</th>
                  <th>Issues</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pullRequests.map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => navigate(`/reviews/${pr.number}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                      #{pr.number}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pr.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {pr.source_branch} → {pr.target_branch}
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8125rem' }}>
                      {pr.author}
                    </td>

                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {pr.status}
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={pr.review_verdict || pr.review_status} />
                    </td>

                    <td>
                      {pr.health_score ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: pr.health_score >= 80 ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                            color: pr.health_score >= 80 ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                          }}
                        >
                          Grade {pr.health_grade} ({pr.health_score})
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {pr.critical_count > 0 && (
                          <span className="badge badge-danger" style={{ fontSize: '0.6875rem' }}>
                            {pr.critical_count} crit
                          </span>
                        )}
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {pr.issues_count}
                        </span>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {new Date(pr.updated_at).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <Link to={`/reviews/${pr.number}`} className="btn btn-secondary btn-sm">
                        <span>View Review</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryDetails;
