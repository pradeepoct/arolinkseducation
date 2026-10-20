import express from 'express';
import { traceRedirectChain } from './inspector.js';

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory key-value cache
const cache = new Map();

app.use(express.json());

app.get('/api/inspect', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter.' });
  }

  // 1. Check Cache
  if (cache.has(url)) {
    return res.json({
      cached: true,
      ...cache.get(url),
    });
  }

  // 2. Perform HTTP redirect trace
  try {
    const result = await traceRedirectChain(url);
    cache.set(url, result);

    return res.json({
      cached: false,
      ...result,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to inspect URL',
      details: err.message,
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[URL Inspector] Running on http://localhost:${PORT}`);
});
