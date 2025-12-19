
import { 
  USE_REAL_PROVIDER, 
  GLOBAL_RATE_LIMIT, 
  USER_RATE_LIMIT, 
  HR_DOCKER_TIMEOUT_MS 
} from './constants';
import { Company, SearchJob, JobResult, ProtocolEntry, ErrorCode, User, RateLimitState } from './types';

/**
 * MOCK DB & STATE (In a real Node app, this would be SQLite/Prisma + Redis)
 */
class ServerInternal {
  private jobs: Map<string, SearchJob> = new Map();
  private documents: Map<string, { path: string, sha: string }> = new Map();
  private queue: string[] = [];
  private isProcessing = false;
  
  private globalHits: number[] = [];
  private userHits: Map<string, number[]> = new Map();

  // Test User
  private currentUser: User = {
    id: 'user_1',
    email: 'demo@regiscan.de',
    role: 'user',
    usage: { current: 0, limit: USER_RATE_LIMIT }
  };

  constructor() {
    this.startWorker();
  }

  // --- AUTH ---
  getCurrentUser() { return this.currentUser; }

  // --- RATE LIMITING ---
  private cleanHits() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    this.globalHits = this.globalHits.filter(t => t > hourAgo);
    this.userHits.forEach((hits, uid) => {
      this.userHits.set(uid, hits.filter(t => t > hourAgo));
    });
  }

  getRateLimitState(userId: string): RateLimitState {
    this.cleanHits();
    const userCount = this.userHits.get(userId)?.length || 0;
    const globalCount = this.globalHits.length;
    return {
      userCurrent: userCount,
      userMax: USER_RATE_LIMIT,
      globalCurrent: globalCount,
      globalMax: GLOBAL_RATE_LIMIT,
      isWarning: userCount > 15 || globalCount > 50
    };
  }

  // --- QUEUE & WORKER ---
  async createJob(company: Company): Promise<string> {
    const userId = this.currentUser.id;
    const limits = this.getRateLimitState(userId);

    if (limits.userCurrent >= limits.userMax || limits.globalCurrent >= limits.globalMax) {
      throw new Error('RATE_LIMIT');
    }

    // Cache Check (Same-Day)
    const cacheKey = `cache_${company.id}`;
    const today = new Date().toISOString().split('T')[0];
    const existing = Array.from(this.jobs.values()).find(j => 
      j.companyId === company.id && 
      j.status === 'done' && 
      new Date(j.createdAt).toISOString().split('T')[0] === today
    );

    const jobId = `job_${Math.random().toString(36).substring(7)}`;
    const job: SearchJob = {
      id: jobId,
      userId,
      companyId: company.id,
      companyName: company.name,
      status: existing ? 'done' : 'queued',
      progress: existing ? 100 : 0,
      createdAt: Date.now(),
      protocol: [{ timestamp: Date.now(), message: existing ? 'Cache-Hit: Dokument bereits vorhanden.' : 'Job in Warteschlange eingereiht.', type: 'info' }],
      result: existing?.result,
      metadata: {
        provider: USE_REAL_PROVIDER ? 'real' : 'mock',
        cacheHit: !!existing,
        durationMs: 0,
        fetchedAt: existing ? existing.metadata.fetchedAt : Date.now(),
      }
    };

    this.jobs.set(jobId, job);
    if (!existing) {
      this.queue.push(jobId);
    }
    return jobId;
  }

  private async startWorker() {
    if (this.isProcessing) return;
    setInterval(async () => {
      if (this.isProcessing || this.queue.length === 0) return;
      this.isProcessing = true;
      const jobId = this.queue.shift()!;
      await this.processJob(jobId);
      this.isProcessing = false;
    }, 1000);
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'running';
    job.progress = 10;
    this.globalHits.push(Date.now());
    const uHits = this.userHits.get(job.userId) || [];
    this.userHits.set(job.userId, [...uHits, Date.now()]);

    const startTime = Date.now();
    try {
      if (USE_REAL_PROVIDER) {
        await this.runRealProvider(job);
      } else {
        await this.runMockProvider(job);
      }
      job.metadata.durationMs = Date.now() - startTime;
      job.status = 'done';
      job.progress = 100;
    } catch (e: any) {
      job.status = 'failed';
      job.errorCode = e.message as ErrorCode;
    }
  }

  private async runMockProvider(job: SearchJob) {
    job.protocol.push({ timestamp: Date.now(), message: 'Mock-Engine gestartet...', type: 'info' });
    await new Promise(r => setTimeout(r, 2000));
    job.progress = 50;
    job.protocol.push({ timestamp: Date.now(), message: 'Daten extrahiert.', type: 'success' });
    
    job.result = {
      summary: {
        purpose: 'Handel mit IT-Produkten.',
        capital: '25.000 EUR',
        management: ['Max Mustermann'],
        procuration: [],
        lastChange: '01.01.2024'
      },
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      liveAvailable: false
    };
  }

  private async runRealProvider(job: SearchJob) {
    // In Node.js: spawn('docker', ['run', ...])
    job.protocol.push({ timestamp: Date.now(), message: 'Starte Docker-Container...', type: 'info' });
    await new Promise(r => setTimeout(r, 5000)); // Simulate CLI time
    throw new Error('DOCKER_MISSING'); // Fallback for simulation
  }

  getJob(id: string) {
    const job = this.jobs.get(id);
    if (job && job.status === 'queued') {
      job.queuePosition = this.queue.indexOf(id) + 1;
    }
    return job;
  }

  getHistory(userId: string) {
    return Array.from(this.jobs.values())
      .filter(j => j.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }
}

export const server = new ServerInternal();
