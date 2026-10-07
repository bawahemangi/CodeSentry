import api from './api';
import { MOCK_ANALYTICS } from './mockData';

export const analyticsService = {
  async getAnalytics(timeRange = '3_months', repoId = 'all') {
    try {
      const res = await api.get(`/analytics/?range=${timeRange}&repo=${repoId}`);
      if (res.data?.kpis) {
        return res.data;
      }
    } catch {
      // Backend analytics endpoint not available yet
    }

    return MOCK_ANALYTICS;
  },
};

export default analyticsService;
