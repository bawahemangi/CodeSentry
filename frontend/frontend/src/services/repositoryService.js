import api from './api';
import { MOCK_REPOSITORIES } from './mockData';

const REPOS_STORAGE_KEY = 'ai_code_review_repos_cache';

const getLocalRepos = () => {
  const cached = localStorage.getItem(REPOS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return MOCK_REPOSITORIES;
};

const saveLocalRepos = (repos) => {
  localStorage.setItem(REPOS_STORAGE_KEY, JSON.stringify(repos));
};

export const repositoryService = {
  /**
   * Fetches repositories for an installation.
   * Real endpoint: GET /api/repos/?installation_id=<id>
   */
  async getRepositories(installationId = '54321987') {
    try {
      const response = await api.get(`/repos/?installation_id=${installationId}`);
      if (response.data?.repos && Array.isArray(response.data.repos)) {
        // Map backend GitHub App repos to frontend shape
        const backendRepos = response.data.repos.map((r, idx) => ({
          id: r.id || idx + 1,
          name: r.name,
          full_name: r.full_name,
          owner: r.owner?.login || r.full_name?.split('/')[0] || 'nilakshib-star',
          owner_avatar: r.owner?.avatar_url || 'https://avatars.githubusercontent.com/u/9919?v=4',
          github_url: r.html_url || `https://github.com/${r.full_name}`,
          risk_profile: 'Standard sensitivity',
          scanning_enabled: Boolean(r.webhook_registered ?? true),
          webhook_installed: Boolean(r.webhook_registered ?? true),
          last_scan: 'Recently updated',
          total_prs: 5,
          total_reviews: 4,
          issues_count: 2,
          critical_issues: 0,
          language: r.language || 'Python',
          visibility: r.private ? 'private' : 'public',
        }));
        saveLocalRepos(backendRepos);
        return { repos: backendRepos, isLive: true };
      }
    } catch {
      console.info('[repositoryService] Real endpoint /api/repos/ not reachable, using local storage state');
    }

    const repos = getLocalRepos();
    return { repos, isLive: false };
  },

  /**
   * Get single repository details by ID or full_name
   */
  async getRepositoryById(id) {
    const repos = getLocalRepos();
    const repo = repos.find((r) => String(r.id) === String(id) || r.name === id || r.full_name === id);
    if (repo) return repo;
    return repos[0];
  },

  /**
   * Register webhook on repository
   * Real endpoint: POST /api/repos/register-webhooks/
   */
  async registerWebhook(repoFullName, installationId = '54321987') {
    try {
      const res = await api.post('/repos/register-webhooks/', {
        installation_id: Number(installationId),
        repos: [repoFullName],
      });
      return { success: true, data: res.data };
    } catch {
      console.warn('[repositoryService] Real register-webhooks endpoint unreachable, applying local state update');
    }

    // Update local cached state
    const repos = getLocalRepos();
    const updated = repos.map((r) =>
      r.full_name === repoFullName
        ? { ...r, scanning_enabled: true, webhook_installed: true }
        : r
    );
    saveLocalRepos(updated);
    return { success: true, localUpdate: true };
  },

  /**
   * Remove webhook from repository
   * Real endpoint: DELETE /api/repos/remove-webhook/
   */
  async removeWebhook(repoFullName, installationId = '54321987') {
    try {
      const res = await api.delete('/repos/remove-webhook/', {
        data: {
          installation_id: Number(installationId),
          repo: repoFullName,
        },
      });
      return { success: true, data: res.data };
    } catch {
      console.warn('[repositoryService] Real remove-webhook endpoint unreachable, applying local state update');
    }

    // Update local state
    const repos = getLocalRepos();
    const updated = repos.map((r) =>
      r.full_name === repoFullName
        ? { ...r, scanning_enabled: false, webhook_installed: false }
        : r
    );
    saveLocalRepos(updated);
    return { success: true, localUpdate: true };
  },

  /**
   * Toggle scanning enabled state
   */
  async toggleScanning(repoId, enabled, installationId = '54321987') {
    const repos = getLocalRepos();
    const target = repos.find((r) => String(r.id) === String(repoId));
    if (!target) return false;

    if (enabled) {
      await this.registerWebhook(target.full_name, installationId);
    } else {
      await this.removeWebhook(target.full_name, installationId);
    }

    const updated = repos.map((r) =>
      String(r.id) === String(repoId)
        ? { ...r, scanning_enabled: enabled, webhook_installed: enabled }
        : r
    );
    saveLocalRepos(updated);
    return true;
  },

  /**
   * Trigger on-demand review scan for a repository
   */
  async triggerScan(repoFullName) {
    // Simulate triggering review scan
    await new Promise((resolve) => setTimeout(resolve, 800));
    const repos = getLocalRepos();
    const updated = repos.map((r) =>
      r.full_name === repoFullName
        ? { ...r, last_scan: 'Just now', issues_count: Math.max(0, r.issues_count) }
        : r
    );
    saveLocalRepos(updated);
    return { success: true, timestamp: new Date().toISOString() };
  },
};

export default repositoryService;
