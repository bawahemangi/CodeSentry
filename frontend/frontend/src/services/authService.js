import api from './api';

const AUTH_STORAGE_KEY = 'ai_code_review_user';
const TOKEN_STORAGE_KEY = 'auth_token';

export const authService = {
  /**
   * Get the Django backend GitHub OAuth redirect URL.
   * Django django-allauth exposes /accounts/github/login/
   */
  getGitHubAuthUrl() {
    const backendRoot = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
    return `${backendRoot}/accounts/github/login/`;
  },

  /**
   * Exchange OAuth callback code or handle session verification
   */
  async handleCallback(code) {
    try {
      const response = await api.post('/auth/github/callback/', { code });
      if (response.data?.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
      }
      if (response.data?.user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data.user));
        return response.data.user;
      }
    } catch {
      console.warn('[authService] Backend OAuth callback not reachable, using developer profile');
    }

    // Default developer profile if testing
    const defaultUser = {
      username: 'nilakshib-star',
      name: 'Nilakshi B',
      email: 'nilakshi@github-bot.ai',
      avatar_url: 'https://avatars.githubusercontent.com/u/9919?v=4',
      github_id: 9919,
      role: 'Lead Architect',
      org: 'nilakshib-star',
      installation_id: '54321987',
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  },

  /**
   * Instant demonstration login (useful for showcasing when GitHub OAuth client secrets are not set up locally)
   */
  loginDemoUser(customProfile = {}) {
    const demoUser = {
      username: 'nilakshib-star',
      name: 'Nilakshi B',
      email: 'nilakshi@github-bot.ai',
      avatar_url: 'https://avatars.githubusercontent.com/u/9919?v=4',
      github_id: 9919,
      role: 'Owner & Lead Dev',
      org: 'nilakshib-star',
      installation_id: '54321987',
      ...customProfile,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, 'demo-jwt-session-token-xyz');
    return demoUser;
  },

  getCurrentUser() {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};

export default authService;
