
export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export type ErrorCode = 
  | 'NO_HIT' 
  | 'AMBIGUOUS' 
  | 'TIMEOUT' 
  | 'BLOCKED' 
  | 'PARSE_CHANGED' 
  | 'DOCKER_MISSING' 
  | 'PROVIDER_ERROR'
  | 'RATE_LIMIT'
  | 'UNAUTHORIZED';

export interface Company {
  id: string;
  name: string;
  hrb: string;
  court: string;
  address: string;
  status: 'active' | 'inactive';
}

export interface SearchJob {
  id: string;
  userId: string;
  companyId: string;
  companyName: string;
  status: JobStatus;
  progress: number;
  createdAt: number;
  queuePosition?: number;
  errorCode?: ErrorCode;
  result?: JobResult;
  protocol: ProtocolEntry[];
  metadata: {
    provider: 'mock' | 'real';
    cacheHit: boolean;
    durationMs: number;
    fetchedAt: number;
    sha256?: string;
    // Added audit property to track internal rate limit states when a job is initiated
    audit?: {
      rateLimitGlobalAtStart: number;
      rateLimitUserAtStart: number;
    };
  };
}

export interface ProtocolEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'success';
}

export interface JobResult {
  summary: {
    purpose: string;
    capital: string;
    management: string[];
    procuration: string[];
    lastChange: string;
  };
  pdfUrl: string;
  liveAvailable: boolean;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  usage: {
    current: number;
    limit: number;
  };
}

export interface RateLimitState {
  userCurrent: number;
  userMax: number;
  globalCurrent: number;
  globalMax: number;
  isWarning: boolean;
}
