/* Rook & Roll arcade: Secret Queen, Pawn Wars, Coordinate Rush, Knight Sprint. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const O = () => window.App;
  const other = (c) => (c === 'w' ? 'b' : 'w');
  const colorName = (c) => (c === 'w' ? 'White' : 'Black');
  const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';

  const GAMES = [
    { id: 'puzzle-rush', icon: '⚡', title: 'Puzzle Rush', who: 'Solo · 3 minutes', desc: 'Solve as many puzzles as you can in 3 minutes. They get harder — and 3 mistakes ends the run!' },
    { id: 'secret-queen', icon: '👑', title: 'Secret Queen', who: '2 players · one device', desc: 'Each player secretly picks a pawn that is really a queen in disguise. Reveal it at the perfect moment!' },
    { id: 'pawn-wars', icon: '♟', title: 'Pawn Wars', who: 'With a friend or vs the coach', desc: 'Only pawns on the board. First to reach the far side wins. Great for learning pawn play.' },
    { id: 'coord-rush', icon: '🎯', title: 'Coordinate Rush', who: 'Solo · 30 seconds', desc: 'A square is named — click it as fast as you can. No coordinates on the board to help you!' },
    { id: 'knight-sprint', icon: '🐴', title: 'Knight Sprint', who: 'Solo · 5 rounds', desc: 'Guide the knight to the target square in as few jumps as possible.' },
  ];

  function best(key) { return O().Store.get('best.' + key, null); }
  function setBest(key, v) { O().Store.set('best.' + key, v); }

  function layout(view, panelHtml, aboveBoard = '') {
    view.innerHTML = `<div class="trainer game"><div class="board-col">${aboveBoard}<div class="board-frame"><div class="bd"></div></div></div><div class="panel">${panelHtml}</div></div>`;
    return new Board($('.bd', view));
  }
  const crumbs = (t) => `<div class="crumbs"><a href="#games">Arcade</a> / ${t}</div>`;

  /* ---------------- List ---------------- */
  function list(view) {
    const { esc } = O();
    const bestText = {
      'puzzle-rush': () => { const p = O().progress.stats; return p && p.rushBest ? `Best: ${p.rushBest} solved` : ''; },
      'coord-rush': () => (best('coord') != null ? `Best: ${best('coord')} squares` : ''),
      'knight-sprint': () => (best('knight') != null ? `Best: ${best('knight')} extra jumps` : ''),
    };
    view.innerHTML = `<div class="section-title" style="margin-top:0"><div><h1>The Arcade</h1><div class="muted">Quick, loud, fun ways to sharpen your chess — solo or with a friend.</div></div></div>
      <div class="games-grid">${GAMES.map((g) => `
        <div class="card game-card" data-id="${g.id}">
          <div class="ico">${g.icon}</div>
          <div><h3>${esc(g.title)}</h3><div class="pill">${esc(g.who)}</div><p>${esc(g.desc)}</p>${bestText[g.id] && bestText[g.id]() ? `<span class="pill gold">🏅 ${bestText[g.id]()}</span>` : ''}</div>
        </div>`).join('')}</div>`;
    $$('.game-card', view).forEach((el) => (el.onclick = () => (location.hash = el.dataset.id === 'puzzle-rush' ? '#rush' : '#game-' + el.dataset.id)));
  }

  function open(view, id) {
    if (id === 'secret-queen') return secretQueen(view);
    if (id === 'pawn-wars') return pawnWars(view);
    if (id === 'coord-rush') return coordRush(view);
    if (id === 'knight-sprint') return knightSprint(view);
    location.hash = '#games';
  }

  /* ---------------- Secret Queen ---------------- */
  function secretQueen(view) {
    const { Sound, moveSound, toast, modal, confetti, esc } = O();
    const board = layout(view, `${crumbs('Secret Queen')}<div class="sq-panel" style="display:contents"></div>`);
    const panel = $('.sq-panel', view);
    let chess, st;
    const timers = [];

    function newGame() {
      chess = new Chess();
      st = { phase: 'pick', picker: 'w', pick: null, secret: { w: null, b: null }, revealed: { w: false, b: false }, lost: { w: false, b: false }, revealMode: false, stack: [], sans: [], last: null, result: null, flip: false };
      startPick('w');
    }

    /* --- picking phase --- */
    function startPick(color) {
      st.phase = 'pick';
      st.picker = color;
      st.pick = null;
      board.orientation = color;
      board.movable = () => false;
      board.movesFor = null;
      board.onMove = null;
      board.onSquare = (name) => {
        if (chess.get(name) === (color === 'w' ? 'P' : 'p')) {
          st.pick = name;
          board.annotate({ marks: [name] });
          Sound.move();
          render();
        }
      };
      board.setPosition(chess, null, { animate: false });
      render();
    }
    function confirmPick() {
      if (!st.pick) return;
      const color = st.picker;
      st.secret[color] = st.pick;
      board.onSquare = null;
      board.annotate({ marks: [] });
      if (color === 'w') {
        st.phase = 'handover';
        render();
        modal({ icon: '🤫', title: 'Pass the device to Black', body: 'White\'s secret is locked in. Black: tap below when White isn\'t looking.', buttons: [{ label: 'I\'m Black — ready', cls: 'primary', onClick: () => startPick('b') }] });
      } else {
        st.phase = 'handover';
        render();
        modal({ icon: '♟', title: 'Both secrets chosen!', body: 'Pass the device back to White. Let the game begin!', buttons: [{ label: 'Start game ▶', cls: 'primary', onClick: startPlay }] });
      }
    }

    /* --- play phase --- */
    function startPlay() {
      st.phase = 'play';
      board.onSquare = null;
      board.movable = () => st.phase === 'play' && !st.result;
      board.movesFor = movesFor;
      board.onMove = doMove;
      board.orientation = orient();
      board.setPosition(chess, st.last, { animate: false });
      render();
    }
    function orient() { return st.flip ? other(chess.turn) : chess.turn; }
    function queenChess() {
      const tmp = new Chess(chess.fen());
      tmp.board[Chess.sqIndex(st.secret[chess.turn])] = chess.turn === 'w' ? 'Q' : 'q';
      return tmp;
    }
    function movesFor(name) {
      const mine = st.secret[chess.turn];
      if (st.revealMode && mine && name === mine) return queenChess().moves({ square: name }).filter((m) => m.captured !== 'k');
      return chess.moves({ square: name });
    }
    function doMove(mv) {
      const mover = chess.turn, opp = other(mover);
      const snapshot = { fen: chess.fen(), secret: { ...st.secret }, revealed: { ...st.revealed }, lost: { ...st.lost }, last: st.last, n: st.sans.length };
      let m, revealedNow = false;
      if (st.revealMode && mv.from === st.secret[mover]) {
        const tmp = queenChess();
        m = tmp.move(mv);
        if (!m) return;
        chess = new Chess(tmp.fen());
        st.secret[mover] = null;
        st.revealed[mover] = true;
        revealedNow = true;
      } else {
        m = chess.move(mv);
        if (!m) return;
        if (mv.from === st.secret[mover]) st.secret[mover] = m.promotion ? null : m.to;
      }
      st.stack.push(snapshot);
      st.revealMode = false;
      let capturedSecret = false;
      const os = st.secret[opp];
      if (os && m.captured) {
        const capSq = m.flags === 'e' ? m.to[0] + m.from[1] : m.to;
        if (capSq === os) { st.secret[opp] = null; st.lost[opp] = true; capturedSecret = true; }
      }
      st.sans.push((revealedNow ? '👑' : '') + m.san);
      st.last = m;
      board.setPosition(chess, m);
      if (revealedNow) { Sound.good(); toast(`👑 ${colorName(mover)} reveals the secret queen!`, 2600); }
      else if (capturedSecret) { Sound.end(); toast(`💥 That pawn was ${colorName(opp)}'s secret queen!`, 2800); }
      else moveSound(m, chess);
      checkEnd();
      render();
      if (!st.result) timers.push(setTimeout(() => { if (st.phase === 'play') { board.setOrientation(orient()); } }, 450));
    }
    function checkEnd() {
      let r = null;
      if (chess.isCheckmate()) r = { winner: other(chess.turn), reason: 'checkmate' };
      else if (chess.isStalemate()) r = { winner: null, reason: 'stalemate' };
      else if (chess.isInsufficientMaterial()) r = { winner: null, reason: 'insufficient material' };
      else if (chess.isFiftyMove()) r = { winner: null, reason: '50-move rule' };
      if (r) endGame(r);
    }
    function endGame(r) {
      st.result = r;
      st.phase = 'over';
      const left = ['w', 'b'].filter((c) => st.secret[c]);
      board.annotate({ marks: left.map((c) => st.secret[c]) });
      Sound.end();
      if (r.winner) confetti();
      const secretsTxt = left.length ? left.map((c) => `${colorName(c)}'s secret pawn was on <b>${st.secret[c]}</b>.`).join(' ') : '';
      timers.push(setTimeout(() => modal({
        icon: r.winner ? '🏆' : '🤝', title: r.winner ? `${colorName(r.winner)} wins!` : 'Draw',
        body: `By ${r.reason}. ${secretsTxt}`,
        buttons: [{ label: 'Look at the board' }, { label: 'Play again', cls: 'primary', onClick: newGame }],
      }), 500));
    }
    function undo() {
      const s = st.stack.pop();
      if (!s) return;
      chess = new Chess(s.fen);
      Object.assign(st, { secret: s.secret, revealed: s.revealed, lost: s.lost, last: s.last, result: null, phase: 'play', revealMode: false });
      st.sans.length = s.n;
      board.orientation = orient();
      board.setPosition(chess, st.last, { animate: false });
      render();
    }
    function toggleReveal() {
      const sq = st.secret[chess.turn];
      if (!sq || st.phase !== 'play') return;
      st.revealMode = !st.revealMode;
      if (st.revealMode) { board.selected = Chess.sqIndex(sq); board.annotate({ marks: [sq] }); }
      else { board.selected = null; board.annotate({ marks: [] }); }
      render();
    }

    function secretState(c) {
      if (st.revealed[c]) return '<span class="pill gold">👑 revealed</span>';
      if (st.lost[c]) return '<span class="pill" style="color:var(--bad)">💥 captured</span>';
      if (st.secret[c]) return '<span class="pill">🤫 hidden</span>';
      return '<span class="pill">— used up</span>';
    }

    function render() {
      if (st.phase === 'pick' || st.phase === 'handover') {
        const c = st.picker;
        panel.innerHTML = `
          <h2 style="margin:0">👑 Secret Queen</h2>
          <div class="coach">${Coach.avatar('smirk')}<div class="bubble"><span class="who">Rocco</span><b>${colorName(c)}, choose your secret pawn.</b><br>${colorName(other(c))} — look away! Tap one of your pawns. It moves like a normal pawn until you reveal it — then it instantly becomes a queen.</div></div>
          <div class="feedback ${st.pick ? 'good' : 'info'}">${st.pick ? `Secret pawn: <b>${st.pick}</b> — confirm to lock it in.` : 'Tap one of your pawns on the board.'}</div>
          <div class="row end"><button class="btn primary" id="confirm" ${st.pick && st.phase === 'pick' ? '' : 'disabled'}>Lock in secret 🔒</button></div>
          ${rulesHtml()}`;
        $('#confirm', panel).onclick = confirmPick;
        return;
      }
      const turn = chess.turn;
      const status = st.result
        ? (st.result.winner ? `🏆 ${colorName(st.result.winner)} wins · ${st.result.reason}` : `🤝 Draw · ${st.result.reason}`)
        : `${turn === 'w' ? '⚪' : '⚫'} ${colorName(turn)} to move${chess.inCheck() ? ' · <span style="color:var(--bad)">Check!</span>' : ''}`;
      const canReveal = !st.result && !!st.secret[turn];
      let movesTxt = '';
      st.sans.forEach((s, i) => { movesTxt += (i % 2 === 0 ? `<span class="muted">${i / 2 + 1}.</span> ` : '') + esc(s) + ' '; });
      panel.innerHTML = `
        <div class="row spread" style="align-items:center"><h2 style="margin:0">👑 Secret Queen</h2><span class="pill gold">2 players</span></div>
        <div class="status">${status}</div>
        <div class="secret-status"><div>⚪ White ${secretState('w')}</div><div>⚫ Black ${secretState('b')}</div></div>
        ${st.revealMode ? `<div class="feedback info">👑 Reveal mode: make any <b>queen move</b> with your secret pawn on <b>${st.secret[turn]}</b>.</div>` : ''}
        <div class="row">
          <button class="btn small" id="peek" ${canReveal ? '' : 'disabled'}>👁 Hold to peek</button>
          <button class="btn small ${st.revealMode ? 'primary' : ''}" id="reveal" ${canReveal ? '' : 'disabled'}>${st.revealMode ? '✕ Cancel reveal' : '👑 Reveal my queen'}</button>
        </div>
        <div class="moves" style="padding:10px 12px;max-height:140px">${movesTxt || '<span class="muted">No moves yet.</span>'}</div>
        <div class="grid-btns">
          <button class="btn small" id="undo" ${st.stack.length ? '' : 'disabled'}>↶ Undo</button>
          <button class="btn small" id="flip">⇅ Flip</button>
          <button class="btn small" id="new">＋ New</button>
        </div>
        ${rulesHtml()}`;
      const peek = $('#peek', panel);
      const show = (on) => { if (!st.secret[chess.turn] || st.revealMode) return; board.annotate({ marks: on ? [st.secret[chess.turn]] : [] }); };
      peek.onpointerdown = (e) => { e.preventDefault(); show(true); };
      peek.onpointerup = peek.onpointerleave = peek.onpointercancel = () => show(false);
      $('#reveal', panel).onclick = toggleReveal;
      $('#undo', panel).onclick = undo;
      $('#flip', panel).onclick = () => { st.flip = !st.flip; board.setOrientation(orient()); };
      $('#new', panel).onclick = () => modal({ icon: '👑', title: 'Start a new game?', body: 'Both players will choose new secret pawns.', buttons: [{ label: 'Cancel' }, { label: 'New game', cls: 'primary', onClick: newGame }] });
    }
    function rulesHtml() {
      return `<details class="rules"><summary>How to play</summary><ol>
        <li>Before the game, each player secretly picks one of their pawns.</li>
        <li>That pawn moves and captures like a normal pawn — your opponent doesn't know which one it is.</li>
        <li>On your turn, press <b>Reveal</b> and make any queen move with it. From then on it's a real queen.</li>
        <li>Until revealed it can't give check. If it's captured, the secret is lost; if it promotes normally, the secret is used up.</li>
        <li>Checkmate wins, as usual. Use <b>Hold to peek</b> to remind yourself which pawn is yours — when your friend isn't looking!</li>
      </ol></details>`;
    }

    newGame();
    return () => timers.forEach(clearTimeout);
  }

  /* ---------------- Pawn Wars ---------------- */
  function pawnWars(view) {
    const { Sound, moveSound, toast, modal, confetti } = O();
    const FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8 w - - 0 1';
    const board = layout(view, `${crumbs('Pawn Wars')}<div class="pw-panel" style="display:contents"></div>`);
    const panel = $('.pw-panel', view);
    const prefs = Object.assign({ mode: 'cpu', level: 1, color: 'w' }, O().Store.get('pawnwars', {}));
    let chess = new Chess(FEN), result = null, thinking = false, token = 0, flip = false;
    const timers = [];

    const userTurn = () => prefs.mode === 'friend' || chess.turn === prefs.color;
    const orient = () => { const o = prefs.mode === 'cpu' ? prefs.color : 'w'; return flip ? other(o) : o; };
    board.movable = () => !result && !thinking && userTurn();
    board.movesFor = (name) => chess.moves({ square: name }).filter((m) => !m.promotion || m.promotion === 'q');
    board.onMove = (mv) => { const m = chess.move(mv); if (m) after(m); };

    function start() {
      token++;
      chess = new Chess(FEN);
      result = null;
      thinking = false;
      board.orientation = orient();
      board.setPosition(chess, null, { animate: false });
      render();
      if (prefs.mode === 'cpu' && chess.turn !== prefs.color) cpu();
    }
    function after(m) {
      board.setPosition(chess, m);
      moveSound(m, chess);
      if (m.promotion) end(m.color, 'reached the last rank');
      else if (!chess.moves().length) end(m.color, `${colorName(chess.turn)} has no moves left`);
      render();
      if (!result && prefs.mode === 'cpu' && chess.turn !== prefs.color) cpu();
    }
    function end(winner, reason) {
      result = { winner, reason };
      Sound.end();
      const userWon = prefs.mode === 'friend' || winner === prefs.color;
      if (userWon) confetti();
      timers.push(setTimeout(() => modal({
        icon: userWon ? '🏆' : '♞', title: prefs.mode === 'cpu' ? (userWon ? 'You win!' : 'The coach wins') : `${colorName(winner)} wins!`,
        body: `${colorName(winner)} ${reason === 'reached the last rank' ? 'got a pawn to the other side' : 'wins: ' + reason}.`,
        buttons: [{ label: 'Close' }, { label: 'Play again', cls: 'primary', onClick: start }],
      }), 500));
    }
    function cpu() {
      thinking = true;
      const t = ++token;
      render();
      timers.push(setTimeout(() => {
        if (t !== token) return;
        const lv = [{ depth: 2, noise: 120, randomChance: 0.15, timeMs: 400 }, { depth: 4, noise: 30, timeMs: 900 }, { depth: 6, noise: 0, timeMs: 1800 }][prefs.level];
        const r = Engine.bestMove(chess, lv);
        timers.push(setTimeout(() => {
          if (t !== token || !r) return;
          thinking = false;
          const m = chess.move(r.uci.slice(0, 4) + (r.uci.length > 4 ? 'q' : ''));
          if (m) after(m);
        }, 350));
      }, 60));
    }
    function undo() {
      token++;
      thinking = false;
      if (!chess.history().length) return;
      chess.undo();
      if (prefs.mode === 'cpu') while (chess.history().length && chess.turn !== prefs.color) chess.undo();
      result = null;
      const h = chess.history();
      board.setPosition(chess, h[h.length - 1] || null, { animate: false });
      render();
      if (prefs.mode === 'cpu' && chess.turn !== prefs.color) cpu();
    }
    function render() {
      const status = result ? `🏆 ${colorName(result.winner)} wins · ${result.reason}`
        : thinking ? '🤔 Coach is thinking…'
          : `${chess.turn === 'w' ? '⚪' : '⚫'} ${colorName(chess.turn)} to move${prefs.mode === 'cpu' && userTurn() ? ' — your turn' : ''}`;
      const seg = (k, opts) => `<div class="seg" data-k="${k}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(prefs[k]) === String(v) ? 'active' : ''}">${l}</button>`).join('')}</div>`;
      panel.innerHTML = `
        <div class="row spread" style="align-items:center"><h2 style="margin:0">♟ Pawn Wars</h2></div>
        <div class="coach">${Coach.avatar('happy')}<div class="bubble"><span class="who">Rocco</span>Only pawns! <b>Get one pawn to the other side</b> to win. You also win if your opponent runs out of moves. Normal pawn rules apply — including en passant.</div></div>
        <div class="field"><label class="muted" style="font-size:13px;font-weight:600">Opponent</label>${seg('mode', [['cpu', '🤖 Coach'], ['friend', '👥 Friend']])}</div>
        ${prefs.mode === 'cpu' ? `<div class="field"><label class="muted" style="font-size:13px;font-weight:600">Coach strength · your colour</label>${seg('level', [[0, 'Easy'], [1, 'Medium'], [2, 'Hard']])}${seg('color', [['w', '⚪ White'], ['b', '⚫ Black']])}</div>` : ''}
        <div class="status">${status}</div>
        <div class="grid-btns"><button class="btn small" id="undo">↶ Undo</button><button class="btn small" id="flip">⇅ Flip</button><button class="btn small primary" id="restart">⟳ Restart</button></div>`;
      $$('.seg', panel).forEach((s) => $$('button', s).forEach((b) => (b.onclick = () => {
        const k = s.dataset.k;
        prefs[k] = k === 'level' ? +b.dataset.v : b.dataset.v;
        O().Store.set('pawnwars', prefs);
        if (k === 'level') { render(); toast('Strength changes from the next move'); } else start();
      })));
      $('#undo', panel).onclick = undo;
      $('#flip', panel).onclick = () => { flip = !flip; board.setOrientation(orient()); };
      $('#restart', panel).onclick = start;
    }
    start();
    return () => { token++; timers.forEach(clearTimeout); };
  }

  /* ---------------- Coordinate Rush ---------------- */
  function coordRush(view) {
    const { Sound, modal, confetti, markActive } = O();
    const DURATION = 30000;
    const board = layout(view, `${crumbs('Coordinate Rush')}<div class="cr-panel" style="display:contents"></div>`, '<div class="rush-target"><span class="muted">Press Start</span></div>');
    const panel = $('.cr-panel', view);
    const targetEl = $('.rush-target', view);
    let side = 'w', withPieces = false, running = false, score = 0, misses = 0, target = null, endAt = 0, timer = null;
    board.coords = false;
    board.movable = () => false;

    function setBoard() {
      board.orientation = side;
      board.setPosition(new Chess(withPieces ? Chess.START_FEN : EMPTY), null, { animate: false });
    }
    function pick() {
      let t;
      do { t = 'abcdefgh'[Math.floor(Math.random() * 8)] + (1 + Math.floor(Math.random() * 8)); } while (t === target);
      target = t;
      targetEl.innerHTML = `<b>${t}</b>`;
    }
    function start() {
      running = true; score = 0; misses = 0;
      setBoard();
      pick();
      endAt = performance.now() + DURATION;
      clearInterval(timer);
      timer = setInterval(tick, 100);
      render();
    }
    function tick() {
      const left = Math.max(0, endAt - performance.now());
      const t = $('#time', panel);
      if (t) t.textContent = (left / 1000).toFixed(1) + 's';
      const bar = $('#tbar', panel);
      if (bar) bar.style.width = (left / DURATION) * 100 + '%';
      if (left <= 0) finish();
    }
    function finish() {
      running = false;
      clearInterval(timer);
      targetEl.innerHTML = '<span class="muted">Time!</span>';
      markActive();
      const prev = best('coord');
      const isBest = prev == null || score > prev;
      if (isBest) setBest('coord', score);
      Sound.end();
      if (isBest && score > 0) confetti();
      render();
      modal({ icon: '🎯', title: `${score} square${score === 1 ? '' : 's'}!`, body: `${misses} miss${misses === 1 ? '' : 'es'}. ${isBest && score > 0 ? '<b>New personal best!</b>' : `Your best: ${prev}.`}`, buttons: [{ label: 'Close' }, { label: 'Play again', cls: 'primary', onClick: start }] });
    }
    board.onSquare = (name) => {
      if (!running) return;
      if (name === target) { score++; board.flash(name, 'good'); Sound.move(); pick(); }
      else { misses++; board.flash(name, 'bad'); Sound.bad(); }
      const s = $('#score', panel);
      if (s) s.textContent = score;
    };
    function render() {
      panel.innerHTML = `
        <h2 style="margin:0">🎯 Coordinate Rush</h2>
        <div class="coach">${Coach.avatar('happy')}<div class="bubble"><span class="who">Rocco</span>A square name appears above the board. <b>Click that square</b> as fast as you can. You have 30 seconds. Knowing coordinates by heart makes reading chess books and notation easy!</div></div>
        <div class="row spread" style="align-items:center"><div><div class="muted">Score</div><div class="rating-big" id="score">${score}</div></div><div style="text-align:right"><div class="muted">Time</div><div class="rating-big" id="time">${running ? '' : '30.0s'}</div></div></div>
        <div class="stat" style="padding:0;border:0"><div class="bar"><i id="tbar" style="width:100%"></i></div></div>
        <div class="field"><label class="muted" style="font-size:13px;font-weight:600">Play from</label><div class="seg" id="side"><button data-v="w" class="${side === 'w' ? 'active' : ''}">⚪ White's side</button><button data-v="b" class="${side === 'b' ? 'active' : ''}">⚫ Black's side</button></div></div>
        <label class="toggle"><input type="checkbox" id="pcs" ${withPieces ? 'checked' : ''} ${running ? 'disabled' : ''}> Show the starting position</label>
        <div class="row spread"><span class="muted">🏅 Best: ${best('coord') ?? '—'}</span><button class="btn primary" id="go">${running ? '⟳ Restart' : '▶ Start'}</button></div>`;
      $$('#side button', panel).forEach((b) => (b.onclick = () => { if (running) return; side = b.dataset.v; setBoard(); render(); }));
      $('#pcs', panel).onchange = (e) => { withPieces = e.target.checked; setBoard(); };
      $('#go', panel).onclick = start;
    }
    setBoard();
    render();
    return () => clearInterval(timer);
  }

  /* ---------------- Knight Sprint ---------------- */
  function knightDistance(a, b) {
    const A = Chess.sqIndex(a), B = Chess.sqIndex(b);
    const dist = new Array(64).fill(-1);
    dist[A] = 0;
    const q = [A];
    while (q.length) {
      const i = q.shift();
      if (i === B) return dist[i];
      const r = i >> 3, f = i & 7;
      for (const [dr, df] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
        const rr = r + dr, ff = f + df;
        if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
        const j = rr * 8 + ff;
        if (dist[j] < 0) { dist[j] = dist[i] + 1; q.push(j); }
      }
    }
    return -1;
  }

  function knightSprint(view) {
    const { Sound, modal, confetti, markActive, praise } = O();
    const ROUNDS = 5;
    const board = layout(view, `${crumbs('Knight Sprint')}<div class="ks-panel" style="display:contents"></div>`);
    const panel = $('.ks-panel', view);
    let round = 0, pos, target, moves = 0, optimal = 0, results = [], chess, done = false, msg = '';
    const timers = [];
    board.orientation = 'w';
    board.movable = () => !done && pos !== target;
    board.onMove = (mv) => {
      moves++;
      pos = mv.to;
      const m = { from: mv.from, to: mv.to, flags: 'n' };
      load(m);
      if (pos === target) {
        const extra = moves - optimal;
        results.push({ moves, optimal });
        Sound.good();
        board.flash(target, 'good');
        msg = extra === 0 ? `✓ ${praise()} Perfect — ${moves} jump${moves === 1 ? '' : 's'}.` : `✓ Reached in ${moves}. The shortest path was ${optimal}.`;
        render();
        timers.push(setTimeout(() => (round + 1 < ROUNDS ? nextRound() : finish()), 1100));
      } else { Sound.move(); render(); }
    };
    function load(last) {
      const idx = Chess.sqIndex(pos);
      const rows = [];
      for (let r = 0; r < 8; r++) {
        let row = '', e = 0;
        for (let f = 0; f < 8; f++) { if (r * 8 + f === idx) { if (e) row += e; e = 0; row += 'N'; } else e++; }
        if (e) row += e;
        rows.push(row);
      }
      chess = new Chess(rows.join('/') + ' w - - 0 1');
      board.setPosition(chess, last || null, { animate: !!last });
      board.annotate({ hintSquares: pos === target ? [] : [target] });
    }
    function rnd() { return 'abcdefgh'[Math.floor(Math.random() * 8)] + (1 + Math.floor(Math.random() * 8)); }
    function nextRound(first) {
      if (!first) round++;
      do { pos = rnd(); target = rnd(); optimal = knightDistance(pos, target); } while (optimal < 3 || optimal > 5);
      moves = 0;
      msg = `Round ${round + 1}: reach the glowing square.`;
      load(null);
      render();
    }
    function start() { round = 0; results = []; done = false; nextRound(true); }
    function finish() {
      done = true;
      markActive();
      const extra = results.reduce((s, r) => s + r.moves - r.optimal, 0);
      const perfect = results.filter((r) => r.moves === r.optimal).length;
      const prev = best('knight');
      const isBest = prev == null || extra < prev;
      if (isBest) setBest('knight', extra);
      if (extra === 0) confetti();
      Sound.end();
      render();
      modal({ icon: '🐴', title: extra === 0 ? 'Flawless!' : `${extra} extra jump${extra === 1 ? '' : 's'}`, body: `${perfect}/${ROUNDS} rounds on the shortest path. ${isBest ? '<b>New personal best!</b>' : `Your best: ${prev} extra.`}`, buttons: [{ label: 'Close' }, { label: 'Play again', cls: 'primary', onClick: start }] });
    }
    function render() {
      panel.innerHTML = `
        <h2 style="margin:0">🐴 Knight Sprint</h2>
        <div class="coach">${Coach.avatar('happy')}<div class="bubble"><span class="who">Rocco</span>Jump the knight to the <b>glowing square</b> using as few moves as possible. Seeing knight paths quickly is the secret behind every knight fork!</div></div>
        <div class="steps">${Array.from({ length: ROUNDS }, (_, i) => `<i class="${i < results.length ? 'done' : i === round && !done ? 'cur' : ''}"></i>`).join('')}</div>
        <div class="row spread"><div><div class="muted">Jumps</div><div class="rating-big">${moves}</div></div><div style="text-align:right"><div class="muted">Target</div><div class="rating-big">${target || '—'}</div></div></div>
        <div class="feedback ${msg.startsWith('✓') ? 'good' : 'info'}">${msg}</div>
        <div class="row spread"><span class="muted">🏅 Best: ${best('knight') != null ? best('knight') + ' extra' : '—'}</span><button class="btn primary" id="go">⟳ New run</button></div>`;
      $('#go', panel).onclick = start;
    }
    start();
    return () => timers.forEach(clearTimeout);
  }

  window.Games = { list, open, GAMES };
})();
