import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  LogOut,
  User,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ArchitectureModal from './ArchitectureModal';

export const Header = () => {
  const { user, logout, isBackendOnline, refreshBackendStatus } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showArchModal, setShowArchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Path to title
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'Overview';
    if (path.startsWith('/repositories/')) return 'Repository Details';
    if (path === '/repositories') return 'Repositories';
    if (path.startsWith('/reviews/')) return 'Pull Request Review';
    if (path === '/reviews') return 'Reviews';
    if (path.startsWith('/pull-requests/')) return 'Pull Request';
    if (path === '/pull-requests') return 'Pull Requests';
    if (path === '/analytics') return 'Analytics';
    if (path === '/settings') return 'Settings & Engine';
    return 'Dashboard';
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    addToast(`Searching across repositories & PRs for "${searchQuery}"...`, 'info');
    // If it's a number like 42, navigate to reviews
    if (!isNaN(searchQuery)) {
      navigate(`/reviews/${searchQuery}`);
    } else {
      navigate(`/repositories?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleBackendCheck = async () => {
    addToast('Testing connection with Django backend at http://127.0.0.1:8000/api ...', 'info');
    await refreshBackendStatus();
    if (isBackendOnline) {
      addToast('Django REST API is online and responding!', 'success');
    } else {
      addToast('Backend not detected on port 8000. Running seamlessly in Demo Mode.', 'warning');
    }
  };

  return (
    <>
      <header className="header-bar">
        {/* Left: Breadcrumbs */}
        <div className="header-left">
          <div className="header-breadcrumb">
            <span style={{ color: 'var(--text-muted)' }}>AI Review Bot</span>
            <span className="separator">/</span>
            <span className="current">{getBreadcrumb()}</span>
          </div>

          <form onSubmit={handleSearchSubmit} className="search-input-wrap">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search PRs, repos, issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right: Actions, Backend Status, User Menu */}
        <div className="header-right">
          {/* Architecture trigger */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowArchModal(true)}
            title="Inspect end-to-end webhook architecture"
          >
            <HelpCircle size={14} />
            <span>Architecture Flow</span>
          </button>

          {/* Backend Status indicator */}
          <button
            type="button"
            className={`backend-status-pill ${isBackendOnline ? 'online' : 'demo'}`}
            onClick={handleBackendCheck}
            title="Click to re-check Django REST API connection"
          >
            <span className="pulse-dot"></span>
            <span>{isBackendOnline ? 'Django API Connected' : 'Demo Mode (Offline)'}</span>
            <RefreshCw size={11} style={{ opacity: 0.7 }} />
          </button>

          {/* Notifications bell */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Recent Notifications"
            >
              <Bell size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '7px',
                  height: '7px',
                  backgroundColor: 'var(--brand-primary)',
                  borderRadius: '50%',
                }}
              ></span>
            </button>

            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '320px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2 new</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>PR #42 Review Completed</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      1 critical vulnerability detected by Tree-sitter + Gemini
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Webhook Verified</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      GitHub webhook listener active on /api/webhook/
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User profile menu */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <img
                src={user?.avatar_url || 'https://avatars.githubusercontent.com/u/9919?v=4'}
                alt="Avatar"
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-color)' }}
              />
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.username || 'nilakshib-star'}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {user?.role || 'Developer'}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '48px',
                  width: '240px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  padding: '0.5rem',
                }}
              >
                <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{user?.name || 'Nilakshi B'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email || 'nilakshi@bot.ai'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem 0' }}>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="sidebar-link"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <GithubIcon size={15} />
                    <span>View GitHub Profile</span>
                  </a>
                  <Link to="/settings" className="sidebar-link" style={{ color: 'var(--text-primary)' }}>
                    <User size={15} />
                    <span>Bot Preferences</span>
                  </Link>
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={logout}
                    className="sidebar-link"
                    style={{ width: '100%', color: 'var(--color-danger)', border: 'none' }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Architecture Modal */}
      <ArchitectureModal isOpen={showArchModal} onClose={() => setShowArchModal(false)} />
    </>
  );
};

export default Header;
