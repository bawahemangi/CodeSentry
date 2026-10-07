import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Play,
  Filter,
  Search,
  Sparkles,
  GitBranch,
  Layers,
  MessageSquare,
  FileCode,
  Check,
} from 'lucide-react';
import ReviewPipeline from '../components/reviews/ReviewPipeline';
import HealthScoreGauge from '../components/reviews/HealthScoreGauge';
import IssueCard from '../components/reviews/IssueCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { reviewService } from '../services/reviewService';
import { useToast } from '../context/ToastContext';

export const ReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pr, setPr] = useState(null);
  const [review, setReview] = useState(null);

  // Filters for findings
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [reTriggering, setReTriggering] = useState(false);

  useEffect(() => {
    const fetchReviewData = async () => {
      setLoading(true);
      try {
        const prNumber = id || 42;
        const [prData, reviewData] = await Promise.all([
          reviewService.getPullRequest(prNumber),
          reviewService.getReviewDetails(prNumber),
        ]);
        setPr(prData);
        setReview(reviewData);
      } catch (err) {
        console.error('Failed to load review details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [id]);

  const handleReRunReview = async () => {
    if (!pr) return;
    setReTriggering(true);
    addToast(`Re-running Tree-sitter AST and Gemini analysis on PR #${pr.number}...`, 'info');

    try {
      await reviewService.triggerReview(pr.number);
      addToast(`Review updated for PR #${pr.number}! All checks verified.`, 'success');
      // Refresh review
      const updated = await reviewService.getReviewDetails(pr.number);
      setReview(updated);
    } catch {
      addToast('Failed to trigger review run', 'error');
    } finally {
      setReTriggering(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: '36px', width: '200px', marginBottom: '1.5rem' }}></div>
        <div className="skeleton" style={{ height: '140px', width: '100%', marginBottom: '1.5rem' }}></div>
        <LoadingSkeleton type="findings" count={3} />
      </div>
    );
  }

  if (!review) {
    return (
      <EmptyState
        title="Review not found"
        description="Could not find review findings for this pull request."
        actionLabel="Back to Reviews"
        onAction={() => navigate('/reviews')}
      />
    );
  }

  const allFindings = review.findings || [];

  // Filter findings
  const filteredFindings = allFindings.filter((item) => {
    const matchesSeverity =
      severityFilter === 'all' || item.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesSource =
      sourceFilter === 'all' || item.analysis_source.toUpperCase() === sourceFilter.toUpperCase();
    const matchesCategory =
      categoryFilter === 'all' || item.finding_type.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.file_path.toLowerCase().includes(searchFilter.toLowerCase());

    return matchesSeverity && matchesSource && matchesCategory && matchesSearch;
  });

  // Severity counts
  const criticalCount = allFindings.filter((f) => f.severity.toLowerCase() === 'critical').length;
  const highCount = allFindings.filter((f) => f.severity.toLowerCase() === 'high').length;
  const mediumCount = allFindings.filter((f) => f.severity.toLowerCase() === 'medium').length;
  const lowCount = allFindings.filter((f) => f.severity.toLowerCase() === 'low').length;

  return (
    <div>
      {/* Top Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Flagship PR Header (Prompt Section 7) */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {review.repo_full_name}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Author: <strong>{pr?.author || 'nilakshib-star'}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>PR #{review.pr_number} — {pr?.title || 'Fix authentication validation'}</span>
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              <StatusBadge status={review.verdict || review.status} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {pr?.source_branch || 'feature/branch'} → {pr?.target_branch || 'main'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Model: <strong>{review.llm_model_used || 'Gemini 2.5 Flash'}</strong> + <strong>{review.ast_parser_used || 'Tree-sitter'}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReRunReview}
              disabled={reTriggering}
            >
              <Play size={14} />
              <span>{reTriggering ? 'Re-analyzing...' : 'Re-run Review'}</span>
            </button>

            <a
              href={`https://github.com/${review.repo_full_name}/pull/${review.pr_number}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-github"
            >
              <span>View on GitHub</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* AI Summary Banner */}
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <Sparkles size={18} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6d28d9' }}>
              AI Orchestrator Executive Summary
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.6 }}>
              {review.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Review Status Flow Timeline (Prompt Section 11) */}
      <ReviewPipeline currentStatus={review.status} stages={review.pipeline_stages} />

      {/* Health Score Gauge (from health_scorer.py) */}
      <HealthScoreGauge
        report={review.health_report}
        healthScore={review.health_score}
        healthGrade={review.health_grade}
        riskLevel={review.risk_level}
      />

      {/* Review Summary Severity Cards (Prompt Section 7) */}
      <div className="stats-grid-4">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div className="stat-card-label" style={{ color: 'var(--color-danger)' }}>Critical Issues</div>
          <div className="stat-card-value" style={{ color: 'var(--color-danger)' }}>{criticalCount}</div>
          <div className="stat-card-trend down">Requires immediate patch</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ea580c' }}>
          <div className="stat-card-label" style={{ color: '#c2410c' }}>High Severity</div>
          <div className="stat-card-value" style={{ color: '#ea580c' }}>{highCount}</div>
          <div className="stat-card-trend neutral">Architecture & Complexity</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div className="stat-card-label" style={{ color: 'var(--color-warning)' }}>Medium Severity</div>
          <div className="stat-card-value" style={{ color: 'var(--color-warning)' }}>{mediumCount}</div>
          <div className="stat-card-trend neutral">Code Smell / Security</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-info)' }}>
          <div className="stat-card-label" style={{ color: 'var(--color-info)' }}>Low / Suggestions</div>
          <div className="stat-card-value" style={{ color: 'var(--color-info)' }}>{lowCount}</div>
          <div className="stat-card-trend up">Cleanliness & Docstrings</div>
        </div>
      </div>

      {/* Detailed Findings Section (Prompt Section 8 & 9) */}
      <div className="table-card" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
        {/* Filter Toolbar for Findings */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Code Review Findings ({filteredFindings.length})
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Deterministic AST signals and LLM semantic insights
            </p>
          </div>

          <div className="table-controls-group">
            <div className="search-input-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search findings, files..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            {/* Severity Filter */}
            <select
              className="filter-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Source Filter (Section 9) */}
            <select
              className="filter-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">All Analysis Sources</option>
              <option value="AST">Tree-sitter AST Only</option>
              <option value="AI">Gemini AI Only</option>
              <option value="BOTH">Hybrid (Both AST + AI)</option>
            </select>

            {/* Category Filter */}
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="code quality">Code Quality</option>
              <option value="best practice">Best Practice</option>
            </select>
          </div>
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <EmptyState
            type="clean"
            title="No findings matching current criteria"
            description="All code review checks in this category have passed or no issues were found."
            actionLabel="Reset Filters"
            onAction={() => {
              setSeverityFilter('all');
              setSourceFilter('all');
              setCategoryFilter('all');
              setSearchFilter('');
            }}
          />
        ) : (
          <div>
            {filteredFindings.map((finding) => (
              <IssueCard
                key={finding.id}
                issue={finding}
                onIgnore={(id) => reviewService.ignoreFinding(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewDetails;
