import express from 'express';
import cors from 'cors';
import { RegiScanEngine } from './engine';
import { Company } from '../shared/types';
import path from 'path';

const app = express();
const engine = new RegiScanEngine();

// Fix: Cast middleware to 'any' to resolve type mismatch between body-parser/cors and Express app.use().
app.use(cors() as any);
app.use(express.json() as any);

app.get('/api/me', (req, res) => {
  const limits = engine.getRateLimitState();
  res.json({ 
    ...engine.demoUser, 
    usage: { current: limits.userCurrent, limit: limits.userMax } 
  });
});

app.get('/api/limits', (req, res) => {
  res.json(engine.getRateLimitState());
});

app.post('/api/search', async (req, res) => {
  try {
    const { company } = req.body as { company: Company };
    const jobId = await engine.createJob(company);
    res.json({ jobId });
  } catch (err: any) {
    if (err.message === 'RATE_LIMIT') {
      res.status(429).json({ errorCode: 'RATE_LIMIT' });
    } else {
      res.status(500).json({ errorCode: 'PROVIDER_ERROR' });
    }
  }
});

app.get('/api/jobs/:id', (req, res) => {
  const job = engine.getJob(req.params.id);
  if (!job) return res.status(404).send();
  res.json(job);
});

app.get('/api/history', (req, res) => {
  res.json(engine.getHistory());
});

app.get('/api/pdf/:docId', (req, res) => {
  // In einer echten Umgebung: Stream aus FS
  // Hier für das MVP: Redirect auf Sample PDF
  res.redirect('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`RegiScan Backend running on port ${PORT}`));