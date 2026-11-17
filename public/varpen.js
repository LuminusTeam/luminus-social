/* Varpen – kanban 2.0 och statistik per medlem på luminusloom.net (R21, B-118).
   Läser samlingarna kanban, lardomar och milstolpar ur databasen och räknar statistik ur posts, comments, photo_requests
   och kalendrar som sidan redan har. Visualiseringar 2.0: SVG utan bibliotek, elementfärgerna ur Luminushjulet,
   text som bär betydelsen. Läggs till utan att röra resten av sidan. Alla personer är AI-skapade (B-051). */
(function () {
  var KB = [], LARD = [], MIL = [];
  var TEAMS = ['Etern', 'Källan', 'Myceliet', 'Blomman', 'Lunden', 'Barken', 'Pollen'];
  var COLS = [['backlog', 'Backlog'], ['planerad', 'Planerad'], ['pagar', 'Pågår'], ['blockerad', 'Blockerad'], ['klar', 'Klar']];
  var TEAM_ID = { Etern: 'etern', 'Källan': 'kallan', Myceliet: 'myceliet', Blomman: 'blomman', Lunden: 'lunden', Barken: 'barken', Pollen: 'pollen' };
  var DAY = 864e5;

  /* ---------- stil ---------- */
  var st = document.createElement('style');
  st.textContent = [
    '@keyframes vp-pulse{0%{box-shadow:0 0 0 0 rgba(154,120,50,.55)}70%{box-shadow:0 0 0 10px rgba(154,120,50,0)}100%{box-shadow:0 0 0 0 rgba(154,120,50,0)}}',
    '@keyframes vp-weave{from{stroke-dashoffset:40}to{stroke-dashoffset:0}}',
    '.vp-cols{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;align-items:start}',
    '@media (max-width:1000px){.vp-cols{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.vp-col{background:var(--bg-alt);padding:10px;min-height:120px;border-top:3px solid var(--rule)}',
    '.vp-col[data-col=pagar]{border-top-color:var(--gold)}.vp-col[data-col=klar]{border-top-color:var(--vatten)}.vp-col[data-col=blockerad]{border-top-color:var(--eld)}.vp-col[data-col=planerad]{border-top-color:var(--luft)}',
    '.vp-card{background:var(--paper);border:1px solid var(--rule);padding:12px;margin-bottom:10px;position:relative;cursor:pointer}',
    '.vp-card.pagar{border-color:var(--gold);animation:vp-pulse 2.4s ease-out infinite}',
    '.vp-card.pagar::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--gold),var(--lantern-gold),var(--gold));background-size:100% 200%;animation:vp-shimmer 3s linear infinite}',
    '@keyframes vp-shimmer{from{background-position:0 0}to{background-position:0 200%}}',
    '.vp-card h4{margin:4px 0 6px;font-size:16px;line-height:1.3}',
    '.vp-prio{display:inline-block;min-width:22px;text-align:center;font-family:var(--f-label);font-size:12px;border:1px solid var(--gold);color:var(--gold-text);border-radius:999px;padding:1px 6px}',
    '.vp-team{font-family:var(--f-label);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}',
    '.vp-meta{font-family:var(--f-label);font-size:12px;color:var(--ink-soft);display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}',
    '.vp-detail{display:none;margin-top:10px;font-size:14px;border-top:1px solid var(--rule);padding-top:8px}.vp-card.open .vp-detail{display:block}',
    '.vp-levels{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0 18px}',
    '.vp-levels select{font-family:var(--f-label);font-size:14px;padding:6px 10px;background:var(--paper);color:var(--ink);border:1px solid var(--rule)}',
    '.vp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}',
    '@media (max-width:900px){.vp-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.vp-stat{background:var(--paper);border:1px solid var(--rule);padding:14px 16px;border-top:3px solid var(--rule)}',
    '.vp-stat b{display:block;font-size:34px;line-height:1;font-weight:600;margin:4px 0 2px}',
    '.vp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}',
    '.vp-person{background:var(--paper);border:1px solid var(--rule);padding:14px;text-decoration:none;color:inherit;display:block}',
    '.vp-person:hover{border-color:var(--gold)}',
    '.vp-nums{display:flex;gap:14px;font-family:var(--f-label);font-size:12px;color:var(--ink-soft);margin-top:8px}.vp-nums b{display:block;font-size:20px;color:var(--ink);font-weight:600}',
    '.vp-period{display:flex;gap:6px;flex-wrap:wrap}.vp-period button{font-family:var(--f-label);font-size:13px;padding:6px 12px;border:1px solid var(--rule);background:transparent;color:var(--ink);cursor:pointer;border-radius:999px}.vp-period button[aria-pressed=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}',
    '.vp-ms{border-left:2px solid var(--gold);padding-left:14px;margin:0 0 12px;position:relative}.vp-ms::before{content:"";position:absolute;left:-7px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--gold)}',
    '.vp-lard{background:var(--bg-alt);padding:10px 14px;margin-bottom:8px;border-top:1px solid var(--rule)}'
  ].join('\n');
  document.head.appendChild(st);

  /* ---------- hjälp ---------- */
  function name(id) { return (typeof P !== 'undefined' && P[id]) ? P[id].name : id; }
  function teamOf(p) { return p && p.teams && p.teams[0] || ''; }
  function teamPeople(t) { return (typeof TEAM !== 'undefined' ? TEAM.people : []).filter(function (p) { return !p.special && p.id !== 'mattias-seger' && (p.teams || []).indexOf(t) >= 0; }); }
  function allPeople() { return (typeof TEAM !== 'undefined' ? TEAM.people : []).filter(function (p) { return !p.special && p.id !== 'mattias-seger'; }); }
  function fmtDate(s) { var d = new Date(s); return isNaN(d) ? '' : d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }); }
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function elementVar(p) { var m = { Luft: 'luft', Eld: 'eld', Jord: 'jord', Vatten: 'vatten' }; return m[p && p.element] || 'etern'; }

  /* ---------- statistik ---------- */
  var PERIODS = [['igar', 'I går'], ['vecka', '7 dagar'], ['manad', '30 dagar'], ['totalt', 'Totalt']];
  function range(key) {
    var now = new Date(), t0 = startOfDay(now).getTime();
    if (key === 'igar') return [t0 - DAY, t0];
    if (key === 'vecka') return [t0 - 6 * DAY, Infinity];
    if (key === 'manad') return [t0 - 29 * DAY, Infinity];
    return [-Infinity, Infinity];
  }
  function inR(t, r) { var x = Date.parse(t); return x >= r[0] && x < r[1]; }
  function statsFor(id, key) {
    var r = range(key);
    var posts = (state.posts || []).filter(function (x) { return x.author === id && x.status !== 'planerad' && inR(x.planerad_tid || x.tid, r); });
    var bilder = posts.filter(function (x) { return x.bildbestallning; }).length;
    var comments = (state.comments || []).filter(function (x) { return x.author === id && inR(x.tid, r); }).length;
    var reakGiven = 0, reakGot = 0, komGot = 0;
    (state.posts || []).forEach(function (x) {
      if (x.status === 'planerad' || !inR(x.planerad_tid || x.tid, r)) return;
      var rk = x.reaktioner || {};
      Object.keys(rk).forEach(function (k) { var l = rk[k] || []; if (l.indexOf(id) >= 0 && x.author !== id) reakGiven++; if (x.author === id) reakGot += l.length; });
    });
    (state.comments || []).forEach(function (c) { if (!inR(c.tid, r)) return; var p = (state.posts || []).find(function (x) { return x._id === c.post; }); if (p && p.author === id && c.author !== id) komGot++; });
    var cal = (typeof calEvents === 'function' ? calEvents(id) : []).filter(function (e) { return e.typ === 'jobb' && inR(e.start, r) && /möte|samtal|coaching|mentorskap|reflektion|meditation|träningspass|fika|gåva|kunskapsdelning|arbetshjälp|feedback/i.test(e.titel || ''); }).length;
    var kort = KB.filter(function (k) { return (k.personer || []).indexOf(id) >= 0; });
    var klara = kort.filter(function (k) { return k.status === 'klar' && (key === 'totalt' || inR(k.klar || k.skapad, r)); }).length;
    var pagar = kort.filter(function (k) { return k.status === 'pagar'; }).length;
    return { inlagg: posts.length, bilder: bilder, kommentarer: comments, reakGiven: reakGiven, reakGot: reakGot, komGot: komGot, moten: cal, klara: klara, pagar: pagar,
      poang: posts.length * 3 + bilder * 2 + comments * 2 + reakGiven + klara * 8 + cal };
  }
  function daily(id, days) {
    var t0 = startOfDay(new Date()).getTime() - (days - 1) * DAY, arr = [];
    for (var i = 0; i < days; i++) arr.push(0);
    (state.posts || []).forEach(function (x) { if (x.author !== id || x.status === 'planerad') return; var d = Math.floor((Date.parse(x.planerad_tid || x.tid) - t0) / DAY); if (d >= 0 && d < days) arr[d] += 3; });
    (state.comments || []).forEach(function (x) { if (x.author !== id) return; var d = Math.floor((Date.parse(x.tid) - t0) / DAY); if (d >= 0 && d < days) arr[d] += 2; });
    return arr;
  }
  /* Väven: en tråd per dag, tjocklek efter aktivitet, i personens elementfärg */
  function weave(arr, el, w, h) {
    w = w || 220; h = h || 44; var n = arr.length, max = Math.max.apply(null, arr.concat([1])), step = w / n, s = '';
    for (var i = 0; i < n; i++) {
      var v = arr[i] / max, x = i * step + step / 2, sw = 1 + v * (step - 2);
      s += '<line x1="' + x.toFixed(1) + '" y1="' + (h - 2) + '" x2="' + x.toFixed(1) + '" y2="' + (h - 2 - v * (h - 6)).toFixed(1) + '" stroke="var(--' + el + ')" stroke-width="' + sw.toFixed(1) + '" stroke-linecap="round" opacity="' + (0.35 + v * 0.65).toFixed(2) + '"/>';
    }
    s += '<line x1="0" y1="' + (h - 1) + '" x2="' + w + '" y2="' + (h - 1) + '" stroke="var(--gold)" stroke-width="1" stroke-dasharray="4 4" style="animation:vp-weave 2s linear infinite"/>';
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Aktivitet per dag de senaste ' + n + ' dagarna">' + s + '</svg>';
  }
  /* Hjulet: fyra bågar för inlägg (Eld), bilder (Luft), kommentarer (Vatten) och reaktioner (Jord) */
  function wheel(s, size) {
    size = size || 160; var c = size / 2, r = size / 2 - 10, parts = [['inlagg', 'eld', 'Inlägg'], ['bilder', 'luft', 'Bilder'], ['kommentarer', 'vatten', 'Kommentarer'], ['reakGiven', 'jord', 'Reaktioner']];
    var tot = parts.reduce(function (a, p) { return a + s[p[0]]; }, 0) || 1, a0 = -Math.PI / 2, out = '';
    parts.forEach(function (p) {
      var v = s[p[0]] / tot, a1 = a0 + v * 2 * Math.PI;
      if (v > 0) { var x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0), x1 = c + r * Math.cos(a1 - 0.02), y1 = c + r * Math.sin(a1 - 0.02);
        out += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + (v > 0.5 ? 1 : 0) + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" fill="none" stroke="var(--' + p[1] + ')" stroke-width="14" stroke-linecap="butt"/>'; }
      a0 = a1;
    });
    out += '<circle cx="' + c + '" cy="' + c + '" r="' + (r - 16) + '" fill="none" stroke="var(--gold)" stroke-width="1"/>';
    out += '<text x="' + c + '" y="' + (c + 10) + '" text-anchor="middle" font-size="30" font-weight="600" fill="var(--ink)" font-family="Inter,system-ui,sans-serif">' + s.poang + '</text>';
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Fördelning: ' + parts.map(function (p) { return p[2] + ' ' + s[p[0]]; }).join(', ') + '. Poäng ' + s.poang + '">' + out + '</svg>';
  }
  function statCards(s) {
    var items = [['Inlägg', s.inlagg, 'eld', s.bilder + ' med bild'], ['Kommentarer', s.kommentarer, 'vatten', s.komGot + ' mottagna'], ['Reaktioner', s.reakGiven, 'jord', s.reakGot + ' mottagna'], ['Möten', s.moten, 'luft', 'enligt kalendern'], ['Kort klara', s.klara, 'vatten', s.pagar + ' pågår'], ['Poäng', s.poang, 'etern', 'vävd aktivitet']];
    return '<div class="vp-stats">' + items.map(function (i) { return '<div class="vp-stat" style="border-top-color:var(--' + i[2] + ')"><span class="label">' + i[0] + '</span><b>' + i[1] + '</b><span class="hint">' + esc(i[3]) + '</span></div>'; }).join('') + '</div>';
  }
  function periodBar(cur, attr) {
    return '<div class="vp-period" role="group" aria-label="Period">' + PERIODS.map(function (p) { return '<button type="button" data-' + attr + '="' + p[0] + '" aria-pressed="' + (p[0] === cur) + '">' + p[1] + '</button>'; }).join('') + '</div>';
  }
  var periodKey = 'vecka';

  function personStats(p, full) {
    var s = statsFor(p.id, periodKey), el = elementVar(p);
    var ms = MIL.filter(function (m) { return m.person === p.id; }).sort(function (a, b) { return b.datum < a.datum ? -1 : 1; });
    var first = (state.posts || []).filter(function (x) { return x.author === p.id && x.status !== 'planerad'; }).map(function (x) { return x.planerad_tid || x.tid; }).sort()[0];
    if (first) ms.push({ datum: first.slice(0, 10), titel: 'Första inlägget', text: 'Första inlägget i flödet.', typ: 'person' });
    if (p.photo) ms.push({ datum: '2026-11-04', titel: 'Porträttet klart', text: 'AI-skapat porträtt i porträttregistret (R11).', typ: 'person' });
    ms.sort(function (a, b) { return b.datum < a.datum ? -1 : b.datum > a.datum ? 1 : 0; });
    var lard = LARD.filter(function (l) { return l.person === p.id || (l.niva === 'team' && l.team === teamOf(p)); }).sort(function (a, b) { return b.datum < a.datum ? -1 : 1; });
    var kort = KB.filter(function (k) { return (k.personer || []).indexOf(p.id) >= 0 && k.status !== 'klar'; }).sort(function (a, b) { return (a.prioritet || 99) - (b.prioritet || 99); });
    var head = '<div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' + wheel(s, 150) +
      '<div style="flex:1;min-width:220px"><span class="label">Senaste 30 dagarna</span><div style="margin:6px 0">' + weave(daily(p.id, 30), el, 320, 56) + '</div>' + periodBar(periodKey, 'period') + '</div></div>';
    var html = head + statCards(s);
    if (full) {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:24px">' +
        '<div><span class="label">Kort på min tavla</span>' + (kort.length ? kort.map(function (k) { return '<p style="margin:8px 0"><span class="vp-prio">' + (k.prioritet || '–') + '</span> <a href="#kanban-p-' + esc(p.id) + '">' + esc(k.titel) + '</a><br><span class="hint">' + esc(k.team) + ' · ' + esc(colName(k.status)) + '</span></p>'; }).join('') : '<p class="hint">Inga öppna kort.</p>') + '</div>' +
        '<div><span class="label">Milstolpar</span><div style="margin-top:10px">' + (ms.length ? ms.map(function (m) { return '<div class="vp-ms"><b>' + esc(m.titel) + '</b> <span class="hint">' + esc(fmtDate(m.datum)) + '</span><br><span style="font-size:14px">' + esc(m.text || '') + '</span></div>'; }).join('') : '<p class="hint">Inga milstolpar ännu.</p>') + '</div></div>' +
        '<div><span class="label">Lärdomar</span><div style="margin-top:10px">' + (lard.length ? lard.map(function (l) { return '<div class="vp-lard"><b style="font-size:14px">' + esc(l.titel || '') + '</b><br><span style="font-size:14px">' + esc(l.text) + '</span><br><span class="hint">' + esc(fmtDate(l.datum)) + (l.niva === 'team' ? ' · teamets' : '') + '</span></div>'; }).join('') : '<p class="hint">Lärdomarna fylls på efter reflektionsrundorna (R21).</p>') + '</div></div></div>';
    }
    return html;
  }
  function colName(s) { var c = COLS.find(function (x) { return x[0] === s; }); return c ? c[1] : s; }

  function viewStatistik() {
    var people = allPeople(), rows = people.map(function (p) { return { p: p, s: statsFor(p.id, periodKey) }; });
    var byTeam = {};
    rows.forEach(function (r) { var t = teamOf(r.p) || 'Övriga'; (byTeam[t] = byTeam[t] || []).push(r); });
    var tot = rows.reduce(function (a, r) { a.inlagg += r.s.inlagg; a.kommentarer += r.s.kommentarer; a.reakGiven += r.s.reakGiven; a.bilder += r.s.bilder; a.klara += r.s.klara; a.moten += r.s.moten; a.pagar += r.s.pagar; a.poang += r.s.poang; a.reakGot += r.s.reakGot; a.komGot += r.s.komGot; return a; }, { inlagg: 0, kommentarer: 0, reakGiven: 0, bilder: 0, klara: 0, moten: 0, pagar: 0, poang: 0, reakGot: 0, komGot: 0 });
    var teamBands = TEAMS.map(function (t) { var rs = byTeam[t] || []; var pts = rs.reduce(function (a, r) { return a + r.s.poang; }, 0); return { t: t, pts: pts, n: rs.length }; });
    var maxPts = Math.max.apply(null, teamBands.map(function (b) { return b.pts; }).concat([1]));
    var bands = '<div class="panel" style="margin:18px 0"><span class="label">Teamens väv · ' + esc(PERIODS.find(function (x) { return x[0] === periodKey; })[1]) + '</span>' +
      '<svg width="100%" viewBox="0 0 900 ' + (TEAMS.length * 34 + 10) + '" role="img" aria-label="Poäng per team: ' + teamBands.map(function (b) { return b.t + ' ' + b.pts; }).join(', ') + '">' +
      teamBands.map(function (b, i) { var y = i * 34 + 8, w = Math.max(4, 640 * b.pts / maxPts); return '<text x="0" y="' + (y + 17) + '" font-size="14" font-family="Inter,system-ui,sans-serif" fill="var(--ink)">' + esc(b.t) + '</text><rect x="110" y="' + y + '" width="' + w.toFixed(0) + '" height="22" fill="var(--' + ['etern', 'luft', 'vatten', 'eld', 'jord', 'etern', 'luft'][i] + '"/><text x="' + (118 + w).toFixed(0) + '" y="' + (y + 17) + '" font-size="14" font-family="Inter,system-ui,sans-serif" fill="var(--ink-soft)">' + b.pts + ' p · ' + b.n + ' personer</text>'; }).join('') + '</svg></div>';
    var grid = TEAMS.filter(function (t) { return byTeam[t]; }).map(function (t) {
      var rs = byTeam[t].sort(function (a, b) { return b.s.poang - a.s.poang; });
      return '<h2 style="margin:28px 0 10px"><a href="#team-' + TEAM_ID[t] + '" style="text-decoration:none;color:inherit">' + esc(t) + '</a></h2><div class="vp-grid">' + rs.map(function (r) {
        return '<a class="vp-person" href="#stat-' + esc(r.p.id) + '"><div style="display:flex;gap:12px;align-items:center">' + avatar(r.p, 'sm') + '<div style="min-width:0"><b>' + esc(r.p.name) + '</b><br><span class="hint">' + esc(r.p.role || '') + '</span></div></div>' +
          '<div style="margin:10px 0 2px">' + weave(daily(r.p.id, 14), elementVar(r.p), 220, 36) + '</div>' +
          '<div class="vp-nums"><span><b>' + r.s.inlagg + '</b>inlägg</span><span><b>' + r.s.kommentarer + '</b>komm.</span><span><b>' + r.s.reakGiven + '</b>reakt.</span><span><b>' + r.s.poang + '</b>poäng</span></div></a>';
      }).join('') + '</div>';
    }).join('');
    return '<div class="teamhero" style="display:block"><span class="label">Statistik</span><h1 style="font-size:48px;margin:6px 0 10px">Vad var och en har gjort</h1>' +
      '<p style="font-size:19px;max-width:760px"><i>Aktiviteter och resultat per person: inlägg, bilder, kommentarer, reaktioner, möten och kort på tavlan. Poängen väver ihop allt: inlägg 3, bild 2, kommentar 2, reaktion 1, möte 1, klart kort 8.</i></p>' +
      periodBar(periodKey, 'period') + '</div>' + '<div style="margin-top:18px">' + statCards(tot) + '</div>' + bands + grid +
      '<p class="hint" style="margin-top:24px"><span class="ai">AI-skapat</span> Alla personer är AI-skapade; siffrorna räknas ur flödet, kalendrarna och tavlan.</p>';
  }
  function viewStat(id) {
    var p = P[id]; if (!p) return '<div class="empty">Personen finns inte.</div>';
    return '<div class="teamhero" style="display:block"><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">' + avatar(p, 'sm') + '<div><span class="label"><a href="#statistik" class="chip">Statistik</a> · ' + esc(teamOf(p)) + '</span><h1 style="font-size:44px;margin:4px 0"><a href="#p-' + esc(p.id) + '" style="text-decoration:none;color:inherit">' + esc(p.name) + '</a></h1><span class="hint">' + esc(p.role || '') + '</span></div></div></div>' +
      '<div class="panel" style="margin-top:18px">' + personStats(p, true) + '</div>';
  }

  /* ---------- kanban 2.0 ---------- */
  var level = { kind: 'varpen', id: '' };
  function cardsFor() {
    if (level.kind === 'team') return KB.filter(function (k) { return k.team === level.id || (k.personer || []).some(function (id) { return teamOf(P[id]) === level.id; }); });
    if (level.kind === 'person') return KB.filter(function (k) { return (k.personer || []).indexOf(level.id) >= 0; });
    return KB.slice();
  }
  function card(k) {
    var faces = (k.personer || []).slice(0, 6).map(function (id) { return '<a href="#p-' + esc(id) + '" title="' + esc(name(id)) + '">' + avatar(P[id], 'xs') + '</a>'; }).join('');
    var dep = (k.beroenden || []).length;
    return '<div class="vp-card ' + esc(k.status) + '" data-kort="' + esc(k.id) + '" role="button" tabindex="0" aria-expanded="false">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="vp-team">' + esc(k.team || '') + ' · ' + esc(k.id) + '</span><span class="vp-prio" title="Prioritet">' + (k.prioritet || '–') + '</span></div>' +
      '<h4>' + esc(k.titel) + '</h4>' +
      '<div class="faces">' + faces + '</div>' +
      '<div class="vp-meta"><span>' + esc(k.kapacitet || '') + '</span><span>Värde ' + (k.varde || '–') + '/5</span><span>Komplexitet ' + (k.komplexitet || '–') + '/5</span>' + (dep ? '<span>' + dep + ' beroende' + (dep > 1 ? 'n' : '') + '</span>' : '') + (k.dator ? '<span>Dator</span>' : '') + (k.status === 'pagar' && k.pagar_sedan ? '<span>Pågår sedan ' + esc(fmtDate(k.pagar_sedan)) + '</span>' : '') + '</div>' +
      '<div class="vp-detail"><p style="margin:0 0 6px">' + esc(k.syfte || '') + '</p><p class="hint" style="margin:0 0 4px">Ansvarig: ' + esc(k.ansvarig || '') + '</p>' +
      (k.beroenden && k.beroenden.length ? '<p class="hint" style="margin:0 0 4px">Beroenden: ' + esc(k.beroenden.join('; ')) + '</p>' : '') +
      (k.verktyg && k.verktyg.length ? '<p class="hint" style="margin:0 0 4px">Verktyg: ' + esc(k.verktyg.join(', ')) + '</p>' : '') +
      (k.uppskattning ? '<p class="hint" style="margin:0 0 4px">Uppskattning: ' + esc([k.uppskattning.tid, k.uppskattning.token, k.uppskattning.kostnad].filter(Boolean).join(' · ')) + '</p>' : '') +
      (k.logg && k.logg.length ? '<p class="hint" style="margin:0">Senast: ' + esc(k.logg[k.logg.length - 1].andring) + ' (' + esc(k.logg[k.logg.length - 1].av) + ')</p>' : '') + '</div></div>';
  }
  function viewKanban() {
    var cards = cardsFor().sort(function (a, b) { return (a.prioritet || 99) - (b.prioritet || 99); });
    var counts = {}; COLS.forEach(function (c) { counts[c[0]] = cards.filter(function (k) { return k.status === c[0]; }).length; });
    var title = level.kind === 'team' ? 'Team ' + level.id : level.kind === 'person' ? name(level.id) : 'Varpens tavla';
    var people = allPeople();
    var lev = '<div class="vp-levels"><label class="label" for="vp-lvl">Nivå</label><select id="vp-lvl"><option value="varpen"' + (level.kind === 'varpen' ? ' selected' : '') + '>Varpen – alla kort</option>' +
      '<optgroup label="Team">' + TEAMS.map(function (t) { return '<option value="team:' + t + '"' + (level.kind === 'team' && level.id === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</optgroup>' +
      '<optgroup label="Person">' + people.map(function (p) { return '<option value="person:' + p.id + '"' + (level.kind === 'person' && level.id === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</optgroup></select>' +
      '<span class="hint">' + cards.length + ' kort · ' + counts.pagar + ' pågår</span></div>';
    var cols = '<div class="vp-cols">' + COLS.map(function (c) { var cs = cards.filter(function (k) { return k.status === c[0]; }); return '<div class="vp-col" data-col="' + c[0] + '"><span class="label">' + c[1] + ' · ' + cs.length + '</span><div style="margin-top:8px">' + (cs.length ? cs.map(card).join('') : '<p class="hint">Tomt.</p>') + '</div></div>'; }).join('') + '</div>';
    return '<div class="teamhero" style="display:block"><span class="label">Kanban · R21</span><h1 style="font-size:48px;margin:6px 0 10px">' + esc(title) + '</h1>' +
      '<p style="font-size:19px;max-width:760px"><i>Plan och genomförande hålls isär. Samma kort syns på Varpens tavla, teamets tavla och personens tavla. Kort som pågår lyser. Varpen uppdaterar tavlan vid avstämningarna kl 07, 11, 14 och 17.</i></p>' + lev + '</div>' + cols +
      '<p class="hint" style="margin-top:18px">Prioritet 1 är högst. Klicka på ett kort för syfte, beroenden, verktyg och uppskattning.</p>';
  }

  /* ---------- koppling till sidan ---------- */
  function addNav() {
    var nav = document.querySelector('nav.main'); if (!nav) return;
    [['#kanban', 'Tavlan'], ['#statistik', 'Statistik']].forEach(function (x) {
      if (nav.querySelector('a[href="' + x[0] + '"]')) return;
      var a = document.createElement('a'); a.href = x[0]; a.textContent = x[1]; nav.appendChild(a);
    });
  }
  function fix() {
    var h = location.hash || '', app = document.getElementById('app'); if (!app) return;
    var html = null;
    if (h === '#kanban') { level = { kind: 'varpen', id: '' }; html = viewKanban(); }
    else if (h.indexOf('#kanban-t-') === 0) { level = { kind: 'team', id: decodeURIComponent(h.slice(10)) }; html = viewKanban(); }
    else if (h.indexOf('#kanban-p-') === 0) { level = { kind: 'person', id: h.slice(10) }; html = viewKanban(); }
    else if (h === '#statistik') html = viewStatistik();
    else if (h.indexOf('#stat-') === 0) html = viewStat(h.slice(6));
    if (html === null) return;
    app.innerHTML = html;
    document.querySelectorAll('nav.main a').forEach(function (a) { a.setAttribute('aria-current', (h.indexOf('#kanban') === 0 && a.getAttribute('href') === '#kanban') || (h.indexOf('#stat') === 0 && a.getAttribute('href') === '#statistik') ? 'page' : 'false'); });
  }
  if (typeof profileTab === 'function') {
    var origTab = profileTab;
    profileTab = function (p, tab) {
      var html = origTab(p, tab);
      if (tab !== 'profil' || !p || p.special) return html;
      return html + '<div class="panel" style="margin:20px 0"><span class="label">Statistik, milstolpar och lärdomar</span><div style="margin-top:10px">' + personStats(p, false) + '</div><p style="margin:12px 0 0"><a href="#stat-' + esc(p.id) + '">Hela statistiken för ' + esc(p.name.split(' ')[0]) + '</a> · <a href="#kanban-p-' + esc(p.id) + '">Min tavla</a></p></div>';
    };
  }
  if (typeof render === 'function') { var orig = render; render = function () { orig(); fix(); }; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-period]');
    if (b) { periodKey = b.getAttribute('data-period'); if (typeof render === 'function') render(); return; }
    var c = e.target.closest && e.target.closest('.vp-card');
    if (c && !(e.target.closest('a'))) { c.classList.toggle('open'); c.setAttribute('aria-expanded', c.classList.contains('open')); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('vp-card')) e.target.click(); });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'vp-lvl') return; var v = e.target.value;
    location.hash = v === 'varpen' ? '#kanban' : v.indexOf('team:') === 0 ? '#kanban-t-' + encodeURIComponent(v.slice(5)) : '#kanban-p-' + v.slice(7);
  });
  addNav();
  window.addEventListener('hashchange', function () { setTimeout(fix, 0); });
  window.addEventListener('load', function () { setTimeout(fix, 300); });
  function sub(col, set) {
    try { state.db.collection(col).onSnapshot(function (s) { set(s.docs.map(function (d) { var x = d.data(); x._id = d.id; return x; })); fix(); }, function () {}); } catch (e) {}
  }
  function waitDb(n) { if (typeof state !== 'undefined' && state.db) { sub('kanban', function (a) { KB = a; }); sub('lardomar', function (a) { LARD = a; }); sub('milstolpar', function (a) { MIL = a; }); } else if (n < 60) setTimeout(function () { waitDb(n + 1); }, 500); }
  waitDb(0);
})();
