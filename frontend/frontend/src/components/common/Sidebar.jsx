import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  ShieldAlert,
  GitPullRequest,
  FolderGit2,
  FileText,
  BarChart3,
  Sliders,
  Settings,
  Key,
  BookOpen,
  LifeBuoy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bot,
  Layers,
  Sparkles,
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showOrgSelect, setShowOrgSelect] = useState(false);

  const orgName = user?.org || 'nilakshib-star';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Top Organization Switcher */}
      <div
        className="sidebar-org-selector"
        onClick={() => setShowOrgSelect(!showOrgSelect)}
        title="Active GitHub Workspace"
      >
        <div className="sidebar-org-info">
          <div className="sidebar-org-avatar">
            <GithubIcon size={18} />
          </div>
          {!collapsed && (
            <span className="sidebar-org-name">{orgName}</span>
          )}
        </div>
        {!collapsed && <ChevronDown size={14} style={{ color: 'var(--sidebar-text-muted)' }} />}
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav-container">
        {/* Core Review & Security Scans */}
        <div className="sidebar-section">
          {!collapsed && <div className="sidebar-section-title">Security & Scans</div>}

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Overview & Issues"
          >
            <div className="sidebar-link-content">
              <ShieldAlert size={16} />
              {!collapsed && <span>Issues</span>}
            </div>
            {!collapsed && <span className="sidebar-badge">4</span>}
          </NavLink>

          <NavLink
            to="/repositories"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Repositories"
          >
            <div className="sidebar-link-content">
              <FolderGit2 size={16} />
              {!collapsed && <span>Repositories</span>}
            </div>
            {!collapsed && <span className="sidebar-badge">5</span>}
          </NavLink>

          <NavLink
            to="/pull-requests"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Pull Requests"
          >
            <div className="sidebar-link-content">
              <GitPullRequest size={16} />
              {!collapsed && <span>Pull Requests</span>}
            </div>
            {!collapsed && <span className="sidebar-badge">5</span>}
          </NavLink>

          <NavLink
            to="/reviews"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Reviews History"
          >
            <div className="sidebar-link-content">
              <FileText size={16} />
              {!collapsed && <span>Reviews</span>}
            </div>
          </NavLink>
        </div>

        {/* Code Reviews & Insights */}
        <div className="sidebar-section">
          {!collapsed && <div className="sidebar-section-title">Code Reviews</div>}

          <NavLink
            to="/analytics"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Analytics"
          >
            <div className="sidebar-link-content">
              <BarChart3 size={16} />
              {!collapsed && <span>Analytics</span>}
            </div>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Repo & Bot Settings"
          >
            <div className="sidebar-link-content">
              <Sliders size={16} />
              {!collapsed && <span>Repo Settings</span>}
            </div>
          </NavLink>
        </div>

        {/* Integrations */}
        <div className="sidebar-section">
          {!collapsed && <div className="sidebar-section-title">Integrations</div>}

          <a
            href="https://github.com/apps"
            target="_blank"
            rel="noreferrer"
            className="sidebar-link"
            title="GitHub App Configuration"
          >
            <div className="sidebar-link-content">
              <GithubIcon size={16} />
              {!collapsed && <span>GitHub App</span>}
            </div>
          </a>

          <Link to="/settings" className="sidebar-link" title="Tree-sitter AST & Gemini AI">
            <div className="sidebar-link-content">
              <Sparkles size={16} />
              {!collapsed && <span>AI & AST Engine</span>}
            </div>
          </Link>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="sidebar-footer">
        <Link to="/settings" className="sidebar-link" title="Documentation">
          <div className="sidebar-link-content">
            <BookOpen size={16} />
            {!collapsed && <span>Docs & Rules</span>}
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link"
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'space-between' }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <div className="sidebar-link-content">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse Sidebar</span>}
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
