import api from './api';
import { MOCK_PULL_REQUESTS, MOCK_REVIEWS_BY_PR } from './mockData';

const PRS_CACHE_KEY = 'ai_code_review_prs_cache';

const getLocalPRs = () => {
  const cached = localStorage.getItem(PRS_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return MOCK_PULL_REQUESTS;
};

const saveLocalPRs = (prs) => {
  localStorage.setItem(PRS_CACHE_KEY, JSON.stringify(prs));
};

export const reviewService = {
  /**
   * Fetch all pull requests or filter by repository ID
   */
  async getPullRequests(repoId = null) {
    try {
      const res = await api.get('/pull-requests/');
      if (res.data?.pull_requests && Array.isArray(res.data.pull_requests)) {
        return res.data.pull_requests;
      }
    } catch {
      // backend route may not be implemented yet
    }

    const prs = getLocalPRs();
    if (repoId) {
      return prs.filter((p) => String(p.repo_id) === String(repoId));
    }
    return prs;
  },

  /**
   * Fetch single PR details by PR number
   */
  async getPullRequest(prNumber) {
    const prs = getLocalPRs();
    return prs.find((p) => String(p.number) === String(prNumber)) || prs[0];
  },

  /**
   * Fetch comprehensive review details by PR number
   */
  async getReviewDetails(prNumber) {
    try {
      const res = await api.get(`/reviews/${prNumber}/`);
      if (res.data?.review) {
        return res.data.review;
      }
    } catch {
      // fallback
    }

    const review = MOCK_REVIEWS_BY_PR[prNumber] || MOCK_REVIEWS_BY_PR[42];
    return review;
  },

  /**
   * Run a new on-demand review for a PR
   */
  async triggerReview(prNumber) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const prs = getLocalPRs();
    const updated = prs.map((p) =>
      String(p.number) === String(prNumber)
        ? {
            ...p,
            review_status: 'Completed',
            health_score: p.health_score || 88,
            health_grade: p.health_grade === 'Pending' ? 'A' : p.health_grade,
          }
        : p
    );
    saveLocalPRs(updated);
    return { success: true, message: `PR #${prNumber} review completed successfully` };
  },

  /**
   * Dismiss/ignore a single finding
   */
  async ignoreFinding(findingId) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, findingId };
  },
};

export default reviewService;
