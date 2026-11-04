/* Husbandet – sida om signatursoundet. Läggs till utan att röra resten av sidan. */
(function () {
  function viewHusbandet() {
    var all = (typeof TEAM !== 'undefined' && TEAM.people ? TEAM.people : []);
    function bandOf(p) { return p.band || (p.role === 'Husbandet' ? 'Husbandet' : ''); }
    function instr(p) { var r = p.role || ''; var i = r.indexOf(' · '); return i >= 0 ? r.slice(i + 3) : ''; }
    function row(p) {
      var sub = [instr(p), (p.character || '') + (p.element ? ' · ' + p.element : '')].filter(Boolean).join(' – ');
      return '<a class="row" href="#p-' + esc(p.id) + '" style="text-decoration:none;color:inherit;align-items:center;gap:12px">' + avatar(p, 'sm') +
        '<div style="min-width:0"><b>' + esc(p.name) + '</b><br><span class="hint">' + esc(sub) + '</span></div></a>';
    }
    var GROUPS = [
      ['Husbandet', 'Dub reggae i långsam puls. Signatursoundet som bär kvällarna på Vreta.'],
      ['Karavanen', 'Världsmusikerna som spelar med Husbandet i olika konstellationer. Karavanen är Husbandet tillsammans med dem.'],
      ['Ek & Lin', 'Akustisk gitarrduo. Allt akustiskt gitarrspel i teamets musik kommer härifrån.'],
      ['Leonid', 'Melodisk techno och trans. Teo mixar och spelar in åt alla banden.']
    ];
    var groups = GROUPS.map(function (g) {
      var ms = all.filter(function (p) { return bandOf(p) === g[0]; });
      if (!ms.length) return '';
      return '<div style="margin-top:18px"><h3 style="margin:0 0 2px">' + esc(g[0]) + ' <span class="hint">(' + ms.length + ')</span></h3>' +
        '<p class="hint" style="margin:0 0 10px">' + esc(g[1]) + '</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">' + ms.map(row).join('') + '</div></div>';
    }).join('');
    var facts = [
      ['Genre', 'Dub reggae med bandeko och rymd, så att sångens svansar glider mellan trumslagen'],
      ['Rösterna', 'En sparsam hindukvinnoröst och en djup, jamaicansk mansröst i varmt mellanregister'],
      ['Refrängen', 'Öppnar sig i kraftfullt fullröstsjung'],
      ['Tempo', 'Långsamt och odrivet, grund 62 BPM. Varje sång får eget tempo efter karaktärens temperament'],
      ['Rytm och bas', 'Tung, djup bas, rymdiga trummor och tabla'],
      ['Klang', 'Ekande sitar, didgeridoo-drone och harmoniumackord'],
      ['Form', 'Mantra och chant, ibland anrop och svar, med en rymdig dubbrygga'],
      ['Stämning', 'Långsam, med långa ekon']
    ].map(function (f) {
      return '<div style="padding:10px 0;border-top:1px solid rgba(128,128,128,.3)"><span class="label">' + esc(f[0]) + '</span><div style="font-size:18px">' + esc(f[1]) + '</div></div>';
    }).join('');
    return '<div class="teamhero" style="display:block"><div>' +
      '<span class="label">Husbandet</span>' +
      '<h1 style="font-size:56px">Husbandets sound</h1>' +
      '<p style="font-size:21px"><i>Alla i teamet älskar Husbandet. Det är deras sound som bär kvällarna på Vreta, i ladan, i ateljén och vid elden.</i></p>' +
      '</div></div>' +
      '<div class="panel" style="margin:24px 0"><span class="label">Signatursoundet</span>' +
      '<p style="font-size:22px;margin:8px 0 14px">Dub reggae i långsam puls, sjungen av en kvinna och en man. Sparsamma rader, djup bas och långa ekon som låter orden hänga kvar i rummet.</p>' +
      facts +
      '<p style="margin-top:16px;font-size:14px"><span class="ai">AI-skapad musik</span> Musik och röster är skapade med AI och märks så överallt på sidan.</p></div>' +
      '<div class="panel" style="margin:24px 0"><span class="label">Musikerna i Vreta Sound System</span>' + groups + '</div>' +
      '<div class="panel" style="margin:24px 0"><span class="label">Virelais sånger</span>' +
      '<p style="font-size:18px;margin:8px 0 0">Virelai skriver en mantrasång till var och en i teamet, i samma sound. Orden visar, och personen nämns aldrig vid namn. Sångerna publiceras här allteftersom de blir klara.</p></div>' +
      (typeof window.musikPlaylistPanel === 'function' ? window.musikPlaylistPanel() : '');
  }
  function fix() {
    if (location.hash !== '#husbandet') return;
    var app = document.getElementById('app');
    if (app) app.innerHTML = viewHusbandet();
    document.querySelectorAll('nav.main a').forEach(function (a) { a.removeAttribute('aria-current'); if (a.getAttribute('href') === '#husbandet') a.setAttribute('aria-current', 'page'); });
  }
  function addNav() {
    var nav = document.querySelector('nav.main');
    if (nav && !nav.querySelector('a[href="#husbandet"]')) {
      var a = document.createElement('a');
      a.href = '#husbandet';
      a.textContent = 'Husbandet';
      var after = nav.querySelector('a[href="#team"]');
      if (after && after.nextSibling) nav.insertBefore(a, after.nextSibling); else nav.appendChild(a);
    }
  }
  addNav();
  if (typeof render === 'function') {
    var orig = render;
    render = function () { orig(); fix(); };
  }
  window.addEventListener('hashchange', function () { setTimeout(fix, 0); });
  if (document.readyState !== 'loading') setTimeout(fix, 300);
  window.addEventListener('load', function () { setTimeout(fix, 300); setTimeout(fix, 1500); });
})();
