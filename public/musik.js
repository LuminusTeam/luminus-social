/* Musik – en låt per person under presentationen, och en spellista på första sidan.
   Läser /data/musik.json: [{ "person": "eon", "titel": "...", "fil": "/audio/eon.mp3", "bpm": 62, "langd": "4:54",
   "version": "Remix", "utgivning": "2026-11-10T12:00:00+01:00", "bild": "/img/husbandet-eon.jpg" }]
   Teamet och musikerna väljer vilken version som går ut först; Akustisk, Teknotrance och techno sparas till senare
   utgivningsdatum. En låt visas först när utgivning (ISO-datum, valfritt) har passerat. Finns inga låtar visas ingenting. All musik märks AI-skapad (B-051). Läggs till utan att röra resten av sidan. */
(function () {
  var TRACKS = [];
  var audio = new Audio();
  audio.preload = 'none';
  var cur = -1;

  function nameOf(id) {
    var p = (typeof P !== 'undefined' && P[id]) ? P[id] : null;
    return p ? p.name : id;
  }
  function tracksFor(id) {
    return TRACKS.filter(function (t) { return t.person === id; });
  }
  function meta(t) {
    return [t.bpm ? t.bpm + ' BPM' : '', t.langd || ''].filter(Boolean).join(' · ');
  }

  /* Emojireaktioner på låtar. Sparas i samma samling (reactions) som inläggsreaktionerna, med target "track:<fil>",
     och hanteras av sidans egen klicklyssnare via data-react/data-typ (toggleReact). */
  var EMOJIS = [
    ['e-hjarta', '❤️', 'Älskar'],
    ['e-eld', '🔥', 'Het'],
    ['e-musik', '🎶', 'Låten sitter'],
    ['e-leende', '😊', 'Glad'],
    ['e-hander', '🙌', 'Bravo']
  ];
  function emojiBar(t) {
    var key = 'track:' + t.fil;
    var rs = (typeof state !== 'undefined' && state.reactions) ? state.reactions : [];
    var me = (typeof state !== 'undefined') ? state.uid : null;
    return '<div class="reacts" role="group" aria-label="Reagera på ' + esc(t.titel) + '" style="gap:4px;margin-top:6px">' +
      EMOJIS.map(function (e) {
        var n = 0, mine = false;
        rs.forEach(function (r) { if (r.target === key && r.typ === e[0]) { n++; if (me && r.vem === me) mine = true; } });
        return '<button type="button" class="react small" data-react="' + esc(key) + '" data-typ="' + e[0] + '" aria-pressed="' + (mine ? 'true' : 'false') +
          '" aria-label="' + esc(e[2]) + ': ' + n + '" title="' + esc(e[2]) + '" style="padding:2px 8px;gap:4px"><span aria-hidden="true">' + e[1] +
          '</span><span class="n' + (n ? '' : ' z') + '">' + n + '</span></button>';
      }).join('') + '</div>';
  }

  /* Under personpresentationen */
  function personBlock(p) {
    var list = p ? tracksFor(p.id) : [];
    if (!list.length) return '';
    return '<div class="panel" style="margin:20px 0" data-musikblock="' + esc(p.id) + '">' +
      '<span class="label">' + (list.length > 1 ? 'Sånger' : 'En sång') + ' till ' + esc(p.name.split(' ')[0]) + '</span>' +
      list.map(function (t) {
        return (t.bild ? '<img src="' + esc(t.bild) + '" alt="AI-skapat foto av Husbandet vid släppet av ' + esc(t.titel) + '" loading="lazy" style="width:100%;max-height:320px;object-fit:cover;margin-top:10px">' : '') +
          '<h3 style="margin:10px 0 2px">' + esc(t.titel) + (t.version && t.version !== 'Remix' ? ' <span class="hint">' + esc(t.version) + '</span>' : '') + '</h3>' +
          '<p class="hint" style="margin:0 0 8px">Husbandet · ' + esc(meta(t)) + ' <span class="ai">AI-skapad musik</span></p>' +
          '<audio controls preload="none" src="' + esc(t.fil) + '" style="width:100%" aria-label="' + esc(t.titel) + '"></audio>' + emojiBar(t);
      }).join('') + '</div>';
  }

  /* Spellistan på första sidan */
  function playing() { return cur >= 0 && !audio.paused; }
  var FEED_MAX = 5;
  function playlistPanel(compact) {
    if (!TRACKS.length) return '';
    var shown = TRACKS.map(function (t, i) { return i; });
    if (compact && TRACKS.length > FEED_MAX) {
      var start = cur >= FEED_MAX ? cur - FEED_MAX + 1 : 0;
      shown = shown.slice(start, start + FEED_MAX);
    }
    var rows = shown.map(function (i) { var t = TRACKS[i];
      var on = i === cur;
      return '<div class="row" style="align-items:center;gap:12px;padding:8px 0;border-top:1px solid rgba(128,128,128,.25)">' +
        '<button type="button" class="btn' + (on ? '' : ' ghost') + '" data-mtrack="' + i + '" aria-label="' + (on && playing() ? 'Pausa ' : 'Spela ') + esc(t.titel) + '" style="min-width:44px">' + (on && playing() ? '❚❚' : '▶') + '</button>' +
        (t.bild ? '<img src="' + esc(t.bild) + '" alt="" loading="lazy" style="width:56px;height:56px;object-fit:cover">' : '') + '<div style="min-width:0;flex:1"><b>' + esc(t.titel) + '</b><br><span class="hint">' +
        '<a href="#p-' + esc(t.person) + '">' + esc(nameOf(t.person)) + '</a> · ' + esc(meta(t)) + (t.version && t.version !== 'Remix' ? ' · ' + esc(t.version) : '') + '</span>' + emojiBar(t) + '</div></div>';
    }).join('');
    var more = (compact && TRACKS.length > shown.length) ? '<p style="margin:10px 0 0"><a href="#husbandet">Visa alla ' + TRACKS.length + ' s\u00e5nger</a></p>' : '';
    return '<div class="panel" style="margin-bottom:' + (compact ? 0 : 18) + 'px" id="musiklista" data-compact="' + (compact ? 1 : 0) + '">' +
      (compact ? '<h3>Husbandets spellista</h3>' : '<span class="label">Husbandets spellista</span>') +
      '<p class="hint" style="margin:4px 0 8px">En sång till varje person, skapad av Husbandet. <span class="ai">AI-skapad musik</span></p>' +
      '<div class="row" style="gap:8px;margin-bottom:6px">' +
      '<button type="button" class="btn" data-mall="play">Spela alla</button>' +
      '<button type="button" class="btn ghost" data-mall="prev" aria-label="Föregående">⏮</button>' +
      '<button type="button" class="btn ghost" data-mall="next" aria-label="Nästa">⏭</button>' +
      '</div>' + rows + more + '</div>';
  }
  window.musikPlaylistPanel = playlistPanel;
  function refreshList() {
    var el = document.getElementById('musiklista');
    if (el) el.outerHTML = playlistPanel(el.getAttribute('data-compact') === '1');
  }

  function play(i) {
    if (i < 0 || i >= TRACKS.length) return;
    if (i === cur && audio.src) {
      if (audio.paused) audio.play(); else audio.pause();
      return;
    }
    cur = i;
    audio.src = TRACKS[i].fil;
    audio.play().catch(function () {});
    refreshList();
  }
  audio.addEventListener('play', refreshList);
  audio.addEventListener('pause', refreshList);
  audio.addEventListener('ended', function () {
    if (cur + 1 < TRACKS.length) play(cur + 1); else { cur = -1; refreshList(); }
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-mtrack]');
    if (b) { play(parseInt(b.getAttribute('data-mtrack'), 10)); return; }
    var m = e.target.closest && e.target.closest('[data-mall]');
    if (!m) return;
    var k = m.getAttribute('data-mall');
    if (k === 'play') play(cur >= 0 ? cur : 0);
    else if (k === 'next') play(cur < 0 ? 0 : (cur + 1) % TRACKS.length);
    else if (k === 'prev') play(cur <= 0 ? TRACKS.length - 1 : cur - 1);
  });

  /* Koppla in i sidans egna funktioner */
  if (typeof profileTab === 'function') {
    var origTab = profileTab;
    profileTab = function (p, tab) {
      var html = origTab(p, tab);
      if (['profil', 'hylla', 'kalender', 'inlagg', 'skriv'].indexOf(tab) >= 0) return html;
      return html + personBlock(p);
    };
  }
  /* I flödet: överst i högerkolumnen. Kolumnen blir högre än skärmen, så den får följa med sidan
     i stället för att stå fast (annars går panelerna längst ned inte att nå). */
  var st = document.createElement('style');
  st.textContent = '.side:has(#musiklista){position:static}';
  document.head.appendChild(st);
  if (typeof sidebar === 'function') {
    var origSide = sidebar;
    sidebar = function () {
      return origSide().replace('<aside class="side">', '<aside class="side">' + playlistPanel(true));
    };
  }

  fetch('/data/musik.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (j) {
      var nu = Date.now();
      TRACKS = Array.isArray(j) ? j.filter(function (t) {
        return t && t.person && t.fil && t.titel && (!t.utgivning || Date.parse(t.utgivning) <= nu);
      }) : [];
      if (TRACKS.length && typeof render === 'function') render();
      if (TRACKS.length && location.hash === '#husbandet') window.dispatchEvent(new HashChangeEvent('hashchange'));
    })
    .catch(function () {});
})();
