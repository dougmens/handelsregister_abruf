
import { MOCK_COMPANIES, SAMPLE_PDF_URL } from '../constants';
// Switch to shared types for consistency during migration
import { Company, SearchJob, JobResult, JobStatus } from '../shared/types';

class MockBackend {
  private jobs: SearchJob[] = [];
  private rateLimitCurrent = 0;

  constructor() {
    const saved = localStorage.getItem('regiscan_history');
    if (saved) {
      this.jobs = JSON.parse(saved);
    }
  }

  private save() {
    localStorage.setItem('regiscan_history', JSON.stringify(this.jobs));
  }

  async search(query: string, city?: string): Promise<Company[]> {
    await new Promise(r => setTimeout(r, 600)); // Simulate network
    return MOCK_COMPANIES.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) || 
      (city && c.court.toLowerCase().includes(city.toLowerCase()))
    );
  }

  async startJob(company: Company): Promise<string> {
    const jobId = Math.random().toString(36).substring(7);
    const newJob: SearchJob = {
      id: jobId,
      // Added missing userId property required by SearchJob interface
      userId: 'mock_user_123',
      companyId: company.id,
      companyName: company.name,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      // Fixed: protocol now correctly uses ProtocolEntry objects instead of strings
      protocol: [{ timestamp: Date.now(), message: `Job ${jobId} initialisiert für ${company.name}`, type: 'info' }],
      // Fixed: removed invalid 'audit' property from metadata which caused type error
      metadata: {
        provider: 'mock',
        cacheHit: false,
        durationMs: 0,
        fetchedAt: Date.now()
      }
    };

    this.jobs = [newJob, ...this.jobs].slice(0, 15);
    this.save();
    this.processJob(jobId);
    return jobId;
  }

  private async processJob(jobId: string) {
    const updateJob = (updates: Partial<SearchJob>) => {
      this.jobs = this.jobs.map(j => j.id === jobId ? { ...j, ...updates } : j);
      this.save();
    };

    const addProtocol = (msg: string) => {
      const job = this.jobs.find(j => j.id === jobId);
      if (job) {
        // Fixed: addProtocol now pushes a ProtocolEntry object
        updateJob({ protocol: [...job.protocol, { timestamp: Date.now(), message: msg, type: 'info' }] });
      }
    };

    // Queued -> Running
    await new Promise(r => setTimeout(r, 1500));
    updateJob({ status: 'running', progress: 10 });
    addProtocol('Verbindung zum Registerportal wird aufgebaut...');

    await new Promise(r => setTimeout(r, 2000));
    updateJob({ progress: 40 });
    addProtocol('Suche nach HRB-Nummer erfolgreich.');

    await new Promise(r => setTimeout(r, 1500));
    updateJob({ progress: 70 });
    addProtocol('Dokument wird abgerufen und OCR-verarbeitet...');

    await new Promise(r => setTimeout(r, 2000));
    
    const mockResult: JobResult = {
      summary: {
        purpose: 'Entwicklung und Vertrieb von Softwarelösungen sowie Beratung im IT-Bereich.',
        capital: '25.000,00 EUR',
        management: ['Max Mustermann (Geschäftsführer)', 'Erika Musterfrau (Geschäftsführerin)'],
        procuration: ['Lars Leise (Einzelprokura)'],
        lastChange: '15.05.2023 (Eintragung der Prokura)'
      },
      pdfUrl: SAMPLE_PDF_URL,
      // Fixed: added missing liveAvailable property required by JobResult interface
      liveAvailable: false
    };

    updateJob({ 
      status: 'done', 
      progress: 100, 
      result: mockResult 
    });
    addProtocol('Vorgang erfolgreich abgeschlossen. Daten extrahiert.');
  }

  getJob(jobId: string): SearchJob | undefined {
    return this.jobs.find(j => j.id === jobId);
  }

  getHistory(): SearchJob[] {
    return this.jobs;
  }

  getRateLimit() {
    return { current: 12, max: 60 };
  }
}

export const mockBackend = new MockBackend();
