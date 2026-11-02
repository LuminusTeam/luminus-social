// Svar från personerna när någon skriver till dem. Kräver miljövariabeln ANTHROPIC_API_KEY i Vercel.
const hits = new Map();
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'svar_avstangda' });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'x';
  const now = Date.now(); const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= 6) return res.status(429).json({ error: 'rate_limited' });
  arr.push(now); hits.set(ip, arr);
  const prompt = String(req.body?.prompt || '').slice(0, 12000);
  if (!prompt) return res.status(400).end();
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
  });
  if (!r.ok) return res.status(502).json({ error: 'upstream' });
  const j = await r.json(); const t = (j.content?.[0]?.text || '').trim();
  const m = t.match(/\{[\s\S]*\}/);
  try { return res.status(200).json(JSON.parse(m ? m[0] : t)); } catch { return res.status(200).json({ svar: t.slice(0, 1500), foto: null }); }
}
