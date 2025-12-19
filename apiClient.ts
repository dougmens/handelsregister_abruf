import { API_BASE_URL } from './shared/constants';
import { Company, SearchJob, User, RateLimitState } from './shared/types';
import { localEngine } from './backend/engine';

// Explicit type definition for apiClient to ensure that 'this' 
// within methods correctly recognizes generic signatures.
export interface ApiClient {
  isLocalFallback: boolean;
  request<T>(path: string, options?: RequestInit): Promise<T>;
  handleLocal<T>(path: string, options?: RequestInit): Promise<T>;
  getMe(): Promise<User>;
  getRateLimits(): Promise<RateLimitState>;
  search(query: string): Promise<Company[]>;
  startJob(company: Company): Promise<string>;
  getJob(jobId: string): Promise<SearchJob>;
  getHistory(): Promise<SearchJob[]>;
}

export const apiClient: ApiClient = {
  isLocalFallback: false,

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, options);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errorCode || 'UNKNOWN_ERROR');
      }
      this.isLocalFallback = false;
      return res.json() as Promise<T>;
    } catch (err: any) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        this.isLocalFallback = true;
        // Fix: Explicit typing of apiClient ensures handleLocal<T> is recognized as generic.
        return this.handleLocal<T>(path, options);
      }
      throw err;
    }
  },

  async handleLocal<T>(path: string, options?: RequestInit): Promise<T> {
    console.warn(`Backend unreachable at ${API_BASE_URL}. Falling back to Local Engine.`);
    
    if (path === '/api/me') {
      const limits = localEngine.getRateLimitState();
      return { 
        ...localEngine.demoUser, 
        usage: { current: limits.userCurrent, limit: limits.userMax } 
      } as unknown as T;
    }
    
    if (path === '/api/limits') {
      return localEngine.getRateLimitState() as unknown as T;
    }

    if (path === '/api/search' && options?.method === 'POST') {
      const { company } = JSON.parse(options.body as string);
      const jobId = await localEngine.createJob(company);
      return { jobId } as unknown as T;
    }

    if (path.startsWith('/api/jobs/')) {
      const id = path.split('/').pop()!;
      const job = localEngine.getJob(id);
      if (!job) throw new Error('NOT_FOUND');
      return job as unknown as T;
    }

    if (path === '/api/history') {
      return localEngine.getHistory() as unknown as T;
    }

    throw new Error('NOT_IMPLEMENTED_LOCALLY');
  },

  async getMe(): Promise<User> {
    // Fix: Explicit typing ensures request<User> is recognized as generic.
    return this.request<User>('/api/me');
  },

  async getRateLimits(): Promise<RateLimitState> {
    // Fix: Explicit typing ensures request<RateLimitState> is recognized as generic.
    return this.request<RateLimitState>('/api/limits');
  },

  async search(query: string): Promise<Company[]> {
    await new Promise(r => setTimeout(r, 400));
    // Firmenverzeichnis (Mock)
    const companies: Company[] = [
      { id: '1', name: 'TechFlow GmbH', hrb: 'HRB 12345', court: 'Berlin', address: 'Weg 1, 10115 Berlin', status: 'active' },
      { id: '2', name: 'GreenEnergy AG', hrb: 'HRB 67890', court: 'München', address: 'Allee 7, 80331 München', status: 'active' },
      { id: '3', name: 'Logistics 24 SE', hrb: 'HRB 11223', court: 'Hamburg', address: 'Hafenstr 10, 20457 Hamburg', status: 'inactive' }
    ];
    return companies.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  },

  async startJob(company: Company): Promise<string> {
    // Fix: Explicit typing ensures request<{jobId: string}> is recognized as generic.
    const data = await this.request<{jobId: string}>('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company })
    });
    return data.jobId;
  },

  async getJob(jobId: string): Promise<SearchJob> {
    // Fix: Explicit typing ensures request<SearchJob> is recognized as generic.
    return this.request<SearchJob>(`/api/jobs/${jobId}`);
  },

  async getHistory(): Promise<SearchJob[]> {
    // Fix: Explicit typing ensures request<SearchJob[]> is recognized as generic.
    return this.request<SearchJob[]>('/api/history');
  }
};