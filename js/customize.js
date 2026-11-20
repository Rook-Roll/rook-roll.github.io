/* Rook & Roll — board & piece customization (presets, live preview) and applying the user's look. */
(function () {
  'use strict';
  const A = () => window.App;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const BOARDS = {
    walnut: { name: 'Walnut', light: '#ecdcc0', dark: '#a97c56' },
    sage: { name: 'Sage', light: '#e7ead6', dark: '#7d9a6d' },
    ocean: { name: 'Ocean', light: '#dbe5ee', dark: '#6f8fae' },
    backstage: { name: 'Backstage', light: '#d9d2e6', dark: '#6a5690' },
    candy: { name: 'Candy', light: '#ffe3ec', dark: '#e98aa9' },
    lava: { name: 'Lava', light: '#ffd9a8', dark: '#d9573f' },
    marble: { name: 'Marble', light: '#f1f0ec', dark: '#9ea2a8' },
    midnight: { name: 'Midnight', light: '#4a4558', dark: '#26222f' },
  };
  const PIECE_COLORS = {
    classic: { name: 'Classic', w: '#fbfaf6', ws: '#2a2a2a', b: '#23211f', bs: '#23211f' },
    gold: { name: 'Gold & Ruby', w: '#ffd23f', ws: '#3a2a00', b: '#ff4d5e', bs: '#3b0710' },
    ice: { name: 'Ice & Navy', w: '#eaf7ff', ws: '#21406b', b: '#1d2b53', bs: '#0b1020' },
    mint: { name: 'Mint & Grape', w: '#bdfbe7', ws: '#0f4d40', b: '#6a35a0', bs: '#1f0b33' },
    neon: { name: 'Neon', w: '#5ef2ff', ws: '#0b3a40', b: '#ff5ce1', bs: '#40072f' },
  };
  const STYLES = {
    classic: 'Classic', sticker: 'Sticker', neon: 'Glow', flat: 'Flat', letters: 'Letters',
  };
  const DEFAULTS = {
    board: 'walnut', boardCustom: { light: '#f3e4c8', dark: '#8f6a4c' },
    pieces: 'classic', pieceColors: 'classic', pieceCustom: { w: '#fbfaf6', ws: '#2a2a2a', b: '#23211f', bs: '#23211f' },
    pieceScale: 100, coords: true, dots: true, lastMove: true, animate: true,
  };

  function boardColors(p) { return p.board === 'custom' ? p.boardCustom : BOARDS[p.board] || BOARDS.walnut; }
  function pieceColors(p) { return p.pieceColors === 'custom' ? p.pieceCustom : PIECE_COLORS[p.pieceColors] || PIECE_COLORS.classic; }

  function apply(p) {
    for (const [k, v] of Object.entries(DEFAULTS)) if (p[k] === undefined) p[k] = JSON.parse(JSON.stringify(v));
    const root = document.documentElement.style;
    const b = boardColors(p), c = pieceColors(p);
    root.setProperty('--sq-light', b.light);
    root.setProperty('--sq-dark', b.dark);
    root.setProperty('--pw', c.w); root.setProperty('--pws', c.ws);
    root.setProperty('--pb', c.b); root.setProperty('--pbs', c.bs);
    root.setProperty('--pscale', (p.pieceScale || 100) / 100);
    document.body.dataset.pieces = p.pieces;
    document.body.classList.toggle('no-dots', !p.dots);
    document.body.classList.toggle('no-last', !p.lastMove);
    Board.pieceSet = p.pieces === 'letters' ? 'letters' : 'glyph';
    Board.defaults.coords = p.coords;
    Board.defaults.animate = p.animate;
  }

  function view(view) {
    const { prefs, savePrefs, toast } = A();
    apply(prefs);
    view.innerHTML = `
      <div class="page-head"><h1>Customize</h1><p>Make the board yours — colours, piece style, size and how Rocco talks to you. Changes save automatically and apply everywhere.</p></div>
      <div class="custom">
        <div class="preview"><div class="board-frame" style="width:100%"><div class="bd"></div></div>
          <div class="row spread" style="margin-top:12px"><span class="muted">Try moving pieces on the preview.</span><button class="btn small" id="resetPrev">↺ Reset board</button></div></div>
        <div class="panel opts"></div>
      </div>`;
    let chess = new Chess();
    const board = new Board($('.bd', view), {
      movable: () => true,
      onMove: (mv) => { const m = chess.move(mv); if (m) { board.setPosition(chess, m); A().moveSound(m, chess); } },
    });
    board.setPosition(chess, null, { animate: false });
    $('#resetPrev', view).onclick = () => { chess = new Chess(); board.setPosition(chess, null, { animate: false }); };
    const opts = $('.opts', view);

    function draw() {
      const bc = prefs.boardCustom, pc = prefs.pieceCustom;
      opts.innerHTML = `
        <div class="opt-group"><h3>Board</h3>
          <div class="swatches">${Object.entries(BOARDS).map(([k, v]) => `<button class="swatch ${prefs.board === k ? 'active' : ''}" data-board="${k}" style="--l:${v.light};--d:${v.dark}"><span class="chk"><i></i><i></i><i></i><i></i></span>${v.name}</button>`).join('')}
            <button class="swatch ${prefs.board === 'custom' ? 'active' : ''}" data-board="custom" style="--l:${bc.light};--d:${bc.dark}"><span class="chk"><i></i><i></i><i></i><i></i></span>Custom</button></div>
          ${prefs.board === 'custom' ? `<div class="color-row"><label>Light <input type="color" data-bc="light" value="${bc.light}"></label><label>Dark <input type="color" data-bc="dark" value="${bc.dark}"></label></div>` : ''}
        </div>
        <div class="opt-group"><h3>Piece style</h3>
          <div class="swatches">${Object.entries(STYLES).map(([k, v]) => `<button class="swatch ${prefs.pieces === k ? 'active' : ''}" data-style="${k}"><span class="pcs" data-preview-style="${k}"></span>${v}</button>`).join('')}</div>
        </div>
        <div class="opt-group"><h3>Piece colours</h3>
          <div class="swatches">${Object.entries(PIECE_COLORS).map(([k, v]) => `<button class="swatch ${prefs.pieceColors === k ? 'active' : ''}" data-pc="${k}"><span class="pcs" style="--pw:${v.w};--pws:${v.ws};--pb:${v.b};--pbs:${v.bs}"><span class="pv" style="color:var(--pw);-webkit-text-stroke:.06em var(--pws)">♚︎</span><span class="pv" style="color:var(--pb);-webkit-text-stroke:.05em var(--pbs)">♚︎</span></span>${v.name}</button>`).join('')}
            <button class="swatch ${prefs.pieceColors === 'custom' ? 'active' : ''}" data-pc="custom"><span class="pcs" style="--pw:${pc.w};--pws:${pc.ws};--pb:${pc.b};--pbs:${pc.bs}"><span class="pv" style="color:var(--pw);-webkit-text-stroke:.06em var(--pws)">♚︎</span><span class="pv" style="color:var(--pb);-webkit-text-stroke:.05em var(--pbs)">♚︎</span></span>Custom</button></div>
          ${prefs.pieceColors === 'custom' ? `<div class="color-row"><label>White <input type="color" data-pcc="w" value="${pc.w}"></label><label>outline <input type="color" data-pcc="ws" value="${pc.ws}"></label></div>
            <div class="color-row"><label>Black <input type="color" data-pcc="b" value="${pc.b}"></label><label>outline <input type="color" data-pcc="bs" value="${pc.bs}"></label></div>` : ''}
        </div>
        <div class="opt-group"><h3>Piece size</h3>
          <div class="row spread"><span class="muted">Smaller</span><b id="scaleV">${prefs.pieceScale}%</b><span class="muted">Bigger</span></div>
          <input type="range" min="75" max="115" step="5" value="${prefs.pieceScale}" id="scale" aria-label="Piece size">
        </div>
        <div class="opt-group"><h3>Display</h3>
          <label class="toggle"><input type="checkbox" data-t="coords" ${prefs.coords ? 'checked' : ''}> Show coordinates (a–h, 1–8)</label>
          <label class="toggle"><input type="checkbox" data-t="dots" ${prefs.dots ? 'checked' : ''}> Show legal-move dots</label>
          <label class="toggle"><input type="checkbox" data-t="lastMove" ${prefs.lastMove ? 'checked' : ''}> Highlight the last move</label>
          <label class="toggle"><input type="checkbox" data-t="animate" ${prefs.animate ? 'checked' : ''}> Animate moves</label>
          <label class="toggle"><input type="checkbox" data-t="sound" ${prefs.sound ? 'checked' : ''}> Sound effects</label>
        </div>
        <div class="opt-group"><h3>Rocco, your coach</h3>
          <label class="toggle"><input type="checkbox" data-t="voice" ${prefs.voice ? 'checked' : ''}> Rocco speaks out loud</label>
          <div class="field"><label for="voiceSel">Voice</label><select id="voiceSel" class="input"><option value="">Automatic</option></select><div class="muted voice-now" style="font-size:13px"></div></div>
          <details class="rules voice-tip"><summary>Want Rocco to sound more human?</summary><p style="margin:8px 0 0">Rocco uses the voices built into your device, and some sound far more natural than others. Pick one marked <b>★ Natural</b>. If you don't see any:</p><ul style="margin:6px 0 0;padding-left:20px"><li><b>Mac:</b> System Settings → Accessibility → Spoken Content → System voice → Manage Voices… → download an English voice marked <b>Enhanced</b> or <b>Premium</b> (e.g. Evan, Ava, Zoe), then reload this page.</li><li><b>iPhone / iPad:</b> Settings → Accessibility → Spoken Content → Voices → English → download an <b>Enhanced</b> or <b>Premium</b> voice.</li><li><b>Windows:</b> open the site in <b>Microsoft Edge</b> — it has very natural "Online (Natural)" voices built in.</li><li><b>Chrome:</b> the <b>Google US English</b> / <b>Google UK English</b> voices sound good (they need internet).</li></ul></details>
          <div class="field"><label>How chatty is Rocco?</label><div class="seg" id="chatty">${[['quiet', '🤫 Quiet'], ['normal', '🙂 Normal'], ['chatty', '🎤 Chatty']].map(([v, l]) => `<button data-v="${v}" class="${prefs.chatty === v ? 'active' : ''}">${l}</button>`).join('')}</div></div>
          <div class="row"><button class="btn small" id="testVoice">🔊 Test voice</button><button class="btn small ghost" id="resetAll">Reset look to defaults</button></div>
        </div>`;
      // style previews render with that style regardless of the current one
      $$('[data-preview-style]', opts).forEach((el) => {
        const st = el.dataset.previewStyle;
        if (st === 'letters') el.innerHTML = '<span class="pv" style="font-family:var(--display);font-size:13px;width:28px;height:28px;color:var(--pws);background:radial-gradient(circle,var(--pw) 0 60%,var(--pws) 61% 68%,transparent 69%);-webkit-text-stroke:0;text-shadow:none">N</span><span class="pv" style="font-family:var(--display);font-size:13px;width:28px;height:28px;color:var(--pw);background:radial-gradient(circle,var(--pb) 0 60%,var(--pbs) 61% 68%,transparent 69%);-webkit-text-stroke:0;text-shadow:none">Q</span>';
        else {
          const look = {
            classic: ['-webkit-text-stroke:.06em var(--pws);text-shadow:0 .04em .05em rgba(0,0,0,.45)', '-webkit-text-stroke:.03em var(--pbs)'],
            sticker: ['-webkit-text-stroke:.1em var(--pws);text-shadow:.05em .06em 0 rgba(0,0,0,.55)', '-webkit-text-stroke:.1em var(--pbs);text-shadow:.05em .06em 0 rgba(0,0,0,.55)'],
            neon: ['-webkit-text-stroke:0;text-shadow:0 0 .05em #fff,0 0 .16em var(--pw),0 0 .36em var(--pw)', '-webkit-text-stroke:0;text-shadow:0 0 .05em #fff,0 0 .16em var(--pb),0 0 .36em var(--pb)'],
            flat: ['-webkit-text-stroke:0;text-shadow:none', '-webkit-text-stroke:0;text-shadow:none'],
          }[st];
          el.innerHTML = `<span class="pv" style="color:var(--pw);${look[0]}">♞︎</span><span class="pv" style="color:var(--pb);${look[1]}">♛︎</span>`;
        }
      });
      bind();
      fillVoices();
    }
    function commit(rerenderOpts = true) {
      savePrefs();
      apply(prefs);
      board.render();
      if (rerenderOpts) draw();
    }
    function bind() {
      $$('[data-board]', opts).forEach((b) => (b.onclick = () => { prefs.board = b.dataset.board; commit(); }));
      $$('[data-style]', opts).forEach((b) => (b.onclick = () => { prefs.pieces = b.dataset.style; commit(); }));
      $$('[data-pc]', opts).forEach((b) => (b.onclick = () => { prefs.pieceColors = b.dataset.pc; commit(); }));
      $$('[data-bc]', opts).forEach((i) => (i.oninput = () => { prefs.boardCustom[i.dataset.bc] = i.value; commit(false); i.closest('.opt-group').querySelector('[data-board="custom"]').style.setProperty('--' + (i.dataset.bc === 'light' ? 'l' : 'd'), i.value); }));
      $$('[data-pcc]', opts).forEach((i) => (i.oninput = () => { prefs.pieceCustom[i.dataset.pcc] = i.value; commit(false); }));
      const sc = $('#scale', opts);
      sc.oninput = () => { prefs.pieceScale = +sc.value; $('#scaleV', opts).textContent = sc.value + '%'; commit(false); };
      $$('[data-t]', opts).forEach((i) => (i.onchange = () => {
        prefs[i.dataset.t] = i.checked; commit(false);
        if (i.dataset.t === 'voice') { Coach.refreshVoiceButton(); if (i.checked) Coach.speak('Voice on. Let\'s rock!', true); }
        if (i.dataset.t === 'sound') A().applyPrefs();
      }));
      $$('#chatty button', opts).forEach((b) => (b.onclick = () => { prefs.chatty = b.dataset.v; commit(); }));
      $('#voiceSel', opts).onchange = (e) => { prefs.voiceName = e.target.value; savePrefs(); fillVoices(); Coach.speak('Yo! This is my new voice. How do I sound?', true); };
      $('#testVoice', opts).onclick = () => Coach.speak('Yo! I\'m Rocco, your coach. Nice move, Qxf7 — that\'s checkmate! Ready for another round?', true);
      $('#resetAll', opts).onclick = () => { Object.assign(prefs, JSON.parse(JSON.stringify(DEFAULTS))); commit(); toast('Look reset to defaults'); };
    }
    function fillVoices() {
      const sel = $('#voiceSel', opts);
      if (!sel || !('speechSynthesis' in window)) { if (sel) { sel.disabled = true; $('.voice-now', opts).textContent = 'This browser cannot speak.'; } return; }
      const all = Coach.voices();
      const vs = all.filter((v) => Coach.voiceQuality(v) !== 'novelty');
      const label = (v) => `${Coach.voiceQuality(v) === 'natural' ? '★ Natural — ' : ''}${v.name} (${v.lang})`;
      sel.innerHTML = '<option value="">Automatic (best available)</option>' + vs.map((v) => `<option value="${v.name.replace(/"/g, '&quot;')}" ${prefs.voiceName === v.name ? 'selected' : ''}>${label(v)}</option>`).join('');
      const cur = Coach.currentVoice();
      const now = $('.voice-now', opts);
      if (cur) now.innerHTML = `Rocco is using: <b>${cur.name}</b>${Coach.voiceQuality(cur) === 'natural' ? ' ★ natural' : ' — standard quality, see the tip below for a better one'}`;
      if (!all.length) speechSynthesis.addEventListener('voiceschanged', () => { const s2 = $('#voiceSel', opts); if (s2 && s2.options.length <= 1) fillVoices(); }, { once: true });
    }
    draw();
  }

  window.Customize = { apply, view, DEFAULTS, BOARDS, PIECE_COLORS };
})();
