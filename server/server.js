import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Config
const PORT = process.env.PORT || 8787;
const PI_API_BASE = process.env.PI_API_BASE || 'https://api.minepi.com/v2';
const PI_API_KEY = process.env.PI_API_KEY || '';
const APP_PUBLIC_ADDRESS = process.env.APP_PUBLIC_ADDRESS || '';
const NETWORK = process.env.NETWORK || 'testnet';

function requireEnv(name){ if(!process.env[name]) console.warn(`[EchoChain] Missing env ${name}`); }
['PI_API_BASE','PI_API_KEY','APP_PUBLIC_ADDRESS','NETWORK'].forEach(requireEnv);

function authHeaders(){
  // Depending on Pi docs, the header name may be 'Authorization: Key <apiKey>'
  return { Authorization: `Key ${PI_API_KEY}` };
}

// Utility: detect content type (mirrors frontend)
function detectContentType(item){
  if(item.contentTypeHint) return item.contentTypeHint;
  const data = (item.data||'').trim();
  const starts = data.slice(0, 200).toLowerCase();
  if(/^\s*\{[\s\S]*\}|^\s*\[[\s\S]*\]/.test(data)) return 'json';
  if(/<\s*html|<\s*body|<\s*div|<\s*p|<\s*h[1-6]/.test(starts)) return 'html';
  if(/^\s{0,3}(#{1,6}\s|[-*+]\s|```|>\s|\|)/m.test(starts)) return 'markdown';
  if(/pragma solidity|contract\s+|function\s+|class\s+|#include\s+|import\s+/.test(starts)) return 'code';
  if(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data.replace(/\n|\r/g,'')) && data.length>64) return 'binary';
  return 'text';
}

// Payments approval (server-side) — validate with Pi platform
app.post('/payments/approve', async (req, res) => {
  try {
    const { paymentId } = req.body;
    if(!paymentId) return res.status(400).json({ error: 'paymentId required' });

    // TODO: Verify payment details against your own business logic
    // Example: fetch payment by ID and check amount/memo
    // const r = await axios.get(`${PI_API_BASE}/payments/${paymentId}`, { headers: authHeaders() });
    // const payment = r.data;
    // if(payment.amount !== 0.0001) throw new Error('Invalid amount');

    return res.json({ ok: true });
  } catch (e) {
    console.error('approve error', e.response?.data || e.message);
    return res.status(500).json({ error: 'approval failed' });
  }
});

// Payments completion — mark as completed on server side
app.post('/payments/complete', async (req, res) => {
  try {
    const { paymentId, txid } = req.body;
    if(!paymentId || !txid) return res.status(400).json({ error: 'paymentId and txid required' });

    // Optionally verify transaction on-chain here.
    return res.json({ ok: true });
  } catch (e) {
    console.error('complete error', e.response?.data || e.message);
    return res.status(500).json({ error: 'completion failed' });
  }
});

// Search endpoint — query completed payments to app address on Testnet and build results from metadata
app.get('/api/search', async (req, res) => {
  try {
    const { q = '', type, from, to } = req.query;
    const tokens = (q || '').toLowerCase().split(/\s+/).filter(Boolean);

    // Fetch recent payments; in a real app, iterate pages until sufficient results
    // Placeholder: endpoint path/name depends on Pi docs; adjust per wiki
    const listUrl = `${PI_API_BASE}/payments?network=${NETWORK}&to_address=${encodeURIComponent(APP_PUBLIC_ADDRESS)}&limit=200`;
    const r = await axios.get(listUrl, { headers: authHeaders() });
    const payments = Array.isArray(r.data?.data) ? r.data.data : (r.data || []);

    const results = payments
      .filter(p => p?.status === 'completed' || p?.completed)
      .map(p => {
        const md = p?.metadata || {};
        return {
          id: p.identifier || p.id || p.paymentId,
          timestamp: p.created_at || p.completed_at || p.createdAt,
          address: p.to_address || p.to || APP_PUBLIC_ADDRESS,
          blockNumber: p.block || undefined,
          title: md.title || (p.memo || 'EchoChain item'),
          description: md.description || '',
          tags: md.tags || [],
          contentTypeHint: md.contentTypeHint,
          data: md.data || ''
        };
      })
      .filter(item => {
        // Date filter
        if(from){ const ft = new Date(from).getTime(); const it = new Date(item.timestamp).getTime(); if(isFinite(ft) && isFinite(it) && it < ft) return false; }
        if(to){ const tt = new Date(to).getTime(); const it = new Date(item.timestamp).getTime(); if(isFinite(tt) && isFinite(it) && it > tt + 24*60*60*1000 - 1) return false; }
        const typeDetected = detectContentType(item);
        if(type && type !== 'all' && typeDetected !== type) return false;
        if(tokens.length === 0) return true;
        const hay = `${item.title}\n${item.description}\n${item.data}\n${(item.tags||[]).join(' ')}`.toLowerCase();
        return tokens.every(t => hay.includes(t));
      })
      .map(item => ({ ...item, _type: detectContentType(item) }));

    return res.json({ results });
  } catch (e) {
    console.error('search error', e.response?.data || e.message);
    return res.status(500).json({ error: 'search failed' });
  }
});

app.listen(PORT, () => console.log(`[EchoChain] Server listening on :${PORT} (${NETWORK})`));
