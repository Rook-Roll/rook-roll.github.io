/* Rook & Roll extras: Daily Puzzle, Puzzle Rush, Trophies (rank + achievements), post-game review, visitor counter.
   Loaded before app.js; everything here reads window.App lazily, at call time. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const A = () => window.App;
  const SITE = 'rook-roll.github.io';
  const LAUNCH = Date.UTC(2026, 10, 21); // Daily Puzzle #1 = 21 November 2026
  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const MATE = 100000;

  function stats() {
    const p = A().progress;
    const d = { games: 0, friendGames: 0, cpuWins: 0, strongWins: 0, mateWins: 0, rushBest: 0, rushRuns: 0, rushTotal: 0, reviews: 0, bestAccuracy: 0 };
    p.stats = p.stats || {};
    for (const k in d) if (typeof p.stats[k] !== 'number') p.stats[k] = d[k];
    p.daily = p.daily || {};
    p.ach = p.ach || {};
    return p.stats;
  }
  const pad = (n) => String(n).padStart(2, '0');
  const fmtMs = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + pad(s % 60); };

  /* ---------------- Sharing ---------------- */
  async function share(text) {
    const { toast, modal, esc } = A();
    const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (navigator.share && touch) {
      try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied! Paste it in a chat, story or comment 📋', 3000);
    } catch (e) {
      modal({ icon: '📋', title: 'Copy your result', body: `<textarea class="share-text" readonly rows="5">${esc(text)}</textarea>`, buttons: [{ label: 'Done', cls: 'primary' }] });
      const ta = $('.share-text'); if (ta) { ta.focus(); ta.select(); }
    }
  }

  /* =====================================================================
     DAILY PUZZLE — same puzzle for everyone each day, streak, shareable result
     ===================================================================== */
  const DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAY_LEVEL = ['Advanced', 'Beginner', 'Beginner', 'Intermediate', 'Intermediate', 'Intermediate', 'Advanced'];
  function dayNumber(d = new Date()) { return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - LAUNCH) / 86400000) + 1; }
  function dailyInfo(d = new Date()) {
    const n = dayNumber(d);
    const level = DAY_LEVEL[d.getDay()];
    const pool = PUZZLES.filter((p) => p.level === level);
    const idx = (((n * 7919 + 13) % pool.length) + pool.length) % pool.length;
    return { n, level, weekday: DAY_NAME[d.getDay()], puzzle: pool[idx] };
  }
  function dailyRec(n) { stats(); return A().progress.daily[n] || null; }
  function dailyStreak() {
    stats();
    const D = A().progress.daily;
    let n = dayNumber();
    if (!(D[n] && D[n].solved)) n--;
    let k = 0;
    while (D[n] && D[n].solved) { k++; n--; }
    return k;
  }
  function bestDailyStreak() {
    stats();
    const days = Object.keys(A().progress.daily).map(Number).filter((n) => A().progress.daily[n].solved).sort((a, b) => a - b);
    let best = 0, run = 0, prev = null;
    for (const n of days) { run = prev !== null && n === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = n; }
    return best;
  }
  const SEQ_EMOJI = { x: '🟥', h: '💡', o: '🟩', g: '🏳️' };
  function dailyShareText(info, rec) {
    const { LEVEL_ICON } = A();
    const wrong = rec.seq.filter((c) => c === 'x').length;
    const line = rec.solved ? (wrong === 0 && !rec.seq.includes('h') ? 'First try! 🤘' : `Solved in ${wrong + 1} tries`) : 'Gave up 😵';
    const streak = dailyStreak();
    return `Rook & Roll Daily #${info.n} ♟️ ${LEVEL_ICON[info.level]} ${info.level}\n${rec.seq.map((c) => SEQ_EMOJI[c]).join('')} ${line}${rec.ms ? ' · ⏱ ' + fmtMs(rec.ms) : ''}\n${streak ? `🔥 ${streak}-day streak\n` : ''}${SITE}/#daily`;
  }

  function viewDaily(view) {
    const { esc, progress, saveProgress, Exercise, trainerLayout, coachBubble, setMood, LEVEL_ICON, colorName, Sound, confetti, markActive } = A();
    stats();
    const info = dailyInfo();
    const pz = info.puzzle;
    const side = pz.fen.split(' ')[1];
    const goal = pz.mate ? `Find checkmate in ${pz.mate}.` : 'Find the best move.';
    let rec = progress.daily[info.n];
    if (!rec) { rec = progress.daily[info.n] = { seq: [], start: Date.now(), solved: false, done: false }; saveProgress(); }
    let practice = rec.done;
    const board = trainerLayout(view, `
      <div class="crumbs"><a href="#puzzles">Jam Session</a> / Daily Puzzle</div>
      <div class="row" style="align-items:center"><span class="pill gold">📅 Daily #${info.n}</span><span class="pill">${LEVEL_ICON[info.level]} ${info.weekday} · ${info.level}</span><span class="pill dstreak" title="Daily streak">🔥 ${dailyStreak()}</span></div>
      <h2 style="margin:0">${esc(pz.title)}</h2>
      ${coachBubble(`<b>${colorName(side)} to move.</b> ${goal} Everyone on Rook & Roll gets this same puzzle today — fewer tries = better score.`, 'smirk')}
      <div class="tries" aria-label="Your attempts"></div>
      <div class="feedback info"></div>
      <div class="row"><button class="btn small" data-a="hint">💡 Hint</button><button class="btn small" data-a="give">🏳️ Give up</button><button class="btn small" data-a="retry" style="display:none">↺ Replay</button></div>
      <div class="daily-result" style="display:none"></div>
      <div class="muted" style="font-size:13px">New puzzle every midnight · Mon–Tue 🌱 Beginner · Wed–Fri 🔥 Intermediate · Sat–Sun 👑 Advanced</div>`);
    const panel = $('.panel', view);
    const fb = (kind, html) => { const f = $('.feedback', panel); f.className = 'feedback ' + kind; f.innerHTML = html; };
    let ex = null, cd = null;

    function drawTries() {
      const cells = rec.seq.map((c) => `<span class="try t-${c}">${SEQ_EMOJI[c]}</span>`).join('');
      $('.tries', panel).innerHTML = cells || '<span class="muted" style="font-size:14px">Your attempts show up here: 🟥 wrong · 💡 hint · 🟩 solved</span>';
    }
    function save() { saveProgress(); drawTries(); }
    function finish(solved) {
      rec.done = true;
      rec.solved = solved;
      rec.ms = Date.now() - (rec.start || Date.now());
      rec.seq.push(solved ? 'o' : 'g');
      if (solved) {
        const clean = rec.seq.length === 1;
        progress.puzzles[pz.id] = Object.assign(progress.puzzles[pz.id] || {}, { solved: true, clean: clean || !!(progress.puzzles[pz.id] && progress.puzzles[pz.id].clean) });
      }
      markActive();
      save();
      practice = true;
      showResult(true);
      $('.dstreak', panel).textContent = '🔥 ' + dailyStreak();
      check();
    }
    function showResult(fresh) {
      const box = $('.daily-result', panel);
      const wrong = rec.seq.filter((c) => c === 'x').length;
      const title = rec.solved ? (wrong === 0 && !rec.seq.includes('h') ? 'First try! 🤘' : `Solved in ${wrong + 1} tries`) : 'Gave up — the answer is on the board';
      const streak = dailyStreak();
      box.style.display = '';
      box.innerHTML = `
        <div class="big-tries">${rec.seq.map((c) => SEQ_EMOJI[c]).join('')}</div>
        <h3 style="margin:6px 0 2px">${title}</h3>
        <div class="muted">${rec.ms ? '⏱ ' + fmtMs(rec.ms) + ' · ' : ''}🔥 Daily streak: <b>${streak}</b> · best ${Math.max(streak, bestDailyStreak())}</div>
        <div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" data-s="share">📤 Share result</button><a class="btn" href="#rush">⚡ Puzzle Rush</a></div>
        <div class="muted" style="margin-top:10px">Next Daily Puzzle in <b class="cd">--:--:--</b></div>`;
      $('[data-s="share"]', box).onclick = () => share(dailyShareText(info, rec));
      $('[data-a="hint"]', panel).style.display = 'none';
      $('[data-a="give"]', panel).style.display = 'none';
      $('[data-a="retry"]', panel).style.display = '';
      const tick = () => {
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const s = Math.max(0, Math.floor((next - now) / 1000));
        const el = $('.cd', box);
        if (el) el.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
        if (s === 0) { clearInterval(cd); setTimeout(() => { if (location.hash === '#daily') window.dispatchEvent(new HashChangeEvent('hashchange')); }, 1500); }
      };
      clearInterval(cd);
      tick();
      cd = setInterval(tick, 1000);
      if (fresh && rec.solved) { setMood(panel, 'cheer'); }
    }

    function start() {
      if (ex) ex.stop();
      ex = new Exercise({
        board, fen: pz.fen, solution: pz.solution, mate: pz.mate,
        onSolved() {
          Sound.good();
          const line = Coach.line('solved');
          setMood(panel, 'cheer');
          fb('good', '✓ ' + line);
          if (Coach.chatty(2)) Coach.speak(line);
          if (!practice) { const clean = rec.seq.length === 0; finish(true); if (clean) confetti(); }
        },
        onWrong() {
          const line = Coach.line('wrong');
          setMood(panel, 'sad');
          fb('bad', '✗ ' + line + ' Try again.');
          if (Coach.chatty(2)) Coach.speak(line);
          if (!practice) { rec.seq.push('x'); save(); }
        },
        onStatus(kind) {
          if (kind === 'reply') { setMood(panel, 'smirk'); fb('info', `<span class="side ${side}"></span>Good — keep going!`); }
          if (kind === 'progress') fb('info', 'Correct! Opponent is replying…');
        },
      });
      ex.start();
      fb('info', practice ? '↺ Practice replay — your result is already saved.' : `<span class="side ${side}"></span>${colorName(side)} to move.`);
    }
    function hint() {
      const l = ex && ex.hint();
      if (!l) return 0;
      if (!practice) { rec.seq.push('h'); save(); }
      setMood(panel, 'think');
      fb('info', l === 1 ? '💡 Move the highlighted piece.' : '💡 Play the arrow move.');
      return l;
    }
    $$('[data-a]', panel).forEach((b) => (b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'hint') hint();
      if (a === 'give') {
        A().modal({ icon: '🏳️', title: 'Give up today\'s puzzle?', body: 'Your daily streak resets, and Rocco shows you the answer.', buttons: [{ label: 'Keep trying' }, { label: 'Show answer', cls: 'primary', onClick: () => { fb('info', '👁 Watch the solution…'); ex.showSolution(() => fb('info', 'That\'s the answer. Come back tomorrow for a new one!')); finish(false); } }] });
      }
      if (a === 'retry') { setMood(panel, 'smirk'); start(); }
    }));
    Coach.setContext({
      chess: () => (ex ? ex.chess : null), userColor: side,
      hint: () => (hint() ? 'Hint used — it shows as 💡 in your result. Move the highlighted piece!' : 'You\'ve already finished today\'s puzzle — share your result!'),
    });
    drawTries();
    start();
    if (rec.done) showResult(false);
    return () => { if (ex) ex.stop(); clearInterval(cd); };
  }

  function dailyCard() {
    const { esc, colorName, LEVEL_ICON } = A();
    const info = dailyInfo();
    const rec = dailyRec(info.n);
    const pz = info.puzzle;
    const side = pz.fen.split(' ')[1];
    const streak = dailyStreak();
    const state = rec && rec.done ? (rec.solved ? `<span class="pill green">✓ Solved ${rec.seq.map((c) => SEQ_EMOJI[c]).join('')}</span>` : '<span class="pill">Answer revealed</span>') : '<span class="pill gold">📅 Daily Puzzle</span>';
    return `<div class="card potd" data-go="#daily" style="cursor:pointer">
      <div>${Board.miniBoard(pz.fen, side)}</div>
      <div>
        ${state}
        <h3 style="margin:10px 0 4px">Daily #${info.n}: ${esc(pz.title)}</h3>
        <div class="muted" style="margin-bottom:12px">${colorName(side)} to move · ${LEVEL_ICON[info.level]} ${info.weekday} is ${info.level} day · 🔥 streak ${streak}</div>
        <a class="btn primary small" href="#daily">${rec && rec.done ? '📤 See & share result' : 'Solve it'}</a>
      </div>
    </div>`;
  }

  /* =====================================================================
     PUZZLE RUSH — 3 minutes, 3 strikes, puzzles get harder
     ===================================================================== */
  const RUSH_MS = 180000, RUSH_STRIKES = 3;
  function viewRush(view) {
    const { esc, Exercise, Sound, confetti, saveProgress, markActive, modal, colorName, roccoIcon } = A();
    const st = stats();
    let state = 'idle', ex = null, score = 0, strikes = 0, k = 0, endAt = 0, timer = null, pending = null, results = [], used = new Set(), current = null;
    view.innerHTML = `<div class="trainer game">
      <div class="board-col"><div class="prush-bar"></div><div class="board-frame"><div class="bd"></div></div></div>
      <div class="panel"></div></div>`;
    const board = new Board($('.bd', view));
    board.setPosition(new Chess(START_FEN), null);
    const panel = $('.panel', view);
    const bar = $('.prush-bar', view);

    function drawBar() {
      const left = state === 'run' ? endAt - performance.now() : state === 'idle' ? RUSH_MS : 0;
      bar.className = 'prush-bar' + (state === 'run' && left < 20000 ? ' low' : '');
      bar.innerHTML = `<span>⏱ <b>${fmtMs(left)}</b></span><span>✅ <b>${score}</b></span><span class="strikes">${Array.from({ length: RUSH_STRIKES }, (_, i) => `<i class="${i < strikes ? 'on' : ''}">✕</i>`).join('')}</span>`;
    }
    function drawPanel() {
      const best = st.rushBest || 0;
      const res = `<div class="rush-results">${results.map((r) => `<i class="${r ? 'ok' : 'no'}"></i>`).join('')}</div>`;
      if (state === 'idle') {
        panel.innerHTML = `
          <div class="crumbs"><a href="#puzzles">Jam Session</a> / Puzzle Rush</div>
          <h2 style="margin:0">⚡ Puzzle Rush</h2>
          <div class="coach"><div class="avatar">${Coach.svg('cheer')}</div><div class="bubble"><span class="who">Rocco</span><span class="lesson-text">Solve as many puzzles as you can in <b>3 minutes</b>. They start easy and get harder. <b>3 wrong moves</b> and the show's over — no hints, no take-backs!</span></div></div>
          <div class="row spread" style="align-items:center"><span class="muted">🏅 Your best: <b>${best}</b>${st.rushRuns ? ` · ${st.rushRuns} run${st.rushRuns === 1 ? '' : 's'}` : ''}</span></div>
          <button class="btn primary" data-a="go" style="font-size:18px">▶ Start the rush</button>`;
      } else if (state === 'run') {
        const side = current.fen.split(' ')[1];
        panel.innerHTML = `
          <div class="row spread" style="align-items:center"><h2 style="margin:0">⚡ Puzzle Rush</h2><span class="pill">#${k} · ★ ${current.rating}</span></div>
          <div class="rush-score">${score}<small> solved</small></div>
          <div class="feedback info"><span class="side ${side}"></span>${colorName(side)} to move${current.mate ? ` — mate in ${current.mate}` : ' — find the best move'}</div>
          ${res}
          <div class="row end"><button class="btn small ghost" data-a="stop">■ End run</button></div>`;
      } else {
        const isBest = score > 0 && score >= best && st.rushLastBest;
        panel.innerHTML = `
          <div class="crumbs"><a href="#puzzles">Jam Session</a> / Puzzle Rush</div>
          <h2 style="margin:0">${isBest ? '🏆 New personal best!' : '⚡ Rush over'}</h2>
          <div class="rush-score">${score}<small> solved</small></div>
          ${res}
          <div class="muted">🏅 Best: <b>${best}</b> · Highest puzzle reached: ★ ${current ? current.rating : '—'}</div>
          <div class="row"><button class="btn primary" data-a="share">📤 Share score</button><button class="btn" data-a="go">⟳ Play again</button></div>`;
      }
      $$('[data-a]', panel).forEach((b) => (b.onclick = () => act(b.dataset.a)));
    }
    function pick() {
      const target = 400 + k * 45;
      const pool = PUZZLES.filter((p) => !used.has(p.id));
      pool.sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target));
      return pool[Math.floor(Math.random() * Math.min(6, pool.length))];
    }
    function next() {
      if (state !== 'run') return;
      current = pick();
      if (!current) return end();
      used.add(current.id);
      k++;
      if (ex) ex.stop();
      ex = new Exercise({
        board, fen: current.fen, solution: current.solution, mate: current.mate, noUndo: true,
        onSolved() {
          if (state !== 'run') return;
          score++; results.push(1); Sound.good();
          drawBar(); drawPanel();
          const fbx = $('.feedback', panel); if (fbx) { fbx.className = 'feedback good'; fbx.textContent = '✓ ' + Coach.line('solved'); }
          pending = setTimeout(next, 450);
        },
        onWrong(m) {
          if (state !== 'run') return;
          strikes++; results.push(0);
          board.flash(m.to, 'bad');
          drawBar(); drawPanel();
          const fbx = $('.feedback', panel); if (fbx) { fbx.className = 'feedback bad'; fbx.textContent = '✗ Strike ' + strikes + '!'; }
          pending = setTimeout(strikes >= RUSH_STRIKES ? end : next, 750);
        },
      });
      ex.start();
      drawPanel();
    }
    function begin() {
      clearTimeout(pending); clearInterval(timer);
      state = 'run'; score = 0; strikes = 0; k = 0; results = []; used = new Set(); current = null;
      st.rushLastBest = false;
      endAt = performance.now() + RUSH_MS;
      timer = setInterval(() => { if (endAt - performance.now() <= 0) end(); else drawBar(); }, 200);
      next();
      drawBar();
    }
    function end() {
      if (state !== 'run') return;
      state = 'over';
      clearInterval(timer); clearTimeout(pending);
      if (ex) ex.stop();
      const prevBest = st.rushBest || 0;
      st.rushRuns++; st.rushTotal += score;
      st.rushLastBest = score > prevBest;
      if (score > prevBest) st.rushBest = score;
      markActive();
      saveProgress();
      drawBar(); drawPanel();
      Sound.end();
      if (st.rushLastBest) confetti();
      const line = score >= 25 ? 'Face-melting! That was a guitar solo of tactics! 🔥' : score >= 15 ? 'Shredding! The crowd is on its feet! 🤘' : score >= 8 ? 'Nice set! Keep rushing and those numbers climb.' : 'Warm-up done. Run it back — speed comes with reps!';
      if (Coach.chatty(2)) Coach.speak(line);
      setTimeout(() => modal({
        icon: roccoIcon(st.rushLastBest ? 'cheer' : 'smirk'),
        title: `${score} puzzle${score === 1 ? '' : 's'} solved!`,
        body: `${st.rushLastBest ? '<b>New personal best!</b> ' : `Your best: <b>${st.rushBest}</b>. `}${esc(line)}`,
        buttons: [{ label: '📤 Share', onClick: () => act('share') }, { label: '⟳ Again', cls: 'primary', onClick: begin }],
      }), 400);
      check();
    }
    function act(a) {
      if (a === 'go') begin();
      if (a === 'stop') modal({ icon: '■', title: 'End this run?', body: 'Your score so far still counts.', buttons: [{ label: 'Keep going' }, { label: 'End run', cls: 'primary', onClick: end }] });
      if (a === 'share') share(`⚡ I solved ${score} chess puzzle${score === 1 ? '' : 's'} in 3 minutes on Rook & Roll Puzzle Rush! Can you beat me? 🎸\n${SITE}/#rush`);
    }
    Coach.setContext({ chess: () => (ex ? ex.chess : null), userColor: 'w', hint: () => 'No hints in Puzzle Rush — trust your ears! 🎸' });
    drawBar(); drawPanel();
    return () => { state = 'gone'; clearInterval(timer); clearTimeout(pending); if (ex) ex.stop(); };
  }

  /* =====================================================================
     TROPHIES — XP, rank, achievements
     ===================================================================== */
  const RANKS = [
    { xp: 0, icon: '🎸', name: 'Garage Band' },
    { xp: 150, icon: '🎤', name: 'Open Mic' },
    { xp: 400, icon: '🎫', name: 'Opening Act' },
    { xp: 900, icon: '🚐', name: 'Touring Band' },
    { xp: 1800, icon: '💿', name: 'Gold Record' },
    { xp: 3000, icon: '🌟', name: 'Headliner' },
    { xp: 4500, icon: '🏟️', name: 'Stadium Star' },
    { xp: 6500, icon: '👑', name: 'Rock Legend' },
  ];
  function snapshot() {
    const { progress, Store } = A();
    const s = stats();
    const recs = Object.entries(progress.puzzles);
    const solvedIds = recs.filter(([, r]) => r.solved).map(([id]) => id);
    const solvedSet = new Set(solvedIds);
    const byTheme = (t) => PUZZLES.filter((p) => solvedSet.has(p.id) && p.themes.includes(t)).length;
    return {
      lessons: Object.keys(progress.lessons).length,
      solved: solvedIds.length,
      clean: recs.filter(([, r]) => r.solved && r.clean).length,
      smothered: byTheme('Smothered mate'),
      mate3: byTheme('Mate in 3'),
      rating: progress.rating,
      dailySolved: Object.values(progress.daily).filter((r) => r.solved).length,
      dailyBest: bestDailyStreak(),
      adaptive: Math.round(progress.adaptive.rating),
      coord: Store.get('best.coord', 0) || 0,
      knight: Store.get('best.knight', null),
      ...s,
    };
  }
  const ACH = [
    { id: 'first-lesson', icon: '🎵', title: 'First Note', desc: 'Finish your first lesson.', v: (s) => s.lessons, goal: 1 },
    { id: 'half-setlist', icon: '📚', title: 'Halfway There', desc: 'Finish 13 lessons.', v: (s) => s.lessons, goal: 13 },
    { id: 'setlist', icon: '🏁', title: 'Encore!', desc: 'Finish every lesson in the Setlist.', v: (s) => s.lessons, goal: () => LESSONS.length },
    { id: 'first-puzzle', icon: '🧩', title: 'First Jam', desc: 'Solve your first puzzle.', v: (s) => s.solved, goal: 1 },
    { id: 'puzzles-25', icon: '🎶', title: 'In the Groove', desc: 'Solve 25 puzzles.', v: (s) => s.solved, goal: 25 },
    { id: 'puzzles-100', icon: '💯', title: 'Century', desc: 'Solve 100 puzzles.', v: (s) => s.solved, goal: 100 },
    { id: 'puzzles-all', icon: '📀', title: 'Complete Discography', desc: 'Solve every puzzle on the site.', v: (s) => s.solved, goal: () => PUZZLES.length },
    { id: 'clean-10', icon: '🎯', title: 'Perfect Pitch', desc: 'Solve 10 puzzles on the first try.', v: (s) => s.clean, goal: 10 },
    { id: 'smothered', icon: '🐴', title: 'Smother Love', desc: 'Solve a smothered-mate puzzle.', v: (s) => s.smothered, goal: 1 },
    { id: 'mate3', icon: '🧠', title: 'Three-Move Maestro', desc: 'Solve 5 mate-in-3 puzzles.', v: (s) => s.mate3, goal: 5 },
    { id: 'rating-1000', icon: '📈', title: 'Four Digits', desc: 'Reach a 1000 puzzle rating.', v: (s) => s.rating, goal: 1000 },
    { id: 'rating-1500', icon: '🚀', title: 'High Notes', desc: 'Reach a 1500 puzzle rating.', v: (s) => s.rating, goal: 1500 },
    { id: 'daily-1', icon: '📅', title: 'Daily Fix', desc: 'Solve a Daily Puzzle.', v: (s) => s.dailySolved, goal: 1 },
    { id: 'daily-3', icon: '🔥', title: 'On Fire', desc: 'Solve the Daily Puzzle 3 days in a row.', v: (s) => s.dailyBest, goal: 3 },
    { id: 'daily-7', icon: '🌋', title: 'Week of Rock', desc: '7-day Daily Puzzle streak.', v: (s) => s.dailyBest, goal: 7 },
    { id: 'daily-30', icon: '🗓️', title: 'Residency', desc: '30-day Daily Puzzle streak.', v: (s) => s.dailyBest, goal: 30 },
    { id: 'rush-10', icon: '⚡', title: 'Speed Demon', desc: 'Score 10 in Puzzle Rush.', v: (s) => s.rushBest, goal: 10 },
    { id: 'rush-20', icon: '🌩️', title: 'Shredder', desc: 'Score 20 in Puzzle Rush.', v: (s) => s.rushBest, goal: 20 },
    { id: 'rush-30', icon: '🔥', title: 'Face Melter', desc: 'Score 30 in Puzzle Rush.', v: (s) => s.rushBest, goal: 30 },
    { id: 'first-game', icon: '♟️', title: 'Opening Night', desc: 'Finish a game of chess.', v: (s) => s.games, goal: 1 },
    { id: 'duet', icon: '👥', title: 'Duet', desc: 'Finish a pass & play game with a friend.', v: (s) => s.friendGames, goal: 1 },
    { id: 'beat-rocco', icon: '🎸', title: 'Beat the Coach', desc: 'Win a game against Rocco.', v: (s) => s.cpuWins, goal: 1 },
    { id: 'final-chord', icon: '☠️', title: 'Final Chord', desc: 'Checkmate Rocco.', v: (s) => s.mateWins, goal: 1 },
    { id: 'giant-slayer', icon: '💪', title: 'Giant Slayer', desc: 'Beat Rocco on Strong.', v: (s) => s.strongWins, goal: 1 },
    { id: 'adaptive-1000', icon: '✨', title: 'Level Up', desc: 'Push Adaptive Rocco to 1000.', v: (s) => s.adaptive, goal: 1000 },
    { id: 'tape', icon: '📼', title: 'Tape Review', desc: 'Review a finished game with Rocco.', v: (s) => s.reviews, goal: 1 },
    { id: 'studio', icon: '🎧', title: 'Studio Quality', desc: 'Play a game (10+ moves) with 90% accuracy.', v: (s) => s.bestAccuracy, goal: 90 },
    { id: 'coord-20', icon: '🗺️', title: 'Map Reader', desc: 'Find 20 squares in Coordinate Rush.', v: (s) => s.coord, goal: 20 },
    { id: 'knight-perfect', icon: '🐎', title: 'Knight Rider', desc: 'Finish Knight Sprint with zero extra jumps.', v: (s) => (s.knight === 0 ? 1 : 0), goal: 1 },
  ];
  const goalOf = (a) => (typeof a.goal === 'function' ? a.goal() : a.goal);
  function xpOf(s, achCount) {
    return s.lessons * 40 + s.solved * 10 + s.clean * 5 + s.dailySolved * 20 + s.rushTotal * 2 + s.games * 10 + s.cpuWins * 30 + s.reviews * 10 + achCount * 25;
  }
  function rankFor(xp) {
    let i = 0;
    while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
    return { i, rank: RANKS[i], next: RANKS[i + 1] || null };
  }
  function standing() {
    stats();
    const s = snapshot();
    const xp = xpOf(s, Object.keys(A().progress.ach).length);
    return Object.assign({ xp, s }, rankFor(xp));
  }

  // Unlock new achievements and celebrate them (banner queue).
  let popQueue = [], popBusy = false;
  function popNext() {
    if (popBusy || !popQueue.length) return;
    popBusy = true;
    const { icon, title, sub } = popQueue.shift();
    const el = document.createElement('a');
    el.className = 'ach-pop';
    el.href = '#trophies';
    el.innerHTML = `<span class="i">${icon}</span><span><small>${sub}</small><b>${A().esc(title)}</b></span>`;
    document.body.appendChild(el);
    A().Sound.good();
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => { el.remove(); popBusy = false; popNext(); }, 3600);
  }
  function check() {
    const { progress, saveProgress } = A();
    stats();
    const before = standing();
    const s = before.s;
    const fresh = [];
    for (const a of ACH) {
      if (progress.ach[a.id]) continue;
      if (a.v(s) >= goalOf(a)) { progress.ach[a.id] = A().fmtDay(new Date()); fresh.push(a); }
    }
    const after = standing();
    const prevRank = progress.rankSeen == null ? after.i : progress.rankSeen;
    if (fresh.length || progress.rankSeen !== after.i) { progress.rankSeen = after.i; saveProgress(); }
    if (fresh.length > 2) popQueue.push({ icon: '🏆', title: `${fresh.length} achievements unlocked!`, sub: 'Tap to see your trophies' });
    else fresh.forEach((a) => popQueue.push({ icon: a.icon, title: a.title, sub: 'Achievement unlocked' }));
    if (after.i > prevRank) popQueue.push({ icon: after.rank.icon, title: after.rank.name, sub: 'Rank up! You are now' });
    popNext();
    const btn = $('#trophyBtn');
    if (btn) btn.title = `${after.rank.name} · ${after.xp} XP`;
  }

  function rankStrip() {
    const st = standing();
    const pct = st.next ? Math.round(((st.xp - st.rank.xp) / (st.next.xp - st.rank.xp)) * 100) : 100;
    const got = Object.keys(A().progress.ach).length;
    return `<a class="rank-strip" href="#trophies">
      <span class="rk-ico">${st.rank.icon}</span>
      <span class="rk-main"><b>${st.rank.name}</b><span class="muted"> · ${st.xp} XP${st.next ? ` · ${st.next.xp - st.xp} XP to ${st.next.icon} ${st.next.name}` : ' · max rank!'}</span>
        <span class="bar"><i style="width:${pct}%"></i></span></span>
      <span class="rk-ach">🏆 ${got}/${ACH.length}<small>See trophies →</small></span>
    </a>`;
  }

  function viewTrophies(view) {
    const { esc, progress } = A();
    check();
    const st = standing();
    const s = st.s;
    const pct = st.next ? Math.round(((st.xp - st.rank.xp) / (st.next.xp - st.rank.xp)) * 100) : 100;
    const got = ACH.filter((a) => progress.ach[a.id]).length;
    const row = (label, n, per) => (n ? `<tr><td>${label}</td><td>${n} × ${per}</td><td><b>${n * per}</b></td></tr>` : '');
    view.innerHTML = `
      <div class="band-head yellow">
        <div><h1>${st.rank.icon} ${st.rank.name}</h1>
          <p>${st.xp} XP${st.next ? ` — ${st.next.xp - st.xp} more to reach <b>${st.next.icon} ${st.next.name}</b>.` : ' — the highest rank there is. Legend!'}</p>
          <div class="xp-bar"><i style="width:${pct}%"></i></div></div>
        <div style="text-align:right"><div class="muted">Achievements</div><div class="rating-big">${got}<small style="font-size:18px"> / ${ACH.length}</small></div></div>
      </div>
      <div class="section-title"><h2>The ranks</h2><span class="muted">Earn XP from lessons, puzzles, daily puzzles, Puzzle Rush, games and achievements.</span></div>
      <div class="ranks">${RANKS.map((r, i) => `<div class="rank ${i < st.i ? 'past' : i === st.i ? 'now' : ''}"><span>${r.icon}</span><b>${r.name}</b><small>${r.xp} XP</small></div>`).join('')}</div>
      <div class="section-title"><h2>Achievements</h2></div>
      <div class="ach-grid">${ACH.map((a) => {
        const done = progress.ach[a.id];
        const goal = goalOf(a);
        const v = Math.min(goal, a.v(s) || 0);
        return `<div class="card ach ${done ? 'got' : ''}"><div class="ico">${a.icon}</div><div><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p>
          ${done ? `<span class="pill green">✓ ${esc(done)}</span>` : goal > 1 ? `<div class="mini-bar"><i style="width:${Math.round((v / goal) * 100)}%"></i></div><small class="muted">${v} / ${goal}</small>` : '<span class="pill">🔒 Locked</span>'}</div></div>`;
      }).join('')}</div>
      <details class="rules" style="margin-top:22px"><summary>How XP is counted</summary><table class="xp-table">
        ${row('Lessons finished', s.lessons, 40)}${row('Puzzles solved', s.solved, 10)}${row('First-try bonus', s.clean, 5)}${row('Daily Puzzles solved', s.dailySolved, 20)}
        ${row('Puzzle Rush puzzles', s.rushTotal, 2)}${row('Games finished', s.games, 10)}${row('Wins vs Rocco', s.cpuWins, 30)}${row('Games reviewed', s.reviews, 10)}${row('Achievements', got, 25)}
        <tr><td><b>Total</b></td><td></td><td><b>${st.xp}</b></td></tr></table></details>`;
  }

  function recordGame(game, r) {
    const s = stats();
    s.games++;
    if (game.mode === 'friend') s.friendGames++;
    else if (r.winner && r.winner === game.userColor) {
      s.cpuWins++;
      if (game.level === 3) s.strongWins++;
      if (r.reason === 'checkmate') s.mateWins++;
    }
    A().saveProgress();
    check();
  }

  /* =====================================================================
     GAME REVIEW — Rocco listens back to the tape
     ===================================================================== */
  const KIND_LABEL = { best: 'Best', good: 'Good', inaccuracy: 'Inaccuracy', mistake: 'Mistake', blunder: 'Blunder' };
  const KIND_MARK = { best: '', good: '', inaccuracy: '?!', mistake: '?', blunder: '??' };
  const winPct = (cp) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
  const clampCp = (x) => Math.max(-1500, Math.min(1500, x));
  function moveAccuracy(before, after) {
    const d = Math.max(0, winPct(clampCp(before)) - winPct(clampCp(after)));
    return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * d) - 3.1669));
  }
  function evalPos(fen, timeMs) {
    const c = new Chess(fen);
    if (c.isCheckmate()) return { s: -MATE, best: null };
    if (c.isStalemate() || c.isInsufficientMaterial()) return { s: 0, best: null };
    const r = Engine.bestMove(c, { depth: 2, timeMs });
    return r ? { s: r.score, best: r.uci } : { s: 0, best: null };
  }

  function viewReview(view) {
    const { esc, Store, trainerLayout, coachBubble, setMood, Sound, saveProgress, colorName } = A();
    const game = Store.get('game', null);
    if (!game || !game.moves || game.moves.length < 2) {
      view.innerHTML = `<div class="card" style="max-width:560px;margin:30px auto;text-align:center">${coachBubble('No game on the tape yet! Play a game against me or a friend, then come back and I\'ll review it with you.', 'smirk')}<div class="row" style="justify-content:center;margin-top:16px"><a class="btn primary" href="#play-new">♟️ Start a game</a></div></div>`;
      return;
    }
    // Rebuild the game.
    const c = new Chess();
    const hist = [], fens = [c.fen()];
    for (const u of game.moves) { const m = c.move(u); if (!m) break; hist.push(m); fens.push(c.fen()); }
    const key = game.moves.join(',');
    const reviewed = (col) => game.mode === 'friend' || col === game.userColor;
    const who = (col) => (game.mode === 'friend' ? esc(game.names[col]) : col === game.userColor ? 'You' : 'Rocco');
    const resTxt = game.result ? (game.result.winner ? `${esc(game.names[game.result.winner])} won by ${game.result.reason}` : `Draw · ${game.result.reason}`) : 'Game still in progress';
    const board = trainerLayout(view, `
      <div class="crumbs"><a href="#play">Live Show</a> / Game review</div>
      <div class="row spread" style="align-items:center"><h2 style="margin:0">📼 Tape review</h2><span class="pill">${hist.length} plies</span></div>
      <div class="muted">${esc(game.names.w)} vs ${esc(game.names.b)} · ${resTxt}</div>
      <div class="rv-body"><div class="rv-progress"><div class="muted">🎧 Rocco is listening back to the tape…</div><div class="xp-bar"><i style="width:0%"></i></div></div></div>`);
    const panel = $('.panel', view);
    let data = null, cursor = hist.length - 1, practice = null, token = 0;
    board.orientation = game.mode === 'cpu' ? game.userColor : 'w';
    board.movable = (col) => !!practice && practice.color === col && !practice.done;
    board.onMove = (mv) => tryMove(mv);
    showPly(cursor);

    // ---- analysis (chunked so the page stays responsive) ----
    const cached = Store.get('review', null);
    if (cached && cached.key === key && cached.s && cached.s.length === fens.length) { data = cached; render(true); }
    else {
      const s = [], best = [];
      let i = 0;
      const myToken = ++token;
      const step = () => {
        if (myToken !== token) return;
        const t0 = performance.now();
        while (i < fens.length && performance.now() - t0 < 60) { const e = evalPos(fens[i], 110); s.push(e.s); best.push(e.best); i++; }
        const bar = $('.rv-progress .xp-bar i', panel);
        if (bar) bar.style.width = Math.round((i / fens.length) * 100) + '%';
        if (i < fens.length) setTimeout(step, 0);
        else { data = { key, s, best, counted: false }; Store.set('review', data); render(false); }
      };
      setTimeout(step, 30);
    }

    function analyse() {
      const moves = hist.map((m, i) => {
        const before = data.s[i], after = -data.s[i + 1];
        const loss = Math.max(0, Math.min(1500, clampCp(before) - clampCp(after)));
        const kind = Coach.classify(loss, data.best[i] === m.uci);
        let bestSan = '';
        if (data.best[i] && data.best[i] !== m.uci) { try { bestSan = new Chess(fens[i]).move(data.best[i]).san; } catch (e) { /* ignore */ } }
        return { i, m, loss, kind, acc: moveAccuracy(before, after), bestSan, before, after };
      });
      const acc = { w: null, b: null }, counts = { w: {}, b: {} };
      for (const col of ['w', 'b']) {
        const mine = moves.filter((x) => x.m.color === col);
        acc[col] = mine.length ? Math.round(mine.reduce((a, x) => a + x.acc, 0) / mine.length) : null;
        mine.forEach((x) => { counts[col][x.kind] = (counts[col][x.kind] || 0) + 1; });
      }
      const pool = moves.filter((x) => reviewed(x.m.color) && x.bestSan);
      let key3 = pool.filter((x) => x.kind === 'blunder' || x.kind === 'mistake');
      if (key3.length < 3) key3 = key3.concat(pool.filter((x) => x.kind === 'inaccuracy'));
      key3 = key3.sort((a, b) => b.loss - a.loss).slice(0, 3).sort((a, b) => a.i - b.i);
      return { moves, acc, counts, key3 };
    }

    function render(fromCache) {
      const A_ = analyse();
      data.view = A_;
      const youCol = game.mode === 'cpu' ? game.userColor : null;
      const myAcc = youCol ? A_.acc[youCol] : Math.max(A_.acc.w || 0, A_.acc.b || 0);
      const myMoves = youCol ? A_.moves.filter((x) => x.m.color === youCol).length : Math.min(...['w', 'b'].map((col) => A_.moves.filter((x) => x.m.color === col).length));
      if (!data.counted) {
        const st = stats();
        st.reviews++;
        if (myMoves >= 10) st.bestAccuracy = Math.max(st.bestAccuracy || 0, myAcc || 0);
        data.counted = true;
        Store.set('review', data);
        saveProgress();
        check();
      }
      const accFor = youCol || 'w';
      const a = A_.acc[accFor] || 0;
      let line = a >= 90 ? 'Studio quality! 🎧 That was a clean performance.' : a >= 75 ? 'Solid gig! A few wrong notes, but the crowd loved it.' : a >= 60 ? 'Decent show — but a couple of moments cost you. Let\'s fix them.' : 'Rough night on stage. Every legend has those — let\'s look at the big moments.';
      if (game.mode === 'friend') line = `${esc(game.names.w)} played at ${A_.acc.w ?? '—'}% and ${esc(game.names.b)} at ${A_.acc.b ?? '—'}%. ` + (A_.key3.length ? 'Here are the moments that decided it.' : 'Clean game from both of you!');
      else if (A_.key3.length) line += ` Your biggest moment: move ${Math.floor(A_.key3.slice().sort((x, y) => y.loss - x.loss)[0].i / 2) + 1}.`;
      const kinds = ['best', 'good', 'inaccuracy', 'mistake', 'blunder'];
      const countsRow = (col) => `<div class="rv-counts">${kinds.map((k) => `<span class="tag ${k}">${KIND_LABEL[k]} <b>${A_.counts[col][k] || 0}</b></span>`).join('')}</div>`;
      const sides = (game.mode === 'cpu' ? [game.userColor, game.userColor === 'w' ? 'b' : 'w'] : ['w', 'b']);
      $('.rv-body', panel).innerHTML = `
        <div class="rv-acc">${sides.map((col) => `<div class="${reviewed(col) ? 'me' : ''}"><small>${who(col)} ${col === 'w' ? '⚪' : '⚫'}</small><b>${A_.acc[col] ?? '—'}%</b><small>accuracy</small></div>`).join('')}</div>
        ${coachBubble(line, a >= 75 ? 'cheer' : 'think')}
        ${sides.filter(reviewed).map((col) => (game.mode === 'friend' ? `<div class="muted" style="font-size:13px;margin-bottom:-6px">${who(col)}</div>` : '') + countsRow(col)).join('')}
        <h3 style="margin:4px 0 0">🎯 Key moments</h3>
        <div class="moments">${A_.key3.length ? A_.key3.map((x, j) => `
          <div class="moment" data-j="${j}"><div class="row spread" style="align-items:center"><b>${game.mode === 'friend' ? who(x.m.color) + ' · ' : ''}Move ${Math.floor(x.i / 2) + 1}${x.i % 2 ? '…' : '.'} ${esc(x.m.san)}${KIND_MARK[x.kind]}</b><span class="tag ${x.kind}">${KIND_LABEL[x.kind]}</span></div>
            <div class="muted">Better was <b>${esc(x.bestSan)}</b>.</div>
            <div class="row"><button class="btn small" data-show="${j}">👁 Show</button><button class="btn small primary" data-try="${j}">🎯 Find the better move</button></div></div>`).join('') : '<div class="muted">No big mistakes — nothing to fix! 🤘</div>'}</div>
        <div class="feedback info rv-fb" style="display:none"></div>
        <h3 style="margin:4px 0 0">🎼 All moves</h3>
        <div class="moves rv-moves"></div>
        <div class="row" style="justify-content:center"><button class="btn small" data-nav="first">⏮</button><button class="btn small" data-nav="prev">◀</button><button class="btn small" data-nav="next">▶</button><button class="btn small" data-nav="last">⏭</button></div>
        <div class="row spread"><a class="btn" href="#play">← Back to game</a><a class="btn primary" href="#play-new">⟳ New game</a></div>`;
      drawMoves();
      $$('[data-show]', panel).forEach((b) => (b.onclick = () => showMoment(A_.key3[+b.dataset.show])));
      $$('[data-try]', panel).forEach((b) => (b.onclick = () => startPractice(A_.key3[+b.dataset.try], b.closest('.moment'))));
      $$('[data-nav]', panel).forEach((b) => (b.onclick = () => {
        const n = hist.length - 1;
        const to = { first: -1, prev: cursor - 1, next: cursor + 1, last: n }[b.dataset.nav];
        stopPractice(); showPly(Math.max(-1, Math.min(n, to)));
      }));
      if (!fromCache && Coach.chatty(2)) Coach.speak(line.replace(/<[^>]+>/g, ''));
      if (A_.key3.length) showMoment(A_.key3[0]);
    }

    function drawMoves() {
      const box = $('.rv-moves', panel);
      if (!box || !data || !data.view) return;
      const mv = data.view.moves;
      let html = '<table>';
      for (let i = 0; i < mv.length; i += 2) {
        const cell = (x) => (x ? `<td class="m${x.i === cursor ? ' cur' : ''}" data-k="${x.i}"><span class="dotk ${x.kind}"></span>${esc(x.m.san)}${KIND_MARK[x.kind]}</td>` : '<td></td>');
        html += `<tr><td class="n">${i / 2 + 1}.</td>${cell(mv[i])}${cell(mv[i + 1])}</tr>`;
      }
      box.innerHTML = html + '</table>';
      $$('td.m', box).forEach((td) => (td.onclick = () => { stopPractice(); showPly(+td.dataset.k); }));
      const cur = $('td.cur', box);
      if (cur) cur.scrollIntoView({ block: 'nearest' });
    }
    function showPly(k) {
      cursor = k;
      board.setPosition(new Chess(fens[k + 1]), k >= 0 ? hist[k] : null, { animate: false });
      if (data && data.view && k >= 0) {
        const x = data.view.moves[k];
        if (x.bestSan && (x.kind === 'mistake' || x.kind === 'blunder' || x.kind === 'inaccuracy')) board.annotate({ arrows: [[data.best[k].slice(0, 2), data.best[k].slice(2, 4), 'g']] });
      }
      drawMoves();
    }
    function showMoment(x) {
      stopPractice();
      cursor = x.i;
      board.setPosition(new Chess(fens[x.i]), x.i > 0 ? hist[x.i - 1] : null, { animate: false });
      board.annotate({ arrows: [[x.m.from, x.m.to, 'r'], [data.best[x.i].slice(0, 2), data.best[x.i].slice(2, 4), 'g']] });
      fb('info', `🔴 Played: <b>${esc(x.m.san)}</b> &nbsp; 🟢 Better: <b>${esc(x.bestSan)}</b>`);
      drawMoves();
    }
    function fb(kind, html) { const f = $('.rv-fb', panel); if (!f) return; f.style.display = ''; f.className = 'feedback rv-fb ' + kind; f.innerHTML = html; }
    function startPractice(x, card) {
      stopPractice();
      practice = { x, card, color: x.m.color, done: false, chess: new Chess(fens[x.i]) };
      cursor = x.i;
      board.orientation = x.m.color;
      board.setPosition(practice.chess, x.i > 0 ? hist[x.i - 1] : null, { animate: false });
      fb('info', `<span class="side ${x.m.color}"></span>${colorName(x.m.color)} to move. In the game you played <b>${esc(x.m.san)}</b> — find something better!`);
      drawMoves();
    }
    function stopPractice() { if (practice) { practice = null; board.orientation = game.mode === 'cpu' ? game.userColor : 'w'; } }
    function tryMove(mv) {
      if (!practice || practice.done) return;
      const p = practice, x = p.x;
      const m = p.chess.move(mv);
      if (!m) return;
      board.setPosition(p.chess, m);
      A().moveSound(m, p.chess);
      const e = evalPos(p.chess.fen(), 300);
      const after = -e.s;
      const loss = Math.max(0, clampCp(data.s[x.i]) - clampCp(after));
      if (m.uci === data.best[x.i] || loss <= 50) {
        p.done = true;
        Sound.good();
        fb('good', `✓ Yes! <b>${esc(m.san)}</b> is the move. ${Coach.line('best')}`);
        if (p.card) p.card.classList.add('fixed');
        setMood(panel, 'cheer');
      } else {
        Sound.bad();
        fb('bad', `✗ <b>${esc(m.san)}</b> isn't it — try again. <button class="btn small" id="rvShow">Show me</button>`);
        const b = $('#rvShow', panel);
        if (b) b.onclick = () => { if (practice === p) { p.done = true; showMoment(x); } };
        setTimeout(() => { if (practice === p && !p.done) { p.chess.undo(); board.setPosition(p.chess, x.i > 0 ? hist[x.i - 1] : null, { animMove: m, reverse: true }); } }, 700);
      }
    }
    Coach.setContext({
      chess: () => (practice ? practice.chess : new Chess(fens[cursor + 1])), userColor: game.mode === 'cpu' ? game.userColor : 'w',
      hint: () => (practice ? `Look at the green arrow idea… the better move was ${esc(practice.x.bestSan)}. Try it!` : 'Pick a key moment and press 🎯 to practise it!'),
    });
    return () => { token++; };
  }

  /* =====================================================================
     VISITOR COUNTER (GoatCounter — no cookies). Set window.RR_COUNTER in index.html.
     ===================================================================== */
  let counterReady = false, counterQueue = [];
  function initCounter() {
    const code = (window.RR_COUNTER || '').trim();
    if (!code || !/^[a-z0-9-]+$/i.test(code)) return;
    window.goatcounter = { no_onload: true };
    const sc = document.createElement('script');
    sc.async = true;
    sc.src = 'https://gc.zgo.at/count.js';
    sc.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
    sc.onload = () => { counterReady = true; counterQueue.forEach(countView); counterQueue = []; };
    document.head.appendChild(sc);
  }
  function countView(path) {
    if (!(window.RR_COUNTER || '').trim()) return;
    if (!counterReady || !window.goatcounter || !window.goatcounter.count) { counterQueue.push(path); return; }
    try { window.goatcounter.count({ path, title: document.title }); } catch (e) { /* blocked */ }
  }

  window.Extras = { viewDaily, viewRush, viewTrophies, viewReview, dailyInfo, dailyCard, dailyStreak, rankStrip, standing, check, recordGame, initCounter, countView, ACH, RANKS };
})();
