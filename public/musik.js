/* Musik – en låt per person under presentationen, och en spellista på första sidan.
   Läser /data/musik.json: [{ "person": "eon", "titel": "...", "fil": "/audio/eon.mp3", "bpm": 62, "langd": "4:54" }]
   Finns inga låtar visas ingenting. All musik märks AI-skapad (B-051). Läggs till utan att röra resten av sidan. */
(function () {
  var TRACKS = [];
  var audio = new Audio();
  audio.preload = 'none';
  var cur = -1;

  function nameOf(id) {
    var p = (typeof P !== 'undefined' && P[id]) ? P[id] : null;
    return p ? p.name : id;
  }
  function trackFor(id) {
    for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].person === id) return TRACKS[i];
    return null;
  }
  function meta(t) {
    return [t.bpm ? t.bpm + ' BPM' : '', t.langd || ''].filter(Boolean).join(' · ');
  }

  /* Under personpresentationen */
  function personBlock(p) {
    var t = p && trackFor(p.id);
    if (!t) return '';
    return '<div class="panel" style="margin:20px 0" data-musikblock="' + esc(p.id) + '">' +
      '<span class="label">En sång till ' + esc(p.name.split(' ')[0]) + '</span>' +
      '<h3 style="margin:6px 0 2px">' + esc(t.titel) + '</h3>' +
      '<p class="hint" style="margin:0 0 8px">Husbandet · ' + esc(meta(t)) + ' <span class="ai">AI-skapad musik</span></p>' +
      '<audio controls preload="none" src="' + esc(t.fil) + '" style="width:100%" aria-label="' + esc(t.titel) + '"></audio>' +
      '</div>';
  }

  /* Spellistan på första sidan */
  function playing() { return cur >= 0 && !audio.paused; }
  function playlistPanel() {
    if (!TRACKS.length) return '';
    var rows = TRACKS.map(function (t, i) {
      var on = i === cur;
      return '<div class="row" style="align-items:center;gap:12px;padding:8px 0;border-top:1px solid rgba(128,128,128,.25)">' +
        '<button type="button" class="btn' + (on ? '' : ' ghost') + '" data-mtrack="' + i + '" aria-label="' + (on && playing() ? 'Pausa ' : 'Spela ') + esc(t.titel) + '" style="min-width:44px">' + (on && playing() ? '❚❚' : '▶') + '</button>' +
        '<div style="min-width:0;flex:1"><b>' + esc(t.titel) + '</b><br><span class="hint">' +
        '<a href="#p-' + esc(t.person) + '">' + esc(nameOf(t.person)) + '</a> · ' + esc(meta(t)) + '</span></div></div>';
    }).join('');
    return '<div class="panel" style="margin-bottom:18px" id="musiklista">' +
      '<span class="label">Husbandets spellista</span>' +
      '<p class="hint" style="margin:4px 0 8px">En sång till varje person, skapad av Husbandet. <span class="ai">AI-skapad musik</span></p>' +
      '<div class="row" style="gap:8px;margin-bottom:6px">' +
      '<button type="button" class="btn" data-mall="play">Spela alla</button>' +
      '<button type="button" class="btn ghost" data-mall="prev" aria-label="Föregående">⏮</button>' +
      '<button type="button" class="btn ghost" data-mall="next" aria-label="Nästa">⏭</button>' +
      '</div>' + rows + '</div>';
  }
  function refreshList() {
    var el = document.getElementById('musiklista');
    if (el) el.outerHTML = playlistPanel();
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
  if (typeof viewFeed === 'function') {
    var origFeed = viewFeed;
    viewFeed = function (filterPlace) { return playlistPanel() + origFeed(filterPlace); };
  }

  fetch('/data/musik.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (j) {
      TRACKS = Array.isArray(j) ? j.filter(function (t) { return t && t.person && t.fil && t.titel; }) : [];
      if (TRACKS.length && typeof render === 'function') render();
    })
    .catch(function () {});
})();
