import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitPullRequest, Search, FolderGit2, ArrowRight, Filter, Play } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { reviewService } from '../services/reviewService';
import { useToast } from '../context/ToastContext';

export const PullRequests = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all');

  useEffect(() => {
    const fetchPRs = async () => {
      setLoading(true);
      try {
        const data = await reviewService.getPullRequests();
        setPrs(data);
      } catch (err) {
        console.error('Failed to load PRs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPRs();
  }, []);

  const filtered = prs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.repo_name.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase()) ||
      String(p.number).includes(search);

    const matchesVerdict =
      verdictFilter === 'all' ||
      p.review_verdict.toLowerCase() === verdictFilter.toLowerCase();

    return matchesSearch && matchesVerdict;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Pull Requests ({filtered.length})
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            All pull requests across connected repositories monitored by AI Review Bot
          </p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title-group">
            <h2>Active & Reviewed Pull Requests</h2>
            <p>Click any PR to inspect AST and LLM findings</p>
          </div>

          <div className="table-controls-group">
            <div className="search-input-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search PR title, author, repo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
            >
              <option value="all">All verdicts</option>
              <option value="approve">Approved</option>
              <option value="request_changes">Changes Requested</option>
              <option value="comment">Commented</option>
              <option value="analyzing">Analyzing</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            type="prs"
            title="No pull requests found"
            description="No pull requests matched your search query."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pull Request</th>
                  <th>Repository</th>
                  <th>Author</th>
                  <th>Review Verdict</th>
                  <th>Health Score</th>
                  <th>Issues</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => navigate(`/reviews/${pr.number}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <GitPullRequest size={14} style={{ color: 'var(--brand-primary)' }} />
                          <span>#{pr.number} — {pr.title}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {pr.source_branch} → {pr.target_branch}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                        <FolderGit2 size={14} style={{ color: 'var(--text-secondary)' }} />
                        <span>{pr.repo_name}</span>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8125rem' }}>
                      {pr.author}
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
                        <span>Review</span>
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

export default PullRequests;
