
import { 
  GLOBAL_RATE_LIMIT, 
  USER_RATE_LIMIT, 
  USE_REAL_PROVIDER, 
  HR_CLI_IMAGE, 
  HR_DOCKER_TIMEOUT_SEC 
} from '../shared/constants';
import { SearchJob, ErrorCode, Company, User, RateLimitState } from '../shared/types';

export class RegiScanEngine {
  private jobs = new Map<string, SearchJob>();
  private queue: string[] = [];
  private isProcessing = false;
  private globalHits: number[] = [];
  private userHits = new Map<string, number[]>();

  public demoUser: User = {
    id: 'user_dev_123',
    email: 'demo@regiscan.de',
    role: 'user',
    usage: { current: 0, limit: USER_RATE_LIMIT }
  };

  private cleanLimits() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    while(this.globalHits.length > 0 && this.globalHits[0] < hourAgo) this.globalHits.shift();
    this.userHits.forEach((hits, uid) => {
      const fresh = hits.filter(h => h > hourAgo);
      this.userHits.set(uid, fresh);
    });
  }

  public getRateLimitState(): RateLimitState {
    this.cleanLimits();
    const userCount = this.userHits.get(this.demoUser.id)?.length || 0;
    return {
      userCurrent: userCount,
      userMax: USER_RATE_LIMIT,
      globalCurrent: this.globalHits.length,
      globalMax: GLOBAL_RATE_LIMIT,
      isWarning: this.globalHits.length > 50
    };
  }

  public async createJob(company: Company): Promise<string> {
    this.cleanLimits();
    const limits = this.getRateLimitState();

    if (limits.userCurrent >= USER_RATE_LIMIT || limits.globalCurrent >= GLOBAL_RATE_LIMIT) {
      throw new Error('RATE_LIMIT');
    }

    const jobId = `job_${Math.random().toString(36).substring(7)}`;
    const job: SearchJob = {
      id: jobId,
      userId: this.demoUser.id,
      companyId: company.id,
      companyName: company.name,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      protocol: [{ timestamp: Date.now(), message: 'Job erstellt.', type: 'info' }],
      metadata: { 
        provider: USE_REAL_PROVIDER ? 'real' : 'mock', 
        cacheHit: false, 
        durationMs: 0, 
        fetchedAt: Date.now() 
      }
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);
    
    this.globalHits.push(Date.now());
    const hits = this.userHits.get(this.demoUser.id) || [];
    this.userHits.set(this.demoUser.id, [...hits, Date.now()]);

    this.processQueue();
    return jobId;
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    
    const jobId = this.queue.shift()!;
    const job = this.jobs.get(jobId);

    if (!job) {
      this.isProcessing = false;
      this.processQueue();
      return;
    }

    job.status = 'running';
    job.progress = 10;
    job.protocol.push({ timestamp: Date.now(), message: 'Worker gestartet. Task reserviert.', type: 'info' });

    try {
      // Isomorphic Check
      if (USE_REAL_PROVIDER && typeof process !== 'undefined' && process.versions && process.versions.node) {
        await this.executeRealJobNode(job);
      } else {
        await this.executeMockJob(job);
      }
      job.status = 'done';
      job.progress = 100;
      job.protocol.push({ timestamp: Date.now(), message: 'Abruf erfolgreich beendet.', type: 'success' });
    } catch (err: any) {
      job.status = 'failed';
      job.errorCode = err.message as ErrorCode;
      job.protocol.push({ timestamp: Date.now(), message: `Fehler: ${err.message}`, type: 'error' });
    } finally {
      this.isProcessing = false;
      // Serial Worker Delay
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private async executeMockJob(job: SearchJob) {
    await new Promise(r => setTimeout(r, 2000));
    job.progress = 50;
    job.protocol.push({ timestamp: Date.now(), message: 'Register-Schnittstelle antwortet.', type: 'info' });
    await new Promise(r => setTimeout(r, 1000));
    
    job.result = {
      summary: {
        purpose: 'Handel mit Waren aller Art und Beratung.',
        capital: '25.000,00 EUR',
        management: ['Max Mustermann'],
        procuration: [],
        lastChange: '2024-02-15'
      },
      pdfUrl: `/api/pdf/mock_${job.id}`,
      liveAvailable: false
    };
  }

  private async executeRealJobNode(job: SearchJob): Promise<void> {
    const { spawn } = await import('child_process');
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['run', '--rm', HR_CLI_IMAGE, '--company', job.companyName]);
      const timeout = setTimeout(() => {
        docker.kill();
        reject(new Error('TIMEOUT'));
      }, HR_DOCKER_TIMEOUT_SEC * 1000);

      docker.on('error', () => {
        clearTimeout(timeout);
        reject(new Error('DOCKER_MISSING'));
      });

      docker.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else reject(new Error('PROVIDER_ERROR'));
      });
    });
  }

  public getJob(id: string): SearchJob | undefined {
    const job = this.jobs.get(id);
    if (job && job.status === 'queued') {
      job.queuePosition = this.queue.indexOf(job.id) + 1;
    }
    return job;
  }

  public getHistory(): SearchJob[] {
    return Array.from(this.jobs.values())
      .filter(j => j.userId === this.demoUser.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }
}

export const localEngine = new RegiScanEngine();
