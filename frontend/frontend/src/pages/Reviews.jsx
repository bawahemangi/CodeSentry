import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Search, ExternalLink, ArrowRight, ShieldCheck, Sparkles, GitBranch } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { reviewService } from '../services/reviewService';

export const Reviews = () => {
  const navigate = useNavigate();
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await reviewService.getPullRequests();
        setPrs(data);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const filtered = prs.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.repo_name.toLowerCase().includes(search.toLowerCase()) ||
      String(p.number).includes(search)
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Code Reviews History
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Telemetry and verdicts from hybrid Tree-sitter AST & Google Gemini LLM evaluations
          </p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title-group">
            <h2>Completed & In-Flight Reviews ({filtered.length})</h2>
            <p>Every review dispatched by GitHub webhooks</p>
          </div>

          <div className="table-controls-group">
            <div className="search-input-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton type="table" count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No review records"
            description="No reviews found matching your search."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pull Request</th>
                  <th>Repository</th>
                  <th>Review Verdict</th>
                  <th>Health Grade</th>
                  <th>Engine Components</th>
                  <th>Execution</th>
                  <th style={{ textAlign: 'right' }}>Details</th>
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
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          #{pr.number} — {pr.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Author: {pr.author} · Changes: +{pr.additions} -{pr.deletions}
                        </div>
                      </div>
                    </td>

                    <td style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                      {pr.repo_name}
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
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Evaluating</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                          AST
                        </span>
                        <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
                          Gemini 2.5 Flash
                        </span>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      ~3.8s latency
                    </td>

                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <Link to={`/reviews/${pr.number}`} className="btn btn-secondary btn-sm">
                        <span>Inspect</span>
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

export default Reviews;
