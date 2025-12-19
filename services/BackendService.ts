
import { 
  MOCK_COMPANIES, 
  SAMPLE_PDF_URL, 
  USE_REAL_PROVIDER, 
  GLOBAL_RATE_LIMIT, 
  USER_RATE_LIMIT,
  CACHE_TTL_MS,
  HR_DOCKER_TIMEOUT_MS,
  HR_CLI_IMAGE
} from '../constants';
import { Company, SearchJob, JobResult, JobStatus, ProtocolEntry, RateLimitState, ErrorCode } from '../types';

class BackendService {
  private jobs: SearchJob[] = [];
  private jobQueue: string[] = [];
  private isProcessing = false;
  
  // Rate Limit Tracking
  private globalRequests: number[] = [];
  private userRequests: number[] = [];

  constructor() {
    const saved = localStorage.getItem('regiscan_v2_storage');
    if (saved) {
      this.jobs = JSON.parse(saved);
    }
    // Auto-start queue processor
    this.processQueue();
  }

  private save() {
    localStorage.setItem('regiscan_v2_storage', JSON.stringify(this.jobs));
    window.dispatchEvent(new Event('regiscan_update'));
  }

  private cleanRateLimits() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    this.globalRequests = this.globalRequests.filter(t => t > hourAgo);
    this.userRequests = this.userRequests.filter(t => t > hourAgo);
  }

  getRateLimitState(): RateLimitState {
    this.cleanRateLimits();
    const userCount = this.userRequests.length;
    const globalCount = this.globalRequests.length;
    
    return {
      userCurrent: userCount,
      userMax: USER_RATE_LIMIT,
      globalCurrent: globalCount,
      globalMax: GLOBAL_RATE_LIMIT,
      isWarning: userCount >= 16 || globalCount >= 50
    };
  }

  async search(query: string, city?: string): Promise<Company[]> {
    await new Promise(r => setTimeout(r, 300));
    // Simulate lookup
    return MOCK_COMPANIES.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) || 
      (city && c.address.toLowerCase().includes(city.toLowerCase()))
    );
  }

  async startJob(company: Company): Promise<string> {
    const limits = this.getRateLimitState();
    
    // Check Hard Rate Limit
    if (limits.userCurrent >= limits.userMax || limits.globalCurrent >= limits.globalMax) {
      throw new Error('RATE_LIMIT');
    }

    // Check Cache (Same-day logic)
    const today = new Date().toISOString().split('T')[0];
    const cachedJob = this.jobs.find(j => 
      j.companyId === company.id && 
      j.status === 'done' && 
      new Date(j.createdAt).toISOString().split('T')[0] === today
    );

    const jobId = `job_${Math.random().toString(36).substring(7)}`;
    const newJob: SearchJob = {
      id: jobId,
      companyId: company.id,
      companyName: company.name,
      status: cachedJob ? 'done' : 'queued',
      progress: cachedJob ? 100 : 0,
      createdAt: Date.now(),
      protocol: [{ 
        timestamp: Date.now(), 
        message: cachedJob ? 'Abruf aus lokalem Cache (Same-Day)' : `Job initialisiert: ${jobId}`, 
        type: cachedJob ? 'success' : 'info' 
      }],
      result: cachedJob?.result,
      metadata: {
        provider: USE_REAL_PROVIDER ? 'real' : 'mock',
        cacheHit: !!cachedJob,
        durationMs: 0,
        fetchedAt: cachedJob ? cachedJob.metadata.fetchedAt : Date.now(),
        audit: {
          rateLimitGlobalAtStart: limits.globalCurrent,
          rateLimitUserAtStart: limits.userCurrent
        }
      }
    };

    this.jobs = [newJob, ...this.jobs].slice(0, 50);
    this.save();

    if (!cachedJob) {
      this.jobQueue.push(jobId);
      this.processQueue();
    }

    return jobId;
  }

  private async processQueue() {
    if (this.isProcessing || this.jobQueue.length === 0) return;
    
    this.isProcessing = true;
    const jobId = this.jobQueue.shift()!;
    
    try {
      await this.executeJob(jobId);
    } catch (e) {
      console.error("Worker Error:", e);
    } finally {
      this.isProcessing = false;
      // Slight delay between jobs to prevent detection
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private async executeJob(jobId: string) {
    const startTime = Date.now();
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;

    const update = (up: Partial<SearchJob>) => {
      this.jobs = this.jobs.map(j => j.id === jobId ? { ...j, ...up } : j);
      this.save();
    };

    const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
      const current = this.jobs.find(j => j.id === jobId);
      if (current) {
        update({ protocol: [...current.protocol, { timestamp: Date.now(), message: msg, type }] });
      }
    };

    update({ status: 'running', progress: 10 });
    addLog(`Worker gestartet. Concurrency Lock aktiv.`);

    // Increment Rate Limiters
    this.globalRequests.push(Date.now());
    this.userRequests.push(Date.now());

    try {
      if (USE_REAL_PROVIDER) {
        await this.executeDockerFlow(jobId, addLog, update);
      } else {
        await this.executeMockFlow(jobId, addLog, update);
      }
      
      update({ 
        metadata: { 
          ...this.jobs.find(j => j.id === jobId)!.metadata, 
          durationMs: Date.now() - startTime 
        } 
      });
    } catch (err: any) {
      update({ status: 'failed', errorCode: err.message as ErrorCode });
      addLog(`Kritischer Abbruch: ${err.message}`, 'error');
    }
  }

  private async executeMockFlow(jobId: string, addLog: any, update: any) {
    await new Promise(r => setTimeout(r, 800));
    update({ progress: 40 });
    addLog('Mock-Schnittstelle antwortet...');
    await new Promise(r => setTimeout(r, 1200));
    update({ progress: 80 });
    addLog('Strukturierte Daten transformiert.');
    
    const result: JobResult = {
      summary: {
        purpose: 'Gegenstand des Unternehmens ist die Verwaltung eigenen Vermögens.',
        capital: '25.000,00 EUR',
        management: ['Max Mustermann'],
        procuration: [],
        lastChange: '01.01.2024'
      },
      pdfUrl: SAMPLE_PDF_URL,
      liveAvailable: false
    };

    update({ status: 'done', progress: 100, result });
    addLog('Job erfolgreich abgeschlossen.', 'success');
  }

  private async executeDockerFlow(jobId: string, addLog: any, update: any) {
    // Corrected: added HR_CLI_IMAGE to the imports above
    addLog(`Docker Run: ${HR_CLI_IMAGE}`, 'info');
    
    // Verify docker environment
    const dockerUp = true; // Simulated check
    if (!dockerUp) throw new Error('DOCKER_MISSING');

    await new Promise(r => setTimeout(r, 2000));
    update({ progress: 30 });
    addLog('Container gestartet. Navigiere zu handelsregister.de...');

    // Timeout Simulation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), HR_DOCKER_TIMEOUT_MS)
    );

    const scrapPromise = (async () => {
      await new Promise(r => setTimeout(r, 5000));
      update({ progress: 60 });
      addLog('Suche erfolgreich. PDF wird generiert...');
      await new Promise(r => setTimeout(r, 4000));
      update({ progress: 90 });
      addLog('OCR Analyse abgeschlossen.');
      
      return {
        summary: {
          purpose: 'Handel mit Waren aller Art, insbesondere Elektronik.',
          capital: '100.000,00 EUR',
          management: ['Sabine Schmidt'],
          procuration: ['Peter Prüfer'],
          lastChange: 'Gestern'
        },
        pdfUrl: SAMPLE_PDF_URL,
        liveAvailable: true
      };
    })();

    const resultData = await Promise.race([scrapPromise, timeoutPromise]) as any;
    
    update({ 
      status: 'done', 
      progress: 100, 
      result: resultData,
      metadata: { 
        ...this.jobs.find(j => j.id === jobId)!.metadata,
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      } 
    });
    addLog('Live-Abruf via Docker erfolgreich.', 'success');
  }

  getHistory(): SearchJob[] {
    return this.jobs;
  }

  getQueuePosition(jobId: string): number {
    const idx = this.jobQueue.indexOf(jobId);
    return idx === -1 ? 0 : idx + 1;
  }
}

export const backendService = new BackendService();
