(function(){
if(typeof supabase==='undefined')return;
const sb=supabase.createClient('https://ckthqsrgoebmhgaoosjt.supabase.co','sb_publishable_gYB-M_epE-BFWmA1JqkdtA_LssREoZL',{auth:{persistSession:true,autoRefreshToken:true}});
let verified=false;
const of=window.fetch.bind(window);
window.fetch=async(u,o)=>{
  if(typeof u==='string'&&u.startsWith('/api/svara')){
    const s=(await sb.auth.getSession()).data.session;
    o=o||{};o.headers=Object.assign({},o.headers,s?{authorization:'Bearer '+s.access_token}:{});
  }
  return of(u,o);
};
const bar=document.createElement('div');
bar.style.cssText='display:flex;gap:8px;align-items:center;font-size:14px;margin-left:12px';
const hdr=document.querySelector('header.top .wrap');
if(hdr)hdr.appendChild(bar);
function notice(msg){
  let n=document.getElementById('authnote');
  if(!n){n=document.createElement('div');n.id='authnote';n.setAttribute('role','status');
    n.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#222;color:#fff;padding:12px 18px;border-radius:6px;z-index:99;max-width:90vw';
    document.body.appendChild(n)}
  n.textContent=msg;n.hidden=false;clearTimeout(n._t);n._t=setTimeout(()=>n.hidden=true,6000);
}
function loginDialog(){
  const d=document.createElement('dialog');
  d.innerHTML='<form method="dialog" style="display:flex;flex-direction:column;gap:10px;min-width:260px"><b>Logga in</b><label for="lem">Din e-postadress. Du får en länk, inget lösenord.</label><input id="lem" type="email" required autocomplete="email"><div style="display:flex;gap:8px"><button value="ok">Skicka länk</button><button value="x" formnovalidate>Avbryt</button></div></form>';
  document.body.appendChild(d);d.showModal();
  d.querySelector('form').addEventListener('submit',async e=>{
    const v=d.returnValue;e.preventDefault();
    const btn=e.submitter&&e.submitter.value;
    if(btn==='x'){d.close();d.remove();return}
    const email=d.querySelector('#lem').value.trim();if(!email)return;
    const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin}});
    d.close();d.remove();
    notice(error?'Det gick inte att skicka länken: '+error.message:'Länk skickad. Öppna mejlet och klicka på den.');
  });
}
async function render(){
  const s=(await sb.auth.getSession()).data.session;
  verified=!!(s&&s.user&&!s.user.is_anonymous&&s.user.email);
  bar.innerHTML='';
  const b=document.createElement('button');b.className='iconbtn';b.type='button';
  if(verified){
    const t=document.createElement('span');t.textContent=s.user.email;bar.appendChild(t);
    b.textContent='Logga ut';
    b.onclick=async()=>{await sb.auth.signOut();location.reload()};
  }else{
    const t=document.createElement('span');t.textContent='Gäst (läsläge)';bar.appendChild(t);
    b.textContent='Logga in';b.onclick=loginDialog;
  }
  bar.appendChild(b);
}
document.addEventListener('submit',e=>{
  if(e.target.closest&&e.target.closest('dialog'))return;
  if(!verified){e.preventDefault();e.stopImmediatePropagation();notice('Logga in med e-post för att skriva. Som gäst kan du bara läsa.')}
},true);
sb.auth.onAuthStateChange((ev,s)=>{
  if(ev==='SIGNED_IN'&&s&&s.user&&!s.user.is_anonymous&&!verified)location.reload();
  else render();
});
render();
})();
