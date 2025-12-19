
import { server } from './server';
import { Company, SearchJob, User, RateLimitState } from './types';

/**
 * This client simulates fetch calls to /api/* 
 * In a real production app, this would use fetch() or axios.
 */
export const apiClient = {
  async getMe(): Promise<User> {
    return server.getCurrentUser();
  },

  async getRateLimits(): Promise<RateLimitState> {
    const user = await this.getMe();
    return server.getRateLimitState(user.id);
  },

  async search(query: string): Promise<Company[]> {
    // Simulierter Directory-Lookup
    await new Promise(r => setTimeout(r, 500));
    return [
      { id: '1', name: query || 'Beispiel GmbH', hrb: 'HRB 123', court: 'Berlin', address: 'Musterstr. 1', status: 'active' }
    ];
  },

  async startJob(company: Company): Promise<string> {
    return server.createJob(company);
  },

  async getJob(jobId: string): Promise<SearchJob | undefined> {
    return server.getJob(jobId);
  },

  async getHistory(): Promise<SearchJob[]> {
    const user = await this.getMe();
    return server.getHistory(user.id);
  }
};
