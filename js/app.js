/* Outpost app: routing, home, lessons, puzzles, play (pass & play + vs coach). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const other = (c) => (c === 'w' ? 'b' : 'w');
  const colorName = (c) => (c === 'w' ? 'White' : 'Black');

  /* ---------------- Storage ---------------- */
  const Store = {
    get(k, d) { try { const v = localStorage.getItem('outpost.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('outpost.' + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
    del(k) { try { localStorage.removeItem('outpost.' + k); } catch (e) { /* ignore */ } },
  };
  const prefs = Object.assign({ sound: true, theme: 'walnut', setup: null }, Store.get('prefs', {}));
  const progress = Object.assign({ lessons: {}, lessonStep: {}, puzzles: {}, rating: 600, days: [] }, Store.get('progress', {}));
  const savePrefs = () => Store.set('prefs', prefs);
  const saveProgress = () => Store.set('progress', progress);

  const fmtDay = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function markActive() {
    const t = fmtDay(new Date());
    if (!progress.days.includes(t)) { progress.days.push(t); if (progress.days.length > 400) progress.days.shift(); saveProgress(); }
  }
  function streak() {
    const set = new Set(progress.days);
    const d = new Date();
    if (!set.has(fmtDay(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(fmtDay(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ---------------- Sound ---------------- */
  let actx = null;
  function tone(freq, dur, type = 'sine', vol = 0.08, delay = 0) {
    if (!prefs.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime + delay;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* audio unavailable */ }
  }
  const Sound = {
    move() { tone(540, 0.06, 'triangle', 0.14); },
    capture() { tone(320, 0.08, 'square', 0.05); tone(200, 0.1, 'triangle', 0.1, 0.03); },
    check() { tone(760, 0.08, 'sawtooth', 0.035); tone(980, 0.1, 'sawtooth', 0.035, 0.08); },
    good() { [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'sine', 0.08, i * 0.08)); },
    bad() { tone(196, 0.2, 'sawtooth', 0.05); },
    end() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.32, 'sine', 0.07, i * 0.1)); },
  };
  const moveSound = (m, chess) => (chess.inCheck() ? Sound.check() : m.captured ? Sound.capture() : Sound.move());

  /* ---------------- UI helpers ---------------- */
  function toast(msg, ms = 2200) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  function modal({ icon = '', title = '', body = '', buttons = [] }) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal"><div class="big">${icon}</div><h2>${title}</h2><div class="muted">${body}</div><div class="row"></div></div>`;
    const row = $('.row', back);
    const close = () => back.remove();
    buttons.forEach((b) => {
      const el = document.createElement('button');
      el.className = 'btn ' + (b.cls || '');
      el.textContent = b.label;
      el.onclick = () => { close(); b.onClick && b.onClick(); };
      row.appendChild(el);
    });
    back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
    document.body.appendChild(back);
    return close;
  }
  function confetti() {
    const colors = ['#e6a93f', '#5cb86a', '#5b9be6', '#e05d5d', '#f3c56b', '#ffffff'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      document.body.appendChild(c);
      const x = (Math.random() - 0.5) * 200, rot = Math.random() * 720;
      c.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${x}px, 105vh) rotate(${rot}deg)` }],
        { duration: 1800 + Math.random() * 1400, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => c.remove();
    }
  }
  const PRAISE = ['Excellent!', 'Great find!', 'Brilliant!', 'Well played!', 'Spot on!', 'Nicely done!'];
  const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

  /* ---------------- Theme & sound buttons ---------------- */
  const THEMES = ['walnut', 'sage', 'ocean', 'slate'];
  function applyPrefs() {
    document.body.dataset.theme = prefs.theme;
    $('#soundBtn').textContent = prefs.sound ? '🔊' : '🔇';
  }
  $('#themeBtn').onclick = () => {
    prefs.theme = THEMES[(THEMES.indexOf(prefs.theme) + 1) % THEMES.length];
    savePrefs(); applyPrefs(); toast('Board theme: ' + prefs.theme);
  };
  $('#soundBtn').onclick = () => { prefs.sound = !prefs.sound; savePrefs(); applyPrefs(); if (prefs.sound) Sound.move(); };

  /* ---------------- Exercise: shared engine for lesson tasks & puzzles ---------------- */
  class Exercise {
    constructor(o) { Object.assign(this, o); }
    start() {
      this.timers = [];
      this.chess = new Chess(this.fen);
      this.userColor = this.chess.turn;
      this.ply = 0;
      this.remaining = this.mate || 0;
      this.free = false;
      this.done = false;
      this.busy = false;
      this.failed = false;
      this.usedHelp = false;
      this.hintLevel = 0;
      this.board.orientation = this.userColor;
      this.board.movable = (c) => !this.done && !this.busy && c === this.userColor;
      this.board.onMove = (mv) => this._user(mv);
      this.board.setPosition(this.chess, null);
    }
    stop() { (this.timers || []).forEach(clearTimeout); this.done = true; }
    _later(fn, ms) { this.timers.push(setTimeout(fn, ms)); }
    _expected() { return (this.solution[this.ply] || '').split('|').filter(Boolean); }
    _user(mv) {
      if (this.done || this.busy) return;
      const hist = this.chess.history();
      const prevLast = hist[hist.length - 1] || null;
      const m = this.chess.move(mv);
      if (!m) return;
      this.board.setPosition(this.chess, m);
      moveSound(m, this.chess);
      this.hintLevel = 0;
      if (this.chess.isCheckmate()) return this._solved();
      const exp = this._expected();
      if (!this.free && exp.includes(m.uci)) {
        this.ply++;
        if (this.mate) this.remaining--;
        if (this.ply >= this.solution.length) return this._solved();
        this.onStatus && this.onStatus('progress', m);
        this._reply(this.solution[this.ply].split('|')[0]);
        return;
      }
      if (this.mate && this.remaining >= 2 && Engine.stillMating(this.chess, this.remaining - 1)) {
        this.free = true;
        this.remaining--;
        this.onStatus && this.onStatus('progress', m);
        this._reply(Engine.defenseMove(this.chess, this.remaining));
        return;
      }
      this.failed = true;
      this.busy = true;
      Sound.bad();
      this.onWrong && this.onWrong(m);
      this._later(() => {
        this.chess.undo();
        this.busy = false;
        this.board.setPosition(this.chess, prevLast, { animMove: m, reverse: true });
      }, 700);
    }
    _reply(uci) {
      this.busy = true;
      this._later(() => {
        const m = this.chess.move(uci);
        if (!this.free) this.ply++;
        this.busy = false;
        this.board.setPosition(this.chess, m);
        moveSound(m, this.chess);
        this.onStatus && this.onStatus('reply', m);
        if (!this.free && this.ply >= this.solution.length) this._solved();
      }, 520);
    }
    _solved() {
      this.done = true;
      this.board.render();
      this.onSolved && this.onSolved();
    }
    _nextMove() {
      if (this.free) {
        return this.chess.turn === this.userColor ? Engine.mateMove(this.chess, this.remaining) : Engine.defenseMove(this.chess, this.remaining);
      }
      return this._expected()[0];
    }
    hint() {
      if (this.done || this.busy) return 0;
      const mv = this._nextMove();
      if (!mv) return 0;
      this.usedHelp = true;
      this.hintLevel++;
      if (this.hintLevel === 1) this.board.annotate({ hintSquares: [mv.slice(0, 2)] });
      else this.board.annotate({ hintSquares: [], arrows: [[mv.slice(0, 2), mv.slice(2, 4), 'g']] });
      return this.hintLevel;
    }
    showSolution(onEnd) {
      if (this.done) return;
      this.usedHelp = true;
      this.done = true;
      this.timers.forEach(clearTimeout);
      const step = () => {
        const finished = this.chess.isCheckmate() || (!this.free && this.ply >= this.solution.length);
        if (finished) { this.board.render(); onEnd && onEnd(); return; }
        const userTurn = this.chess.turn === this.userColor;
        const mv = this._nextMove();
        if (!mv) { onEnd && onEnd(); return; }
        const m = this.chess.move(mv);
        if (!this.free) this.ply++;
        else if (userTurn) this.remaining--;
        this.board.setPosition(this.chess, m);
        this.board.annotate({ arrows: [[m.from, m.to, userTurn ? 'g' : 'y']] });
        moveSound(m, this.chess);
        this.timers.push(setTimeout(step, 900));
      };
      // if a wrong move is pending revert, let it finish first
      this.timers.push(setTimeout(step, this.busy ? 750 : 200));
    }
  }

  /* ---------------- Router ---------------- */
  let cleanup = null;
  function route() {
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    $$('.modal-back').forEach((m) => m.remove());
    const h = location.hash.replace(/^#\/?/, '');
    const cut = h.indexOf('-');
    const name = cut < 0 ? h : h.slice(0, cut);
    const arg = cut < 0 ? '' : h.slice(cut + 1);
    $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.r === (name === 'home' ? '' : name === 'lesson' ? 'lessons' : name === 'puzzle' ? 'puzzles' : name === 'game' ? 'games' : name === 'play' ? 'play' : name || '')));
    const view = $('#view');
    view.innerHTML = '';
    window.scrollTo(0, 0);
    switch (name) {
      case 'lessons': cleanup = viewLessons(view); break;
      case 'lesson': cleanup = viewLesson(view, arg); break;
      case 'puzzles': cleanup = viewPuzzles(view); break;
      case 'puzzle': cleanup = viewPuzzle(view, arg); break;
      case 'play': cleanup = arg === 'new' ? viewSetup(view) : viewGame(view); break;
      case 'games': cleanup = Games.list(view); break;
      case 'game': cleanup = Games.open(view, arg); break;
      default: cleanup = viewHome(view);
    }
  }

  /* ---------------- Home ---------------- */
  const TIPS = [
    ['🎯', 'Before every move, ask: what is my opponent threatening?'],
    ['🏰', 'Castle early. A king in the centre is a target.'],
    ['⚔️', 'Look for checks, captures and threats — in that order — on every move.'],
    ['🐴', 'Knights love outposts: squares in enemy territory that pawns can no longer attack.'],
    ['♟️', 'Pawns can\'t move backwards. Think twice before every pawn push.'],
    ['🧠', 'When you see a good move, look for a better one.'],
    ['🔗', 'Rooks belong on open files and on the 7th rank.'],
    ['👑', 'In the endgame, the king becomes a fighting piece. Bring it to the centre!'],
    ['⏱️', 'Solving a few puzzles every day beats a marathon once a month.'],
    ['🤝', 'Trade pieces when you\'re ahead in material; avoid trades when you\'re behind.'],
  ];
  function dayIndex() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000); }
  function puzzleOfDay() { return PUZZLES[dayIndex() % PUZZLES.length]; }
  function nextLesson() { return LESSONS.find((l) => !progress.lessons[l.id]) || null; }
  function solvedCount() { return Object.values(progress.puzzles).filter((p) => p.solved).length; }

  function viewHome(view) {
    const next = nextLesson();
    const done = Object.keys(progress.lessons).length;
    const solved = solvedCount();
    const potd = puzzleOfDay();
    const potdDone = progress.puzzles[potd.id] && progress.puzzles[potd.id].solved;
    const tip = TIPS[dayIndex() % TIPS.length];
    const game = Store.get('game', null);
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    view.innerHTML = `
      <section class="hero">
        <div>
          <div class="pill gold">${greet} 👋</div>
          <h1 style="margin-top:12px">Train smarter.<br><span>Play better chess.</span></h1>
          <p>Your personal chess coach: step-by-step lessons, hand-picked puzzles, and a board for playing a friend face-to-face on one device.</p>
          <div class="cta">
            ${next ? `<a class="btn primary" href="#lesson-${next.id}">▶ ${done ? 'Continue' : 'Start'}: ${esc(next.title)}</a>` : `<a class="btn primary" href="#puzzles">▶ All lessons done — train puzzles</a>`}
            <a class="btn" href="#puzzles">🧩 Puzzles</a>
            <a class="btn" href="#play-new">👥 Play a friend</a>
          </div>
        </div>
        <div class="hero-board">${Board.miniBoard('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5', 'w')}</div>
      </section>
      <div class="stats">
        <div class="stat"><div class="v">${done}<span class="muted" style="font-size:16px">/${LESSONS.length}</span></div><div class="l">Lessons completed</div><div class="bar"><i style="width:${(done / LESSONS.length) * 100}%"></i></div></div>
        <div class="stat"><div class="v">${solved}<span class="muted" style="font-size:16px">/${PUZZLES.length}</span></div><div class="l">Puzzles solved</div><div class="bar"><i style="width:${(solved / PUZZLES.length) * 100}%;background:var(--good)"></i></div></div>
        <div class="stat"><div class="v">${progress.rating}</div><div class="l">Puzzle rating</div></div>
        <div class="stat"><div class="v">${streak()} 🔥</div><div class="l">Day streak</div></div>
      </div>
      <div class="section-title"><h2>Today's training</h2></div>
      <div class="home-grid four">
        <div class="card feature" data-go="#lessons"><div class="ico">📚</div><h3>Lessons</h3><div class="muted">${LESSONS.length} interactive lessons — from how the pieces move to forks, pins and mating patterns.</div></div>
        <div class="card feature" data-go="#puzzles"><div class="ico">🧩</div><h3>Puzzles</h3><div class="muted">${PUZZLES.length} tactics puzzles with hints. Your rating adapts as you solve.</div></div>
        <div class="card feature" data-go="${game && !game.result ? '#play' : '#play-new'}"><div class="ico">♟️</div><h3>Play</h3><div class="muted">${game && !game.result ? '<b style="color:var(--accent2)">Game in progress</b> — jump back in.' : 'Pass & play with a friend on this device, or practise against the coach.'}</div></div>
        <div class="card feature" data-go="#games"><div class="ico">👑</div><h3>Mini-games</h3><div class="muted">Secret Queen, Pawn Wars, Coordinate Rush and Knight Sprint.</div></div>
      </div>
      <div class="home-grid" style="grid-template-columns:1.2fr 1fr;margin-top:16px">
        <div class="card potd">
          <div>${Board.miniBoard(potd.fen, potd.fen.split(' ')[1])}</div>
          <div>
            <div class="pill ${potdDone ? 'green' : 'gold'}">${potdDone ? '✓ Solved' : 'Puzzle of the day'}</div>
            <h3 style="margin:10px 0 4px">${esc(potd.title)}</h3>
            <div class="muted" style="margin-bottom:12px">${colorName(potd.fen.split(' ')[1])} to move · rated ${potd.rating}</div>
            <a class="btn primary small" href="#puzzle-${potd.id}">Solve it</a>
          </div>
        </div>
        <div class="card tip"><div class="ico">${tip[0]}</div><div><h3>Coach's tip</h3><div class="muted" style="font-size:15px">${esc(tip[1])}</div></div></div>
      </div>`;
    $$('[data-go]', view).forEach((el) => (el.onclick = () => (location.hash = el.dataset.go)));
  }

  /* ---------------- Lessons ---------------- */
  function viewLessons(view) {
    const cats = [...new Set(LESSONS.map((l) => l.category))];
    const done = Object.keys(progress.lessons).length;
    let html = `<div class="section-title" style="margin-top:0"><div><h1>Lessons</h1><div class="muted">${done} of ${LESSONS.length} completed · work through them in order, or jump to any topic.</div></div></div>`;
    let n = 0;
    for (const cat of cats) {
      html += `<div class="section-title"><h2>${esc(cat)}</h2></div><div class="lesson-grid">`;
      for (const l of LESSONS.filter((x) => x.category === cat)) {
        n++;
        const isDone = !!progress.lessons[l.id];
        const step = progress.lessonStep[l.id] || 0;
        const status = isDone ? '<span class="pill green">✓ Completed</span>' : step > 0 ? `<span class="pill gold">In progress · ${step + 1}/${l.steps.length}</span>` : `<span class="pill">${l.steps.length} steps</span>`;
        html += `<div class="card lesson-card ${isDone ? 'done' : ''}" data-id="${l.id}"><span class="num">#${n}</span><div class="ico">${l.icon}</div><div><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p>${status}</div></div>`;
      }
      html += '</div>';
    }
    view.innerHTML = html;
    $$('.lesson-card', view).forEach((el) => (el.onclick = () => (location.hash = '#lesson-' + el.dataset.id)));
  }

  function trainerLayout(view, panelHtml) {
    view.innerHTML = `<div class="trainer"><div class="board-col"><div class="board-frame"><div class="bd"></div></div></div><div class="panel">${panelHtml}</div></div>`;
    return new Board($('.bd', view));
  }

  function viewLesson(view, id) {
    const lesson = LESSONS.find((l) => l.id === id);
    if (!lesson) { location.hash = '#lessons'; return; }
    const idx = LESSONS.indexOf(lesson);
    let step = progress.lessons[id] ? 0 : Math.min(progress.lessonStep[id] || 0, lesson.steps.length - 1);
    const board = trainerLayout(view, '<div class="lesson-panel" style="display:contents"></div>');
    const panel = $('.lesson-panel', view);
    let ex = null, solved = false, hintClicks = 0;

    function feedback(kind, html) { const f = $('.feedback', panel); f.className = 'feedback ' + kind; f.innerHTML = html; }

    function show() {
      if (ex) ex.stop();
      ex = null;
      hintClicks = 0;
      const s = lesson.steps[step];
      solved = !s.task;
      progress.lessonStep[id] = step;
      saveProgress();
      const last = step === lesson.steps.length - 1;
      panel.innerHTML = `
        <div class="crumbs"><a href="#lessons">Lessons</a> / ${esc(lesson.category)}</div>
        <div class="row spread" style="align-items:center"><h2 style="margin:0">${lesson.icon} ${esc(lesson.title)}</h2><span class="muted">${step + 1}/${lesson.steps.length}</span></div>
        <div class="steps">${lesson.steps.map((_, i) => `<i class="${i < step ? 'done' : i === step ? 'cur' : ''}"></i>`).join('')}</div>
        <div class="coach"><div class="avatar">♞</div><div class="bubble lesson-text">${s.text}</div></div>
        <div class="feedback ${s.task ? 'info' : ''}" ${s.task ? '' : 'style="display:none"'}></div>
        <div class="row">${s.task ? '<button class="btn small" data-a="hint">💡 Hint</button><button class="btn small" data-a="retry">↺ Retry</button>' : ''}</div>
        <div class="row spread">
          <button class="btn" data-a="prev" ${step === 0 ? 'disabled' : ''}>← Back</button>
          <button class="btn primary" data-a="next" ${solved ? '' : 'disabled'}>${last ? 'Finish lesson ✓' : 'Next →'}</button>
        </div>`;
      if (s.task) {
        ex = new Exercise({
          board, fen: s.fen, solution: s.task.solution, mate: s.task.mate,
          onSolved() {
            solved = true;
            Sound.good();
            feedback('good', '✓ ' + praise() + (last ? ' Lesson complete — press Finish.' : ' Press Next to continue.'));
            $('[data-a="next"]', panel).disabled = false;
          },
          onWrong() { feedback('bad', '✗ Not quite — try again. Stuck? Use a hint.'); },
          onStatus(kind) {
            if (kind === 'progress') feedback('info', 'Good! Waiting for Black\'s reply…');
            if (kind === 'reply') feedback('info', '<span class="side ' + ex.userColor + '"></span>Your move — keep going.');
          },
        });
        ex.start();
        feedback('info', `<span class="side ${ex.userColor}"></span>${colorName(ex.userColor)} to move — your turn.`);
      } else {
        const ch = new Chess(s.fen);
        board.orientation = 'w';
        board.movable = () => false;
        board.onMove = null;
        board.setPosition(ch, null);
        board.annotate({ marks: s.marks || [], arrows: s.arrows || [] });
      }
      $$('[data-a]', panel).forEach((b) => (b.onclick = () => act(b.dataset.a)));
    }

    function act(a) {
      const s = lesson.steps[step];
      if (a === 'prev' && step > 0) { step--; show(); }
      else if (a === 'next') {
        if (!solved) return;
        if (step < lesson.steps.length - 1) { step++; show(); }
        else finish();
      } else if (a === 'retry') show();
      else if (a === 'hint' && ex) {
        hintClicks++;
        const lvl = ex.hint();
        if (lvl) feedback('info', '💡 ' + (lvl === 1 && s.hint ? esc(s.hint) : lvl === 1 ? 'Look at the highlighted piece.' : 'Here\'s the move — play it!'));
      }
    }

    function finish() {
      progress.lessons[id] = true;
      progress.lessonStep[id] = 0;
      markActive();
      saveProgress();
      confetti();
      Sound.end();
      const nxt = LESSONS[idx + 1];
      modal({
        icon: '🏆', title: 'Lesson complete!',
        body: `You finished <b>${esc(lesson.title)}</b>. ${nxt ? 'Up next: ' + esc(nxt.title) + '.' : 'You\'ve completed every lesson — time for puzzles!'}`,
        buttons: nxt
          ? [{ label: 'All lessons', onClick: () => (location.hash = '#lessons') }, { label: 'Next lesson →', cls: 'primary', onClick: () => (location.hash = '#lesson-' + nxt.id) }]
          : [{ label: 'Solve puzzles →', cls: 'primary', onClick: () => (location.hash = '#puzzles') }],
      });
    }

    show();
    return () => ex && ex.stop();
  }

  /* ---------------- Puzzles ---------------- */
  function recommendedPuzzle(excludeId) {
    const unsolved = PUZZLES.filter((p) => !(progress.puzzles[p.id] && progress.puzzles[p.id].solved) && p.id !== excludeId);
    if (!unsolved.length) {
      const pool = PUZZLES.filter((p) => p.id !== excludeId);
      return pool[Math.floor(Math.random() * pool.length)];
    }
    unsolved.sort((a, b) => Math.abs(a.rating - progress.rating) - Math.abs(b.rating - progress.rating));
    return unsolved[0];
  }

  function viewPuzzles(view) {
    const themes = ['All', ...new Set(PUZZLES.flatMap((p) => p.themes))];
    let filter = 'All';
    const solved = solvedCount();
    view.innerHTML = `
      <div class="hero" style="grid-template-columns:1fr auto;padding:26px">
        <div><h1 style="font-size:32px">Puzzle trainer</h1><p>Find the best move. Solve on your first try to raise your rating — hints and wrong moves will cost points.</p>
          <div class="cta"><button class="btn primary" id="startPz">▶ Start training</button></div></div>
        <div style="text-align:right"><div class="muted">Puzzle rating</div><div class="rating-big">${progress.rating}</div><div class="muted">${solved}/${PUZZLES.length} solved</div></div>
      </div>
      <div class="section-title"><h2>All puzzles</h2></div>
      <div class="chips">${themes.map((t) => `<button class="chip ${t === 'All' ? 'active' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div class="puzzle-grid"></div>`;
    const grid = $('.puzzle-grid', view);
    function draw() {
      grid.innerHTML = PUZZLES.filter((p) => filter === 'All' || p.themes.includes(filter)).map((p) => {
        const rec = progress.puzzles[p.id];
        const st = rec && rec.solved ? (rec.clean ? '<span class="pill green">✓</span>' : '<span class="pill gold">✓</span>') : rec ? '<span class="pill">tried</span>' : '';
        return `<div class="card pz-card ${rec && rec.solved ? 'solved' : ''}" data-id="${p.id}">${Board.miniBoard(p.fen, p.fen.split(' ')[1])}
          <div class="t">${esc(p.title)}</div><div class="meta"><span class="muted">★ ${p.rating}</span>${st}</div></div>`;
      }).join('');
      $$('.pz-card', grid).forEach((el) => (el.onclick = () => (location.hash = '#puzzle-' + el.dataset.id)));
    }
    $$('.chip', view).forEach((c) => (c.onclick = () => { filter = c.dataset.t; $$('.chip', view).forEach((x) => x.classList.toggle('active', x === c)); draw(); }));
    $('#startPz', view).onclick = () => (location.hash = '#puzzle-' + recommendedPuzzle().id);
    draw();
  }

  function viewPuzzle(view, id) {
    const pz = PUZZLES.find((p) => p.id === id) || recommendedPuzzle();
    const num = PUZZLES.indexOf(pz) + 1;
    const side = pz.fen.split(' ')[1];
    const goal = pz.mate ? `Find checkmate in ${pz.mate}.` : 'Find the best move.';
    const board = trainerLayout(view, `
      <div class="crumbs"><a href="#puzzles">Puzzles</a> / #${num}</div>
      <div class="row spread" style="align-items:center"><h2 style="margin:0">${esc(pz.title)}</h2><span class="pill">★ ${pz.rating}</span></div>
      <div class="coach"><div class="avatar">♞</div><div class="bubble"><b>${colorName(side)} to move.</b> ${goal}</div></div>
      <div class="feedback info"></div>
      <div class="row" style="align-items:center"><span class="muted">Your rating:</span> <b class="rt">${progress.rating}</b><span class="delta"></span></div>
      <div class="row"><button class="btn small" data-a="hint">💡 Hint</button><button class="btn small" data-a="sol">👁 Solution</button><button class="btn small" data-a="retry">↺ Retry</button><button class="btn small ghost" data-a="theme">🏷 Theme</button></div>
      <div class="themes muted" style="display:none">${pz.themes.map((t) => `<span class="pill">${esc(t)}</span>`).join(' ')}</div>
      <div class="row end"><button class="btn primary" data-a="next">Next puzzle →</button></div>`);
    const panel = $('.panel', view);
    const fb = (kind, html) => { const f = $('.feedback', panel); f.className = 'feedback ' + kind; f.innerHTML = html; };
    let ex = null;

    function rate(score) {
      const rec = progress.puzzles[pz.id];
      if (rec && rec.rated) return;
      const expected = 1 / (1 + Math.pow(10, (pz.rating - progress.rating) / 400));
      const delta = Math.round(32 * (score - expected)) || (score ? 1 : -1);
      progress.rating = Math.max(100, progress.rating + delta);
      progress.puzzles[pz.id] = Object.assign(rec || {}, { rated: true, clean: score === 1, solved: score === 1 || !!(rec && rec.solved) });
      markActive();
      saveProgress();
      $('.rt', panel).textContent = progress.rating;
      const d = $('.delta', panel);
      d.className = 'delta ' + (delta >= 0 ? 'up' : 'down');
      d.textContent = (delta >= 0 ? '+' : '') + delta;
    }
    function markSolved() {
      progress.puzzles[pz.id] = Object.assign(progress.puzzles[pz.id] || {}, { solved: true });
      saveProgress();
    }

    function start() {
      if (ex) ex.stop();
      ex = new Exercise({
        board, fen: pz.fen, solution: pz.solution, mate: pz.mate,
        onSolved() {
          if (ex.failed || ex.usedHelp) rate(0); else rate(1);
          markSolved();
          Sound.good();
          fb('good', '✓ ' + praise() + ' Puzzle solved.');
          $('.themes', panel).style.display = '';
          if (!ex.failed && !ex.usedHelp) confetti();
        },
        onWrong() { rate(0); fb('bad', '✗ That\'s not it. The position has been reset — try again!'); },
        onStatus(kind) {
          if (kind === 'reply') fb('info', `<span class="side ${side}"></span>Good — keep going!`);
          if (kind === 'progress') fb('info', 'Correct! Opponent is replying…');
        },
      });
      ex.start();
      fb('info', `<span class="side ${side}"></span>${colorName(side)} to move.`);
    }

    $$('[data-a]', panel).forEach((b) => (b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'hint') { const l = ex.hint(); if (l) { rate(0); fb('info', l === 1 ? '💡 Move the highlighted piece.' : '💡 Play the arrow move.'); } }
      if (a === 'sol') { rate(0); fb('info', '👁 Watch the solution…'); ex.showSolution(() => { fb('info', 'That\'s the solution. Retry it yourself, or move on.'); $('.themes', panel).style.display = ''; }); }
      if (a === 'retry') start();
      if (a === 'theme') { const t = $('.themes', panel); t.style.display = t.style.display ? '' : 'none'; }
      if (a === 'next') location.hash = '#puzzle-' + recommendedPuzzle(pz.id).id;
    }));
    start();
    return () => ex && ex.stop();
  }

  /* ---------------- Play: setup ---------------- */
  const TIME_CONTROLS = [
    { id: 'none', label: 'No clock' }, { id: '3+2', label: '3 + 2' }, { id: '5+0', label: '5 min' },
    { id: '10+0', label: '10 min' }, { id: '15+10', label: '15 + 10' }, { id: '30+0', label: '30 min' },
  ];
  const parseTc = (id) => { if (!id || id === 'none') return null; const [m, s] = id.split('+').map(Number); return { base: m * 60000, inc: s * 1000, id }; };

  function viewSetup(view) {
    const s = Object.assign({ mode: 'friend', white: 'Player 1', black: 'Player 2', you: 'You', tc: 'none', autoFlip: true, level: 1, color: 'w' }, prefs.setup || {});
    view.innerHTML = `<div class="setup">
      <h1>New game</h1><p class="muted">Choose how you want to play.</p>
      <div class="mode-pick">
        <button class="mode" data-m="friend"><div class="ico">👥</div><h3>Pass & play</h3><div class="muted">Two players, one device. Take turns on the same screen — the board can flip automatically.</div></button>
        <button class="mode" data-m="cpu"><div class="ico">🤖</div><h3>Play the coach</h3><div class="muted">Practise against the computer at four difficulty levels. Ask for hints any time.</div></button>
      </div>
      <div class="card" style="margin-top:16px"><div class="form"></div>
        <div class="row end" style="margin-top:20px"><a class="btn ghost" href="#play">Cancel</a><button class="btn primary" id="go">Start game ▶</button></div>
      </div></div>`;
    const form = $('.form', view);
    function draw() {
      $$('.mode', view).forEach((m) => m.classList.toggle('active', m.dataset.m === s.mode));
      const tcSeg = `<div class="seg" data-k="tc">${TIME_CONTROLS.map((t) => `<button data-v="${t.id}" class="${s.tc === t.id ? 'active' : ''}">${t.label}</button>`).join('')}</div>`;
      if (s.mode === 'friend') {
        form.innerHTML = `
          <div class="field"><label>⚪ White player</label><input id="wn" maxlength="20" value="${esc(s.white)}"></div>
          <div class="field"><label>⚫ Black player</label><input id="bn" maxlength="20" value="${esc(s.black)}"></div>
          <div class="field" style="grid-column:1/-1"><label>Time control</label>${tcSeg}</div>
          <label class="toggle" style="grid-column:1/-1"><input type="checkbox" id="af" ${s.autoFlip ? 'checked' : ''}> Flip the board after every move so each player sees it from their side</label>`;
      } else {
        form.innerHTML = `
          <div class="field"><label>Your colour</label><div class="seg" data-k="color">${[['w', '⚪ White'], ['r', '🎲 Random'], ['b', '⚫ Black']].map(([v, l]) => `<button data-v="${v}" class="${s.color === v ? 'active' : ''}">${l}</button>`).join('')}</div></div>
          <div class="field"><label>Coach strength</label><div class="seg" data-k="level">${Engine.LEVELS.map((l, i) => `<button data-v="${i}" class="${+s.level === i ? 'active' : ''}">${l.name}</button>`).join('')}</div></div>
          <div class="field" style="grid-column:1/-1"><label>Your name</label><input id="yn" maxlength="20" value="${esc(s.you)}"></div>`;
      }
      $$('.seg', form).forEach((seg) => $$('button', seg).forEach((b) => (b.onclick = () => { read(); s[seg.dataset.k] = seg.dataset.k === 'level' ? +b.dataset.v : b.dataset.v; draw(); })));
    }
    function read() {
      const wn = $('#wn', form), bn = $('#bn', form), af = $('#af', form), yn = $('#yn', form);
      if (s.mode === 'friend' && wn) { s.white = (wn.value.trim() || 'White'); s.black = (bn.value.trim() || 'Black'); s.autoFlip = af.checked; }
      else if (yn) s.you = yn.value.trim() || 'You';
    }
    $$('.mode', view).forEach((m) => (m.onclick = () => { read(); s.mode = m.dataset.m; draw(); }));
    $('#go', view).onclick = () => {
      read();
      prefs.setup = Object.assign({}, s);
      savePrefs();
      startGame(s);
    };
    draw();
  }

  function startGame(s) {
    let game;
    if (s.mode === 'friend') {
      const tc = parseTc(s.tc);
      game = { mode: 'friend', names: { w: s.white, b: s.black }, tc, clocks: tc ? { w: tc.base, b: tc.base } : null, autoFlip: !!s.autoFlip };
    } else {
      const userColor = s.color === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : s.color;
      const lvl = Engine.LEVELS[s.level] ? s.level : 1;
      const you = s.you || 'You';
      const cpu = 'Coach · ' + Engine.LEVELS[lvl].name;
      game = { mode: 'cpu', userColor, level: lvl, names: userColor === 'w' ? { w: you, b: cpu } : { w: cpu, b: you }, tc: null, clocks: null };
    }
    Object.assign(game, { moves: [], result: null, date: fmtDay(new Date()) });
    Store.set('game', game);
    if (location.hash === '#play') route(); else location.hash = '#play';
  }

  /* ---------------- Play: game ---------------- */
  const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  function fmtClock(ms) {
    ms = Math.max(0, ms);
    if (ms < 10000) return (ms / 1000).toFixed(1);
    const s = Math.ceil(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function viewGame(view) {
    const game = Store.get('game', null);
    if (!game) { viewSetup(view); return; }
    const chess = new Chess();
    for (const u of game.moves) { if (!chess.move(u)) break; }
    let viewIndex = null; // null = live
    let thinking = false, thinkToken = 0;
    let manualFlip = false;
    let lastTick = performance.now();
    let endShown = !!game.result;

    view.innerHTML = `<div class="trainer game">
      <div class="board-col">
        <div class="player-bar" data-pos="top"></div>
        <div class="board-frame"><div class="bd"></div></div>
        <div class="player-bar" data-pos="bottom"></div>
      </div>
      <div class="panel">
        <div class="row spread" style="align-items:center"><span class="pill gold">${game.mode === 'friend' ? '👥 Pass & play' : '🤖 vs ' + esc(Engine.LEVELS[game.level].name) + ' coach'}</span>${game.tc ? `<span class="pill">⏱ ${esc(game.tc.id)}</span>` : ''}</div>
        <div class="status"></div>
        <div class="viewing" style="display:none"></div>
        <div class="moves"></div>
        <div class="grid-btns">
          <button class="btn small" data-a="undo">↶ Undo</button>
          <button class="btn small" data-a="flip">⇅ Flip</button>
          <button class="btn small" data-a="hint">💡 Hint</button>
          <button class="btn small" data-a="draw">½ Draw</button>
          <button class="btn small" data-a="resign">⚑ Resign</button>
          <button class="btn small" data-a="pgn">⧉ PGN</button>
        </div>
        ${game.mode === 'friend' ? `<label class="toggle"><input type="checkbox" id="af" ${game.autoFlip ? 'checked' : ''}> Auto-flip board each turn</label>` : ''}
        <div class="row spread"><a class="btn" href="#play-new">＋ New game</a><button class="btn primary" data-a="rematch" style="display:none">⟳ Rematch</button></div>
      </div></div>`;
    const panel = $('.panel', view);
    const board = new Board($('.bd', view), {
      movable: (c) => !game.result && viewIndex === null && !thinking && (game.mode === 'friend' || c === game.userColor),
      onMove: (mv) => {
        const m = chess.move(mv);
        if (m) afterMove(m);
      },
    });

    function baseOrientation() {
      let o = game.mode === 'cpu' ? game.userColor : game.autoFlip ? chess.turn : 'w';
      return manualFlip ? other(o) : o;
    }
    function lastMove() { const h = chess.history(); return h[h.length - 1] || null; }
    function save() { Store.set('game', game); }

    function material() {
      const start = { p: 8, n: 2, b: 2, r: 2, q: 1 };
      const cnt = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
      let score = 0;
      for (const p of chess.board) {
        if (!p) continue;
        const t = p.toLowerCase(), c = p < 'a' ? 'w' : 'b';
        if (t !== 'k') { cnt[c][t]++; score += (c === 'w' ? 1 : -1) * VALUES[t]; }
      }
      const captured = { w: '', b: '' }; // pieces captured BY color
      for (const c of ['w', 'b']) {
        const opp = other(c);
        for (const t of ['q', 'r', 'b', 'n', 'p']) {
          const missing = Math.max(0, start[t] - cnt[opp][t]);
          for (let i = 0; i < missing; i++) captured[c] += Board.pieceSpan(opp === 'w' ? t.toUpperCase() : t);
        }
      }
      return { captured, score };
    }

    function renderBars() {
      const o = board.orientation;
      const mat = material();
      for (const bar of $$('.player-bar', view)) {
        const c = bar.dataset.pos === 'bottom' ? o : other(o);
        const adv = c === 'w' ? mat.score : -mat.score;
        const running = !game.result && chess.turn === c;
        const clock = game.clocks ? `<span class="clock ${running && game.moves.length ? 'run' : ''} ${game.clocks[c] < 20000 ? 'low' : ''}" data-c="${c}">${fmtClock(game.clocks[c])}</span>` : '';
        bar.className = 'player-bar' + (running ? ' active' : '');
        bar.innerHTML = `<span class="dot ${c}"></span><span class="name">${esc(game.names[c])}</span><span class="caps">${mat.captured[c]}${adv > 0 ? `<b>+${adv}</b>` : ''}</span>${clock}`;
      }
    }

    function resultText() {
      const r = game.result;
      if (!r) return '';
      if (r.winner) return `${esc(game.names[r.winner])} wins · ${r.reason}`;
      return `Draw · ${r.reason}`;
    }

    function renderStatus() {
      const st = $('.status', panel);
      if (game.result) st.innerHTML = (game.result.winner ? '🏆 ' : '🤝 ') + resultText();
      else if (thinking) st.innerHTML = '🤔 Coach is thinking…';
      else {
        const name = esc(game.names[chess.turn]);
        st.innerHTML = `${chess.turn === 'w' ? '⚪' : '⚫'} ${colorName(chess.turn)} to move${game.mode === 'friend' ? ` — ${name}` : chess.turn === game.userColor ? ' — your turn' : ''}${chess.inCheck() ? ' · <span style="color:var(--bad)">Check!</span>' : ''}`;
      }
      $('[data-a="rematch"]', panel).style.display = game.result ? '' : 'none';
      $('[data-a="resign"]', panel).disabled = !!game.result || !game.moves.length;
      $('[data-a="draw"]', panel).disabled = !!game.result || game.moves.length < 2;
      $('[data-a="undo"]', panel).disabled = !game.moves.length || (game.mode === 'cpu' && !chess.history().some((m) => m.color === game.userColor));
      $('[data-a="hint"]', panel).disabled = !!game.result;
    }

    function renderMoves() {
      const h = chess.history();
      const box = $('.moves', panel);
      if (!h.length) { box.innerHTML = '<div class="empty">No moves yet. White starts!</div>'; return; }
      let html = '<table>';
      for (let i = 0; i < h.length; i += 2) {
        const cur = (k) => (viewIndex === null ? k === h.length - 1 : k === viewIndex) ? ' cur' : '';
        html += `<tr><td class="n">${i / 2 + 1}.</td><td class="m${cur(i)}" data-k="${i}">${esc(h[i].san)}</td><td class="m${h[i + 1] ? cur(i + 1) : ''}" data-k="${h[i + 1] ? i + 1 : ''}">${h[i + 1] ? esc(h[i + 1].san) : ''}</td></tr>`;
      }
      box.innerHTML = html + '</table>';
      $$('td.m[data-k]', box).forEach((td) => { if (td.dataset.k !== '') td.onclick = () => viewAt(+td.dataset.k); });
      if (viewIndex === null) box.scrollTop = box.scrollHeight;
    }

    function renderAll() { renderBars(); renderStatus(); renderMoves(); }

    function viewAt(k) {
      const h = chess.history();
      if (k >= h.length - 1) { viewIndex = null; board.setPosition(chess, lastMove(), { animate: false }); $('.viewing', panel).style.display = 'none'; renderAll(); return; }
      viewIndex = Math.max(-1, k);
      const tmp = new Chess();
      for (let i = 0; i <= viewIndex; i++) tmp.move(h[i].uci);
      board.setPosition(tmp, viewIndex >= 0 ? h[viewIndex] : null, { animate: false });
      const v = $('.viewing', panel);
      v.style.display = '';
      v.innerHTML = `<span>👁 Reviewing ${viewIndex < 0 ? 'start position' : 'move ' + (Math.floor(viewIndex / 2) + 1) + (viewIndex % 2 ? '…' : '.') + ' ' + esc(h[viewIndex].san)}</span><button class="btn small" id="live">Back to game ▶</button>`;
      $('#live', v).onclick = () => viewAt(Infinity);
      renderMoves();
    }

    function checkEnd() {
      if (game.result) return;
      let r = null;
      if (chess.isCheckmate()) r = { winner: other(chess.turn), reason: 'checkmate' };
      else if (chess.isStalemate()) r = { winner: null, reason: 'stalemate' };
      else if (chess.isInsufficientMaterial()) r = { winner: null, reason: 'insufficient material' };
      else if (chess.isThreefold()) r = { winner: null, reason: 'threefold repetition' };
      else if (chess.isFiftyMove()) r = { winner: null, reason: '50-move rule' };
      if (r) endGame(r);
    }

    function endGame(r) {
      game.result = r;
      thinkToken++;
      thinking = false;
      save();
      renderAll();
      board.render();
      Sound.end();
      if (!endShown) {
        endShown = true;
        const userWon = game.mode === 'cpu' && r.winner === game.userColor;
        if (game.mode === 'friend' ? !!r.winner : userWon) confetti();
        setTimeout(() => modal({
          icon: r.winner ? (game.mode === 'cpu' && !userWon ? '♞' : '🏆') : '🤝',
          title: r.winner ? `${esc(game.names[r.winner])} wins!` : 'Draw',
          body: `By ${r.reason}.` + (game.mode === 'cpu' && !userWon && r.winner ? ' Use the move list to review where it went wrong.' : ''),
          buttons: [{ label: 'Review', onClick: () => {} }, { label: '⟳ Rematch', cls: 'primary', onClick: rematch }],
        }), 500);
      }
    }

    function afterMove(m) {
      game.moves.push(m.uci);
      if (game.clocks && game.moves.length > 1) game.clocks[m.color] += game.tc.inc;
      lastTick = performance.now();
      board.setPosition(chess, m);
      moveSound(m, chess);
      checkEnd();
      save();
      renderAll();
      if (game.result) return;
      if (game.mode === 'friend' && game.autoFlip) {
        setTimeout(() => { if (viewIndex === null) { board.setOrientation(baseOrientation()); renderBars(); } }, 420);
      }
      if (game.mode === 'cpu' && chess.turn !== game.userColor) cpuMove();
    }

    function cpuMove() {
      thinking = true;
      const token = ++thinkToken;
      renderStatus();
      setTimeout(() => {
        if (token !== thinkToken) return;
        const t0 = performance.now();
        const r = Engine.bestMove(chess, Engine.LEVELS[game.level]);
        const wait = Math.max(0, 500 - (performance.now() - t0));
        setTimeout(() => {
          if (token !== thinkToken || !r) return;
          thinking = false;
          if (viewIndex !== null) viewAt(Infinity);
          const m = chess.move(r.uci);
          if (m) afterMove(m);
        }, wait);
      }, 80);
    }

    function undo() {
      if (!game.moves.length) return;
      thinkToken++;
      thinking = false;
      if (viewIndex !== null) viewAt(Infinity);
      const undoOne = () => { const m = chess.undo(); if (m) game.moves.pop(); return m; };
      let m = undoOne();
      if (game.mode === 'cpu') { while (game.moves.length && chess.turn !== game.userColor) m = undoOne(); }
      game.result = null;
      endShown = false;
      lastTick = performance.now();
      save();
      board.setPosition(chess, lastMove(), { animMove: m, reverse: true });
      if (game.mode === 'friend' && game.autoFlip) board.setOrientation(baseOrientation());
      renderAll();
      if (game.mode === 'cpu' && chess.turn !== game.userColor) cpuMove();
    }

    function rematch() {
      const g = { mode: game.mode, tc: game.tc, clocks: game.tc ? { w: game.tc.base, b: game.tc.base } : null, autoFlip: game.autoFlip, level: game.level, moves: [], result: null, date: fmtDay(new Date()) };
      if (game.mode === 'friend') g.names = { w: game.names.b, b: game.names.w };
      else { g.userColor = other(game.userColor); g.names = { w: game.names.b, b: game.names.w }; }
      Store.set('game', g);
      route();
    }

    function pgn() {
      const res = !game.result ? '*' : !game.result.winner ? '1/2-1/2' : game.result.winner === 'w' ? '1-0' : '0-1';
      const h = chess.history();
      let body = '';
      h.forEach((m, i) => { if (i % 2 === 0) body += (i / 2 + 1) + '. '; body += m.san + ' '; });
      return `[Event "Outpost ${game.mode === 'friend' ? 'pass & play' : 'game vs coach'}"]\n[Site "Outpost"]\n[Date "${(game.date || fmtDay(new Date())).replace(/-/g, '.')}"]\n[White "${game.names.w}"]\n[Black "${game.names.b}"]\n[Result "${res}"]\n\n${body}${res}\n`;
    }

    function act(a) {
      if (a === 'undo') undo();
      else if (a === 'flip') { manualFlip = !manualFlip; board.setOrientation(baseOrientation()); renderBars(); }
      else if (a === 'hint') {
        if (game.result) return;
        const st = $('.status', panel);
        st.innerHTML = '💡 Coach is looking…';
        setTimeout(() => {
          const r = Engine.bestMove(chess, { depth: 4, timeMs: 1200 });
          renderStatus();
          if (r) { if (viewIndex !== null) viewAt(Infinity); board.annotate({ arrows: [[r.uci.slice(0, 2), r.uci.slice(2, 4), 'b']] }); toast('Coach suggests the blue arrow'); }
        }, 40);
      } else if (a === 'draw') {
        if (game.mode === 'friend') {
          modal({ icon: '🤝', title: 'Agree to a draw?', body: 'Both players accept a draw.', buttons: [{ label: 'Keep playing' }, { label: 'Agree draw', cls: 'primary', onClick: () => endGame({ winner: null, reason: 'agreement' }) }] });
        } else {
          const r = Engine.bestMove(chess, { depth: 2, timeMs: 400 });
          const cpuColor = other(game.userColor);
          const cpuScore = r ? (chess.turn === cpuColor ? r.score : -r.score) : 0;
          if (cpuScore < -120 || (game.moves.length > 60 && Math.abs(cpuScore) < 50)) endGame({ winner: null, reason: 'agreement' });
          else toast('The coach declines the draw — play on!');
        }
      } else if (a === 'resign') {
        const loser = game.mode === 'cpu' ? game.userColor : chess.turn;
        modal({ icon: '⚑', title: `Resign as ${esc(game.names[loser])}?`, body: game.mode === 'friend' ? `${colorName(loser)} (the player to move) resigns the game.` : 'The coach wins this one.', buttons: [{ label: 'Cancel' }, { label: 'Resign', cls: 'primary', onClick: () => endGame({ winner: other(loser), reason: 'resignation' }) }] });
      } else if (a === 'pgn') {
        const text = pgn();
        (navigator.clipboard && navigator.clipboard.writeText(text).then(() => toast('PGN copied to clipboard'), () => prompt('Copy PGN:', text))) || prompt('Copy PGN:', text);
      } else if (a === 'rematch') rematch();
    }
    $$('[data-a]', panel).forEach((b) => (b.onclick = () => act(b.dataset.a)));
    const af = $('#af', panel);
    if (af) af.onchange = () => { game.autoFlip = af.checked; save(); board.setOrientation(baseOrientation()); renderBars(); };

    // Clock
    const timer = setInterval(() => {
      const nowT = performance.now();
      const dt = nowT - lastTick;
      lastTick = nowT;
      if (!game.clocks || game.result || !game.moves.length) return;
      const c = chess.turn;
      game.clocks[c] -= dt;
      if (game.clocks[c] <= 0) {
        game.clocks[c] = 0;
        const opp = other(c);
        endGame(chess.hasMatingMaterial(opp) ? { winner: opp, reason: 'timeout' } : { winner: null, reason: 'timeout vs insufficient material' });
        return;
      }
      const el = $(`.clock[data-c="${c}"]`, view);
      if (el) { el.textContent = fmtClock(game.clocks[c]); el.classList.toggle('low', game.clocks[c] < 20000); }
    }, 100);
    const persist = () => save();
    window.addEventListener('pagehide', persist);
    const saver = setInterval(() => { if (game.clocks && !game.result) save(); }, 3000);

    const onKey = (e) => {
      if (e.target.closest('input')) return;
      const n = chess.history().length;
      if (e.key === 'ArrowLeft') { e.preventDefault(); viewAt((viewIndex === null ? n - 1 : viewIndex) - 1); }
      if (e.key === 'ArrowRight' && viewIndex !== null) { e.preventDefault(); viewAt(viewIndex + 1); }
    };
    document.addEventListener('keydown', onKey);

    board.orientation = baseOrientation();
    board.setPosition(chess, lastMove(), { animate: false });
    renderAll();
    if (game.mode === 'cpu' && !game.result && chess.turn !== game.userColor) cpuMove();

    return () => {
      thinkToken++;
      clearInterval(timer);
      clearInterval(saver);
      save();
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('keydown', onKey);
    };
  }

  /* ---------------- Boot ---------------- */
  window.Outpost = { Store, Sound, moveSound, toast, modal, confetti, esc, praise, markActive };
  applyPrefs();
  window.addEventListener('hashchange', route);
  route();
})();
