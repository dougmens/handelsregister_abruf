import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { RegiScanEngine } from './engine';
import { Company, ErrorCode } from '../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const engine = new RegiScanEngine();

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const STORAGE_DIR = process.env.HR_STORAGE_DIR || path.resolve(__dirname, 'data/pdfs');

app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }) as any);
app.use(express.json() as any);

// Minimal Auth Middleware (Demo Mode)
const authMiddleware = (req: any, res: any, next: any) => {
  req.userId = 'user_dev_123'; // Hardcoded for Phase 2.5
  next();
};

app.get('/api/me', authMiddleware, (req: any, res) => {
  const limits = engine.getRateLimitState(req.userId);
  res.json({ 
    id: req.userId,
    email: 'demo@regiscan.de',
    role: 'user',
    usage: { current: limits.userCurrent, limit: limits.userMax } 
  });
});

app.get('/api/limits', authMiddleware, (req: any, res) => {
  res.json(engine.getRateLimitState(req.userId));
});

app.post('/api/search', authMiddleware, async (req: any, res) => {
  try {
    const { company } = req.body as { company: Company };
    if (!company) return res.status(400).json({ errorCode: 'BAD_REQUEST' });
    
    const jobId = await engine.createJob(company, req.userId);
    res.json({ jobId });
  } catch (err: any) {
    const errorCode: ErrorCode = err.message === 'RATE_LIMIT' ? 'RATE_LIMIT' : 'PROVIDER_ERROR';
    res.status(err.message === 'RATE_LIMIT' ? 429 : 500).json({ errorCode });
  }
});

app.get('/api/jobs/:id', authMiddleware, (req, res) => {
  const job = engine.getJob(req.params.id);
  if (!job) return res.status(404).json({ errorCode: 'NOT_FOUND' });
  res.json(job);
});

app.get('/api/history', authMiddleware, (req: any, res) => {
  res.json(engine.getHistory(req.userId));
});

/**
 * SECURE PDF STREAMING WITH AUTH
 */
app.get('/api/pdf/:docId', authMiddleware, (req, res) => {
  const docId = req.params.docId;
  
  // Validation: sha256 format check
  if (!/^[a-f0-9]{64}$/.test(docId)) {
    return res.status(400).json({ errorCode: 'BAD_REQUEST' });
  }

  const filePath = path.join(STORAGE_DIR, `${docId}.pdf`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ errorCode: 'NOT_FOUND' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Handelsregister_AD_${docId.substring(0, 8)}.pdf"`);

  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('PDF Stream Error:', err);
    if (!res.headersSent) res.status(500).json({ errorCode: 'PROVIDER_ERROR' });
  });
  stream.pipe(res);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`RegiScan Backend running on port ${PORT}`));