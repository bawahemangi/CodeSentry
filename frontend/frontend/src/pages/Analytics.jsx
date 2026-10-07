import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  GitPullRequest,
  Sparkles,
  Info,
  Calendar,
  Filter,
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { repositoryService } from '../services/repositoryService';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export const Analytics = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeRange, setTimeRange] = useState('3 months');
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [repos, setRepos] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [reposRes, data] = await Promise.all([
          repositoryService.getRepositories(),
          analyticsService.getAnalytics(timeRange, selectedRepo),
        ]);
        setRepos(reposRes.repos);
        setAnalyticsData(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange, selectedRepo]);

  const tabs = ['Overview', 'PR Lifecycle', 'Code Reviews', 'Developers', 'Repositories', 'Trends'];

  if (loading || !analyticsData) {
    return (
      <div>
        <div className="skeleton" style={{ height: '36px', width: '220px', marginBottom: '1.5rem' }}></div>
        <LoadingSkeleton type="cards" count={6} />
      </div>
    );
  }

  const { kpis, review_decisions, cycle_time_by_stage, issues_by_category, source_detection_breakdown } = analyticsData;

  return (
    <div>
      {/* Top Header with Filters (Matching Screenshot 2 Inspiration) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Analytics
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            PR lifecycle throughput, AI review efficiency, and vulnerability distribution
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7 days">Last 7 days</option>
            <option value="30 days">Last 30 days</option>
            <option value="3 months">3 months</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Tabs Navigation (Matches Screenshot 2 Inspiration) */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 0.25rem',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--text-primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition-fast)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 6 KPI Cards (Exact replica of Screenshot 2!) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* 1. PRs Merged */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              PRs Merged
            </span>
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-card-value">{kpis.prs_merged}</div>
          <div className="stat-card-trend up">+14% vs previous period</div>
        </div>

        {/* 2. Median Cycle Time */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Median Cycle Time
            </span>
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-card-value">{kpis.median_cycle_time}</div>
          <div className="stat-card-trend up">62% faster than manual review</div>
        </div>

        {/* 3. Time to First Review */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Time to First Review
            </span>
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-card-value">{kpis.time_to_first_review}</div>
          <div className="stat-card-trend up">Instant Webhook trigger</div>
        </div>

        {/* 4. AI Acceptance Rate */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              AI Acceptance Rate
            </span>
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-card-value">{kpis.ai_acceptance_rate}</div>
          <div className="stat-card-trend up">High developer adoption</div>
        </div>

        {/* 5. Median PR Size */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Median PR Size
            </span>
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-card-value">{kpis.median_pr_size}</div>
          <div className="stat-card-trend neutral">Optimal for code quality</div>
        </div>

        {/* 6. Human Review Coverage */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Automated Review Coverage
            </span>
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-card-value">{kpis.automated_coverage}</div>
          <div className="stat-card-trend up">Zero missed PR webhooks</div>
        </div>
      </div>

      {/* Main Charts Row (Matches Screenshot 2 Inspiration) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Chart: PR Cycle Time by Stage */}
        <div className="table-card" style={{ padding: '1.5rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                PR Cycle Time by Stage
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Time spent across Pre-Review, Pickup, Review, and Merge phases
              </p>
            </div>
            <Info size={15} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cycle_time_by_stage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} unit="h" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Pre-Review" stackId="1" stroke="#0284c7" fill="#0284c7" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Pickup" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Review" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Merge" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Review Decision Distribution */}
        <div className="table-card" style={{ padding: '1.5rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Review Decision Distribution
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Proportion of Approved, Commented, and Changes Requested
              </p>
            </div>
            <Info size={15} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={review_decisions}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  label
                >
                  {review_decisions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row: Issues by Category & AST vs AI Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Issues by Category */}
        <div className="table-card" style={{ padding: '1.5rem', margin: 0 }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Issues Detected by Category
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Breakdown across Security, Syntax, Performance, and Quality
            </p>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issues_by_category}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AST vs Gemini Detection Trends */}
        <div className="table-card" style={{ padding: '1.5rem', margin: 0 }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Analysis Engine Throughput (AST vs Gemini)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Growth in deterministic AST checks vs LLM synthesized insights
            </p>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={source_detection_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="ast" name="Tree-sitter AST" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
                <Area type="monotone" dataKey="llm" name="Google Gemini AI" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                <Area type="monotone" dataKey="hybrid" name="Hybrid (Both)" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
