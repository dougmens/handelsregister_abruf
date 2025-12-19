
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { 
  GLOBAL_RATE_LIMIT, 
  USER_RATE_LIMIT, 
  USE_REAL_PROVIDER, 
  HR_CLI_IMAGE, 
  HR_DOCKER_TIMEOUT_SEC 
} from '../shared/constants';
import { SearchJob, ErrorCode, Company, User, RateLimitState } from '../types';

const STORAGE_DIR = process.env.HR_STORAGE_DIR || path.resolve(process.cwd(), 'data/pdfs');

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

  constructor() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  private cleanLimits() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    this.globalHits = this.globalHits.filter(h => h > hourAgo);
    this.userHits.forEach((hits, uid) => {
      this.userHits.set(uid, hits.filter(h => h > hourAgo));
    });
  }

  public getRateLimitState(userId: string = this.demoUser.id): RateLimitState {
    this.cleanLimits();
    const userHits = this.userHits.get(userId) || [];
    return {
      userCurrent: userHits.length,
      userMax: USER_RATE_LIMIT,
      globalCurrent: this.globalHits.length,
      globalMax: GLOBAL_RATE_LIMIT,
      isWarning: this.globalHits.length >= 50 || userHits.length >= 16
    };
  }

  public async createJob(company: Company, userId: string = this.demoUser.id): Promise<string> {
    this.cleanLimits();
    const limits = this.getRateLimitState(userId);

    // Enqueue check (Pre-check)
    if (limits.userCurrent >= USER_RATE_LIMIT || limits.globalCurrent >= GLOBAL_RATE_LIMIT) {
      throw new Error('RATE_LIMIT');
    }

    const jobId = `job_${crypto.randomBytes(4).toString('hex')}`;
    const job: SearchJob = {
      id: jobId,
      userId,
      companyId: company.id,
      companyName: company.name,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      protocol: [{ timestamp: Date.now(), message: 'Job in Warteschlange eingereiht.', type: 'info' }],
      metadata: { 
        provider: USE_REAL_PROVIDER ? 'real' : 'mock', 
        cacheHit: false, 
        durationMs: 0, 
        fetchedAt: Date.now() 
      }
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);
    
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
      // RATE LIMIT HIT COUNTING (Count when worker starts the actual request)
      this.globalHits.push(Date.now());
      const hits = this.userHits.get(job.userId) || [];
      this.userHits.set(job.userId, [...hits, Date.now()]);

      if (USE_REAL_PROVIDER) {
        await this.executeRealJobNode(job);
      } else {
        await this.executeMockJob(job);
      }
      job.status = 'done';
      job.progress = 100;
      job.protocol.push({ timestamp: Date.now(), message: 'Abruf erfolgreich beendet.', type: 'success' });
    } catch (err: any) {
      job.status = 'error';
      job.errorCode = err.message as ErrorCode;
      job.protocol.push({ timestamp: Date.now(), message: `Fehler: ${err.message}`, type: 'error' });
    } finally {
      this.isProcessing = false;
      // Serial Worker Delay (1s as requested)
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private async executeMockJob(job: SearchJob) {
    const startTime = Date.now();
    await new Promise(r => setTimeout(r, 2000));
    job.progress = 50;
    job.protocol.push({ timestamp: Date.now(), message: 'Register-Schnittstelle antwortet.', type: 'info' });
    
    // Server-side PDF mock storage
    const samplePath = path.resolve(process.cwd(), 'assets/sample-pdfs/sample.pdf');
    let pdfBuffer: Buffer;
    
    if (fs.existsSync(samplePath)) {
      pdfBuffer = fs.readFileSync(samplePath);
    } else {
      // Fallback: Create a minimal dummy PDF buffer if sample missing
      pdfBuffer = Buffer.from('%PDF-1.4\n%...\n%%EOF');
    }

    const { docId, sha256 } = this.savePdf(pdfBuffer);
    
    job.result = {
      summary: {
        purpose: 'Entwicklung und Vertrieb von Softwarelösungen sowie Beratung im IT-Bereich.',
        capital: '25.000,00 EUR',
        management: ['Max Mustermann (Geschäftsführer)'],
        procuration: ['Erika Musterfrau (Einzelprokura)'],
        lastChange: '2024-02-15'
      },
      pdfUrl: `/api/pdf/${docId}`,
      liveAvailable: false
    };
    job.metadata.sha256 = sha256;
    job.metadata.durationMs = Date.now() - startTime;
    job.protocol.push({ timestamp: Date.now(), message: `PDF gespeichert: ${docId}`, type: 'success' });
  }

  private savePdf(buffer: Buffer): { docId: string, sha256: string, storagePath: string } {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const docId = sha256; // sha256 as docId
    const storagePath = path.join(STORAGE_DIR, `${docId}.pdf`);
    
    if (!fs.existsSync(storagePath)) {
      fs.writeFileSync(storagePath, buffer);
    }
    
    return { docId, sha256, storagePath };
  }

  private async executeRealJobNode(job: SearchJob): Promise<void> {
    return new Promise((resolve, reject) => {
      const cleanName = job.companyName.trim().substring(0, 120);
      job.protocol.push({ timestamp: Date.now(), message: `Docker Spawn: ${HR_CLI_IMAGE} für "${cleanName}"`, type: 'info' });

      const docker = spawn('docker', ['run', '--rm', HR_CLI_IMAGE, '--company', cleanName]);
      
      const timeout = setTimeout(() => {
        docker.kill('SIGKILL');
        reject(new Error('TIMEOUT'));
      }, HR_DOCKER_TIMEOUT_SEC * 1000);

      docker.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error('DOCKER_MISSING'));
      });

      docker.on('close', (code) => {
        clearTimeout(timeout);
        job.protocol.push({ timestamp: Date.now(), message: `Docker beendet (Code=${code}).`, type: 'info' });
        if (code === 0) {
           job.protocol.push({ timestamp: Date.now(), message: "Noch kein PDF-Output implementiert.", type: 'info' });
           resolve();
        } else {
          reject(new Error('PROVIDER_ERROR'));
        }
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

  public getHistory(userId: string = this.demoUser.id): SearchJob[] {
    return Array.from(this.jobs.values())
      .filter(j => j.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }
}

export const localEngine = new RegiScanEngine();
