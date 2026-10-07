import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Play,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import SourceryMetricCard from '../components/common/SourceryMetricCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { repositoryService } from '../services/repositoryService';
import { reviewService } from '../services/reviewService';
import { useToast } from '../context/ToastContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [reposRes, prsRes] = await Promise.all([
          repositoryService.getRepositories(),
          reviewService.getPullRequests(),
        ]);
        setRepos(reposRes.repos);
        setPullRequests(prsRes);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered reviews / PRs
  const filteredPRs = pullRequests.filter((pr) => {
    const matchesSearch =
      pr.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      pr.repo_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      String(pr.number).includes(searchFilter);

    const matchesRepo = selectedRepo === 'all' || String(pr.repo_id) === String(selectedRepo);
    const matchesStatus =
      selectedStatus === 'all' ||
      pr.review_verdict.toLowerCase() === selectedStatus.toLowerCase() ||
      pr.review_status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesRepo && matchesStatus;
  });

  // KPI Calculations
  const totalReviews = pullRequests.length;
  const connectedReposCount = repos.filter((r) => r.scanning_enabled).length;
  const totalIssuesFound = pullRequests.reduce((acc, curr) => acc + (curr.issues_count || 0), 0);
  const totalCriticalIssues = pullRequests.reduce((acc, curr) => acc + (curr.critical_count || 0), 0);

  // Issues Breakdown for Sourcery Metric Card
  const issuesBreakdown = {
    critical: totalCriticalIssues,
    high: pullRequests.reduce((acc, curr) => acc + (curr.high_count || 0), 0),
    medium: pullRequests.reduce((acc, curr) => acc + (curr.medium_count || 0), 0),
    low: pullRequests.reduce((acc, curr) => acc + (curr.low_count || 0), 0),
  };

  // Simulate an incoming webhook review in real-time
  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    addToast('Simulating incoming webhook: POST /api/webhook/ (PR #42 updated)', 'info');

    setTimeout(() => {
      addToast('Tree-sitter AST & Google Gemini analysis complete!', 'success');
      setIsSimulating(false);
      navigate('/reviews/42');
    }, 1500);
  };

  return (
    <div>
      {/* Top Welcome & Quick Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Code Review & Security Overview
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Real-time PR health telemetry powered by Google Gemini and Tree-sitter AST
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSimulateWebhook}
            disabled={isSimulating}
            title="Simulate GitHub webhook trigger and review execution"
          >
            <Play size={15} />
            <span>{isSimulating ? 'Running Review...' : 'Trigger PR Review'}</span>
          </button>
          <Link to="/repositories" className="btn btn-secondary">
            <FolderGit2 size={15} />
            <span>Manage Repos</span>
          </Link>
        </div>
      </div>

      {/* Sourcery-Style Top Metric Cards (Matches Screenshot 1 Inspiration) */}
      <div className="sourcery-metrics-grid">
        <SourceryMetricCard type="issues-breakdown" data={issuesBreakdown} />
        <SourceryMetricCard type="new-groups" data={{ count: totalReviews }} />
        <SourceryMetricCard type="ast-signals" data={{ astCount: 18 }} />
        <SourceryMetricCard type="ai-accuracy" data={{ accuracy: '94.8%' }} />
      </div>

      {/* Secondary 4 Primary KPI Stats */}
      {loading ? (
        <LoadingSkeleton type="cards" count={4} />
      ) : (
        <div className="stats-grid-4">
          <StatCard
            label="Connected Repositories"
            value={connectedReposCount}
            icon={FolderGit2}
            trend="+1 this week"
            trendType="up"
          />
          <StatCard
            label="Total PR Reviews"
            value={totalReviews}
            icon={FileText}
            trend="100% automated"
            trendType="up"
          />
          <StatCard
            label="Issues Detected"
            value={totalIssuesFound}
            icon={AlertTriangle}
            trend="Across AST & AI"
            trendType="neutral"
          />
          <StatCard
            label="Critical Vulnerabilities"
            value={totalCriticalIssues}
            icon={ShieldAlert}
            trend={totalCriticalIssues > 0 ? 'Requires attention' : 'Clean'}
            trendType={totalCriticalIssues > 0 ? 'down' : 'up'}
          />
        </div>
      )}

      {/* Recent Reviews Table Section */}
      <div className="table-card">
        {/* Table Header & Controls (Matching Screenshot 1 Filter Toolbar) */}
        <div className="table-header-bar">
          <div className="table-title-group">
            <h2>Recent Pull Request Reviews</h2>
            <p>Automated static and LLM analysis results for connected repositories</p>
          </div>

          <div className="table-controls-group">
            <div className="search-input-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Filter by title, repo, or PR #..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
            >
              <option value="all">All repositories</option>
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="approve">Approved</option>
              <option value="request_changes">Changes Requested</option>
              <option value="analyzing">Analyzing</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : filteredPRs.length === 0 ? (
          <EmptyState
            title="No pull request reviews match criteria"
            description="Try adjusting your filters or connect new repositories to begin automated reviews."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchFilter('');
              setSelectedRepo('all');
              setSelectedStatus('all');
            }}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Pull Request</th>
                  <th>Status</th>
                  <th>Health Score</th>
                  <th>Issues Found</th>
                  <th>Detection Source</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPRs.map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => navigate(`/reviews/${pr.number}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FolderGit2 size={16} style={{ color: 'var(--brand-primary)' }} />
                        <span style={{ fontWeight: 600 }}>{pr.repo_name}</span>
                      </div>
                    </td>

                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <GitPullRequest size={14} style={{ color: 'var(--text-secondary)' }} />
                          <span>#{pr.number} — {pr.title}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          by {pr.author} · {pr.source_branch} → {pr.target_branch}
                        </div>
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={pr.review_verdict || pr.review_status} />
                    </td>

                    <td>
                      {pr.health_score ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                            Grade {pr.health_grade}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {pr.health_score}/100
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Pending</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {pr.critical_count > 0 && (
                          <span className="badge badge-danger" style={{ fontSize: '0.6875rem' }}>
                            {pr.critical_count} critical
                          </span>
                        )}
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {pr.issues_count} total
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                        Tree-sitter + Gemini
                      </span>
                    </td>

                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {new Date(pr.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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

export default Dashboard;
