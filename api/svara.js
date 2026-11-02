const SB='https://ckthqsrgoebmhgaoosjt.supabase.co',PK='sb_publishable_gYB-M_epE-BFWmA1JqkdtA_LssREoZL';
const hits=new Map();
export default async function handler(req,res){
if(req.method!=='POST')return res.status(405).end();
const key=(process.env.ANTHROPIC_API_KEY||'').trim();
if(!key)return res.status(503).json({error:'svar_avstangda'});
const tok=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
if(!tok)return res.status(401).json({error:'logga_in'});
const ur=await fetch(SB+'/auth/v1/user',{headers:{apikey:PK,authorization:'Bearer '+tok}});
if(!ur.ok)return res.status(401).json({error:'logga_in'});
const u=await ur.json();
if(u.is_anonymous||!u.email||!u.email_confirmed_at)return res.status(403).json({error:'verifierat_konto_kravs'});
const since=new Date(Date.now()-864e5).toISOString();
const cr=await fetch(SB+'/rest/v1/docs?select=id&collection=eq.messages&owner=eq.'+u.id+'&created_at=gte.'+since,{headers:{apikey:PK,authorization:'Bearer '+tok}});
const rows=cr.ok?await cr.json():[];
if(rows.length>3)return res.status(429).json({error:'max_3_per_dygn'});
const now=Date.now();const arr=(hits.get(u.id)||[]).filter(t=>now-t<864e5);
if(arr.length>=8)return res.status(429).json({error:'rate_limited'});
arr.push(now);hits.set(u.id,arr);
const prompt=String(req.body?.prompt||'').slice(0,12000);
if(!prompt)return res.status(400).end();
const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-haiku-5-5',max_tokens:600,messages:[{role:'user',content:prompt}]})});
if(!r.ok){const e=await r.text();console.error('upstream',r.status,e.slice(0,300));return res.status(502).json({error:'upstream',status:r.status})}
const j=await r.json();const t=(j.content?.[0]?.text||'').trim();const m=t.match(/\{[\s\S]*\}/);
try{return res.status(200).json(JSON.parse(m?m[0]:t))}catch{return res.status(200).json({svar:t.slice(0,1500),foto:null})}
}
