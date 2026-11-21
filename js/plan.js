/* Rook & Roll: Soundcheck (an adaptive puzzle test that estimates your Elo) and My Plan (a personal learning plan
   built from that Elo and the skills the test found weak). Loaded before app.js; reads window.App lazily. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const A = () => window.App;
  const SITE = 'rook-roll.github.io';
  const TEST_LEN = 12;
  const TIME_LIMIT = 120000;

  /* ---------------- Skill groups ---------------- */
  const GROUPS = {
    mates: { icon: '☠️', name: 'Checkmates', themes: ['Mate in 1', 'Mate in 2', 'Back rank', 'Smothered mate', 'Arabian mate', 'Attack on the king'], lessons: ['mate', 'rookmate', 'patterns'],
      tip: 'Look at every check first: checks, then captures, then threats.' },
    tactics: { icon: '⚔️', name: 'Tactics', themes: ['Fork', 'Pin', 'Skewer', 'Discovered attack', 'Discovered check', 'Tactics', 'Sacrifice'], lessons: ['forks', 'pins', 'discovered', 'doublecheck', 'defender'],
      tip: 'Hunt for moves that hit two things at once: forks, pins and discovered attacks.' },
    material: { icon: '🎯', name: 'Loose pieces', themes: ['Hanging piece'], lessons: ['values', 'hanging'],
      tip: 'Before every move, ask: what did their last move attack, and is anything undefended?' },
    calc: { icon: '🧠', name: 'Calculation', themes: ['Mate in 3', 'Quiet move'], lessons: ['patterns', 'defender'],
      tip: 'Picture the board after each move. The hardest moves to see are quiet ones that threaten something.' },
    endgame: { icon: '🏁', name: 'Endgames', themes: ['Endgame', 'Promotion'], lessons: ['endgame', 'rookmate', 'square'],
      tip: 'In the endgame your king is a fighter: march it to the centre.' },
  };
  const GROUP_ORDER = ['endgame', 'material', 'calc', 'tactics', 'mates'];
  function groupOf(p) {
    for (const g of GROUP_ORDER) if (p.themes.some((t) => GROUPS[g].themes.includes(t))) return g;
    return 'tactics';
  }

  /* ---------------- Levels ---------------- */
  const BANDS = [
    { min: 0, key: 'new', icon: '🌱', name: 'New to chess', blurb: 'You are learning how the pieces move and work together.' },
    { min: 600, key: 'beg', icon: '🎸', name: 'Beginner', blurb: 'You know the rules. Next: stop giving pieces away and spot simple mates.' },
    { min: 1000, key: 'int', icon: '🔥', name: 'Intermediate', blurb: 'You see one-move tactics. Next: combine them and calculate a little deeper.' },
    { min: 1400, key: 'adv', icon: '👑', name: 'Advanced', blurb: 'Your tactics are strong. Next: longer calculation, quiet moves and endgame technique.' },
    { min: 1800, key: 'exp', icon: '🌟', name: 'Expert', blurb: 'You crush most puzzles here. Next: the hardest puzzles and Rocco at full strength.' },
  ];
  const bandFor = (r) => { let b = BANDS[0]; for (const x of BANDS) if (r >= x.min) b = x; return b; };
  const BAND_PLAN = {
    new: { lessons: ['board', 'pawn', 'knight', 'sliders', 'king', 'special', 'mate', 'values'], groups: ['mates', 'material'], rush: 5, games: 2,
      routine: [['📚', 'One lesson a day', 'Short and hands-on. Finish the Foundations first.'], ['🧩', '3 easy puzzles', 'Mate in 1 and free pieces, around ★400–700.'], ['♟️', '2 games a week', 'Against Rocco on Beginner or Adaptive.']] },
    beg: { lessons: ['values', 'hanging', 'mate', 'develop', 'opening', 'rookmate', 'forks', 'endgame'], groups: ['material', 'mates'], rush: 8, games: 3,
      routine: [['🧩', '5 puzzles a day', 'Plus the Daily Puzzle. Accuracy first, speed later.'], ['📚', '2–3 lessons a week', 'Safety, openings and basic mates.'], ['♟️', '3 games a week', 'Then review each one with Rocco.']] },
    int: { lessons: ['forks', 'pins', 'discovered', 'doublecheck', 'defender', 'patterns', 'square', 'rookmate'], groups: ['tactics', 'mates'], rush: 12, games: 3,
      routine: [['⚡', 'Puzzle Rush, 3 times a week', 'Builds pattern speed.'], ['🧩', '8 puzzles a day', 'Mixed themes around your level.'], ['📼', 'Review every game', 'Replay the key moments until you find the better move.']] },
    adv: { lessons: ['discovered', 'doublecheck', 'defender', 'square', 'patterns'], groups: ['calc', 'tactics'], rush: 16, games: 4,
      routine: [['🧠', 'Calculate before you move', 'In puzzles, find the whole line before touching a piece.'], ['🧩', '10 hard puzzles a day', 'Mate in 3 and quiet moves.'], ['♟️', '4 games a week', 'Against Club or Strong Rocco, then review.']] },
    exp: { lessons: ['defender', 'square'], groups: ['calc', 'endgame'], rush: 20, games: 4,
      routine: [['🧠', 'The hardest puzzles', '★1500+ and solve them without moving pieces first.'], ['♟️', 'Strong Rocco', 'Play longer games and review every loss.'], ['⚡', 'Puzzle Rush for speed', 'Try to beat your best every session.']] },
  };
  const EXPERIENCE = [
    { r: 450, icon: '🌱', label: 'I just learned the rules' },
    { r: 750, icon: '🎸', label: 'I play now and then' },
    { r: 1050, icon: '🔥', label: 'I play often (online or with friends)' },
    { r: 1400, icon: '👑', label: 'I play in a club or tournaments' },
    { r: 1750, icon: '🌟', label: 'I\'m a strong player' },
  ];
  const SOURCES = { chesscom: { name: 'Chess.com', adj: 0 }, lichess: { name: 'Lichess', adj: -150 }, fide: { name: 'FIDE / national', adj: 0 }, other: { name: 'Other', adj: 0 } };

  /* ---------------- Storage helpers ---------------- */
  function stats() {
    const p = A().progress;
    p.stats = p.stats || {};
    for (const k of ['eloTests', 'plansDone']) if (typeof p.stats[k] !== 'number') p.stats[k] = 0;
    return p.stats;
  }
  const elo = () => A().progress.elo || null;
  const plan = () => A().progress.plan || null;
  const solvedSet = () => new Set(Object.entries(A().progress.puzzles).filter(([, r]) => r.solved).map(([id]) => id));
  const cpuGames = () => { const s = A().progress.stats || {}; return (s.games || 0) - (s.friendGames || 0); };
  const dailySolved = () => Object.values(A().progress.daily || {}).filter((r) => r.solved).length;
  const round = (x, n) => Math.round(x / n) * n;

  /* ---------------- Elo estimate (Bayesian, over a grid) ---------------- */
  // Each answer: { r: puzzle rating, w: 0..1 credit }. P(solve) is logistic in (R - r), with a small guess and slip rate.
  function estimate(prior, answers) {
    const S = 280, SD = 350;
    let sum = 0, mean = 0, sq = 0;
    const pts = [];
    for (let R = 100; R <= 2600; R += 10) {
      let lp = -((R - prior) ** 2) / (2 * SD * SD);
      for (const a of answers) {
        const P = 0.04 + 0.91 / (1 + Math.pow(10, (a.r - R) / S));
        lp += a.w * Math.log(P) + (1 - a.w) * Math.log(1 - P);
      }
      pts.push([R, lp]);
    }
    const mx = Math.max(...pts.map((p) => p[1]));
    for (const [R, lp] of pts) { const w = Math.exp(lp - mx); sum += w; mean += w * R; }
    mean /= sum;
    for (const [R, lp] of pts) sq += Math.exp(lp - mx) * (R - mean) ** 2;
    const sd = Math.sqrt(sq / sum);
    return { mean, sd };
  }
  function toElo(est) {
    const r = Math.max(100, Math.min(2400, round(est.mean, 10)));
    const spread = Math.max(75, est.sd);
    return { r, lo: Math.max(100, round(est.mean - spread, 50)), hi: round(est.mean + spread, 50) };
  }

  // Use the new Elo to calibrate the puzzle rating and Adaptive Rocco, unless they already have enough data of their own.
  function calibrate(r) {
    const p = A().progress;
    const rated = Object.values(p.puzzles).filter((x) => x.rated).length;
    const out = [];
    if (rated < 15) { p.rating = Math.max(100, Math.round(r)); out.push(`your puzzle rating is now <b>${p.rating}</b>`); }
    if ((p.adaptive.games || 0) < 5) { p.adaptive.rating = Math.max(300, Math.min(2200, r)); out.push(`Adaptive Rocco now plays at about <b>${Math.round(p.adaptive.rating)}</b>`); }
    return out;
  }

  function saveElo(e) {
    const { progress, saveProgress, fmtDay } = A();
    const prev = progress.elo;
    e.t = Date.now();
    e.d = fmtDay(new Date());
    e.hist = ((prev && prev.hist) || []).concat([{ d: e.d, r: e.r }]).slice(-30);
    if (e.method === 'self' && prev && prev.areas && !e.areas) e.areas = prev.areas;
    progress.elo = e;
    if (e.method === 'test') stats().eloTests++;
    const cal = e.method === 'test' ? calibrate(e.r) : [];
    saveProgress();
    return cal;
  }

  /* ---------------- Plan ---------------- */
  function weakGroups(e) {
    if (!e || !e.areas) return [];
    return Object.entries(e.areas).filter(([, a]) => a[1] > 0 && a[0] / a[1] < 0.5).sort((x, y) => x[1][0] / x[1][1] - y[1][0] / y[1][1]).map(([g]) => g);
  }
  function strongGroups(e) {
    if (!e || !e.areas) return [];
    return Object.entries(e.areas).filter(([, a]) => a[1] > 0 && a[0] / a[1] >= 0.75).map(([g]) => g);
  }
  function drillSet(g, r, solved) {
    let lo = r - 200, hi = r + 150, ids = [];
    for (let i = 0; i < 6; i++) {
      ids = PUZZLES.filter((p) => groupOf(p) === g && p.rating >= lo && p.rating <= hi);
      if (ids.filter((p) => !solved.has(p.id)).length >= 6) break;
      lo -= 100; hi += 100;
    }
    ids.sort((a, b) => a.rating - b.rating);
    return { lo: Math.max(400, lo), hi, ids: ids.map((p) => p.id) };
  }
  function buildPlan() {
    const { progress, saveProgress, fmtDay } = A();
    const e = elo();
    if (!e) return null;
    const band = bandFor(e.r);
    const cfg = BAND_PLAN[band.key];
    const weak = weakGroups(e);
    const groups = [...new Set([...weak, ...cfg.groups])].slice(0, 2);
    const order = (id) => LESSONS.findIndex((l) => l.id === id);
    let lessons = [...new Set([...weak.flatMap((g) => GROUPS[g].lessons), ...cfg.lessons])]
      .filter((id) => order(id) >= 0 && !progress.lessons[id]);
    if (band.key === 'new') lessons = cfg.lessons.filter((id) => !progress.lessons[id]);
    lessons = lessons.slice(0, 4).sort((a, b) => order(a) - order(b));
    const solved = solvedSet();
    const s = progress.stats || {};
    const steps = lessons.map((id) => ({ k: 'lesson', id }));
    for (const g of groups) {
      const d = drillSet(g, e.r, solved);
      const open = d.ids.filter((id) => !solved.has(id)).length;
      if (!open) continue;
      steps.push({ k: 'drill', g, lo: d.lo, hi: d.hi, ids: d.ids, base: d.ids.length - open, goal: Math.min(8, open) });
    }
    steps.push({ k: 'daily', base: dailySolved(), goal: 5 });
    steps.push({ k: 'rush', goal: Math.max(cfg.rush, (s.rushBest || 0) + 2) });
    steps.push({ k: 'games', base: cpuGames(), goal: cfg.games });
    steps.push({ k: 'review', base: s.reviews || 0, goal: 2 });
    steps.push({ k: 'retest' });
    progress.plan = { t: Date.now(), d: fmtDay(new Date()), elo: e.r, band: band.key, groups, steps };
    saveProgress();
    return progress.plan;
  }

  function stepInfo(st, i) {
    const { progress } = A();
    const s = progress.stats || {};
    const pl = plan();
    switch (st.k) {
      case 'lesson': {
        const L = LESSONS.find((l) => l.id === st.id) || { title: st.id, summary: '', icon: '📚' };
        return { icon: L.icon || '📚', title: 'Lesson: ' + L.title, desc: L.summary, href: '#lesson-' + st.id, cur: progress.lessons[st.id] ? 1 : 0, goal: 1, go: 'Start lesson' };
      }
      case 'drill': {
        const G = GROUPS[st.g];
        const sv = solvedSet();
        const n = st.ids.filter((id) => sv.has(id)).length - st.base;
        return { icon: G.icon, title: `Drill: ${st.goal} ${G.name.toLowerCase()} puzzles`, desc: `★${st.lo}–${st.hi}. ${G.tip}`, href: '#drill-' + i, cur: n, goal: st.goal, go: 'Start drill' };
      }
      case 'daily': return { icon: '📅', title: `Solve ${st.goal} Daily Puzzles`, desc: 'A new one every day. It keeps your streak alive.', href: '#daily', cur: dailySolved() - st.base, goal: st.goal, go: 'Today\'s puzzle' };
      case 'rush': return { icon: '⚡', title: `Score ${st.goal} in Puzzle Rush`, desc: 'Three minutes, three strikes. Builds pattern speed.', href: '#rush', cur: s.rushBest || 0, goal: st.goal, go: 'Play Rush' };
      case 'games': return { icon: '♟️', title: `Play ${st.goal} games against Rocco`, desc: `Adaptive Rocco plays at about ${Math.round(progress.adaptive.rating)} and adjusts as you go.`, href: '#play-new', cur: cpuGames() - st.base, goal: st.goal, go: 'Play' };
      case 'review': return { icon: '📼', title: `Review ${st.goal} of your games`, desc: 'After a game, tap “Review with Rocco” and replay your key mistakes.', href: '#review', cur: (s.reviews || 0) - st.base, goal: st.goal, go: 'Review' };
      case 'retest': {
        const e = elo();
        const done = e && e.method === 'test' && pl && e.t > pl.t;
        return { icon: '🎚️', title: 'Retake the Soundcheck', desc: 'See how much your Elo has grown, then get your next plan.', href: '#soundcheck', cur: done ? 1 : 0, goal: 1, go: 'Retake' };
      }
    }
    return { icon: '•', title: '?', desc: '', href: '#plan', cur: 0, goal: 1, go: 'Go' };
  }
  function planProgress(pl = plan()) {
    if (!pl) return { done: 0, total: 0, next: null, nextIndex: -1 };
    let done = 0, next = null, nextIndex = -1;
    pl.steps.forEach((st, i) => {
      const inf = stepInfo(st, i);
      if (inf.cur >= inf.goal) done++;
      else if (!next && st.k !== 'retest') { next = inf; nextIndex = i; }
    });
    if (!next) { const i = pl.steps.findIndex((st) => st.k === 'retest'); if (i >= 0 && done < pl.steps.length) { next = stepInfo(pl.steps[i], i); nextIndex = i; } }
    return { done, total: pl.steps.length, next, nextIndex };
  }
  // Called from Extras.check(): marks a finished plan once, so it counts for the "Tour Complete" trophy.
  function tick() {
    const pl = plan();
    stats();
    if (!pl || pl.doneAt) return;
    const pr = planProgress(pl);
    if (pr.total && pr.done >= pr.total) { pl.doneAt = Date.now(); A().progress.stats.plansDone++; A().saveProgress(); }
  }

  /* ---------------- Drill (plan puzzles) ---------------- */
  function drillStep() {
    const d = A().Store.get('drill', null);
    const pl = plan();
    if (!d || !pl || d.plan !== pl.t) return null;
    const st = pl.steps[d.i];
    return st && st.k === 'drill' ? { st, i: d.i } : null;
  }
  function clearDrill() { A().Store.set('drill', null); }
  function drillNext(excludeId) {
    const ds = drillStep();
    if (!ds) return null;
    const inf = stepInfo(ds.st, ds.i);
    if (inf.cur >= inf.goal) {
      clearDrill();
      A().toast('🎯 Drill complete! Back to your plan for the next step.', 3500);
      return null;
    }
    const sv = solvedSet();
    const id = ds.st.ids.find((x) => !sv.has(x) && x !== excludeId) || ds.st.ids.find((x) => x !== excludeId);
    return PUZZLES.find((p) => p.id === id) || null;
  }
  function drillBadge(pz) {
    const ds = drillStep();
    if (!ds || !ds.st.ids.includes(pz.id)) return '';
    const inf = stepInfo(ds.st, ds.i);
    return `<a class="pill gold" href="#plan" title="Back to your plan">🎯 Plan drill ${Math.min(inf.cur, inf.goal)}/${inf.goal}</a>`;
  }
  function viewDrill(view, arg) {
    const pl = plan();
    const i = +arg;
    const st = pl && pl.steps[i];
    if (!st || st.k !== 'drill') { location.replace('#plan'); return; }
    A().Store.set('drill', { plan: pl.t, i });
    const p = drillNext();
    location.replace(p ? '#puzzle-' + p.id : '#plan');
  }

  /* ---------------- Soundcheck (the test) ---------------- */
  function viewSoundcheck(view) {
    const { esc, Exercise, Sound, confetti, markActive, modal, colorName, coachBubble, progress, saveProgress } = A();
    let state = 'intro', prior = 750, answers = [], used = new Set(), counts = {}, ex = null, cur = null, t0 = 0, timer = null, pending = null;
    view.innerHTML = `<div class="trainer game sc">
      <div class="board-col"><div class="sc-bar"></div><div class="board-frame"><div class="bd"></div></div></div>
      <div class="panel"></div></div>`;
    const board = new Board($('.bd', view));
    board.setPosition(new Chess(), null);
    board.movable = () => false;
    const panel = $('.panel', view);
    const bar = $('.sc-bar', view);
    const prev = elo();
    const solvedBefore = solvedSet();

    function dots() {
      return `<div class="rush-results sc-dots">${Array.from({ length: TEST_LEN }, (_, i) => {
        const a = answers[i];
        return `<i class="${a ? (a.ok ? 'ok' : 'no') : i === answers.length && state === 'run' ? 'now' : ''}"></i>`;
      }).join('')}</div>`;
    }
    function drawBar() {
      if (state !== 'run') { bar.innerHTML = `<span>🎚️ <b>Soundcheck</b></span><span>${TEST_LEN} puzzles · about 5 min</span>`; bar.className = 'sc-bar'; return; }
      const left = Math.max(0, TIME_LIMIT - (performance.now() - t0));
      bar.className = 'sc-bar' + (left < 20000 ? ' low' : '');
      bar.innerHTML = `<span>Puzzle <b>${answers.length + 1}</b> / ${TEST_LEN}</span><span class="sc-time"><i style="width:${(left / TIME_LIMIT) * 100}%"></i></span><span>⏱ <b>${Math.ceil(left / 1000)}s</b></span>`;
    }
    function drawIntro() {
      panel.innerHTML = `
        <div class="crumbs"><a href="#plan">My Plan</a> / Soundcheck</div>
        <h2 style="margin:0">🎚️ Find your chess Elo</h2>
        ${coachBubble(`I'll play you <b>${TEST_LEN} puzzles</b> that adapt as you go: get one right and the next is harder. One try each, no hints. If you're stuck, tap <b>Skip</b>. Then I'll build you a learning plan.`, 'cheer')}
        <div class="muted" style="font-weight:700">First, how much chess have you played?</div>
        <div class="sc-exp">${EXPERIENCE.map((x, i) => `<button class="btn" data-exp="${i}"><span>${x.icon}</span> ${esc(x.label)}</button>`).join('')}</div>
        ${prev ? `<button class="btn primary" data-a="again">▶ Start from my last Elo (${prev.r})</button>` : ''}
        <details class="sc-know"><summary>I already have a rating</summary>
          <div class="sc-know-row">
            <input id="scRating" type="number" inputmode="numeric" min="100" max="3000" placeholder="e.g. 1200" aria-label="Your rating">
            <select id="scSource" aria-label="Where the rating is from">${Object.entries(SOURCES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select>
            <button class="btn small primary" data-a="self">Use it</button>
          </div>
          <div class="muted" style="font-size:13px">Lichess ratings run higher, so we take about 150 off. The test gives a more exact plan, because it also finds your weak spots.</div>
        </details>`;
      $$('[data-exp]', panel).forEach((b) => (b.onclick = () => begin(EXPERIENCE[+b.dataset.exp].r)));
      const again = $('[data-a="again"]', panel); if (again) again.onclick = () => begin(prev.r);
      $('[data-a="self"]', panel).onclick = selfRating;
    }
    function selfRating() {
      const v = parseInt($('#scRating', panel).value, 10);
      if (!(v >= 100 && v <= 3000)) { A().toast('Type a rating between 100 and 3000.'); return; }
      const src = SOURCES[$('#scSource', panel).value] || SOURCES.other;
      const r = Math.max(100, Math.min(2400, v + src.adj));
      saveElo({ r, lo: round(r - 100, 50), hi: round(r + 100, 50), method: 'self', source: src.name, given: v });
      markActive();
      Extras.check();
      buildPlan();
      A().toast(`Got it: Elo ${r}. Your plan is ready.`, 3000);
      location.hash = '#plan';
    }

    function estNow() { return estimate(prior, answers.map((a) => ({ r: a.r, w: a.w }))); }
    function pick() {
      const target = answers.length === 0 ? prior - 100 : estNow().mean + (answers.length % 2 ? 40 : -40);
      let best = null, bestScore = Infinity;
      for (const p of PUZZLES) {
        if (used.has(p.id)) continue;
        const g = groupOf(p);
        const score = Math.abs(p.rating - target) + 90 * (counts[g] || 0) + (solvedBefore.has(p.id) ? 70 : 0) + Math.random() * 40;
        if (score < bestScore) { bestScore = score; best = p; }
      }
      return best;
    }
    function begin(r) {
      prior = r; answers = []; used = new Set(); counts = {};
      state = 'run';
      next();
    }
    function next() {
      if (state !== 'run') return;
      clearTimeout(pending); clearInterval(timer);
      if (answers.length >= TEST_LEN) return finish();
      cur = pick();
      if (!cur) return finish();
      used.add(cur.id);
      const g = groupOf(cur);
      counts[g] = (counts[g] || 0) + 1;
      if (ex) ex.stop();
      ex = new Exercise({
        board, fen: cur.fen, solution: cur.solution, mate: cur.mate, noUndo: true,
        onSolved() { if (state === 'run') answer(true); },
        onWrong(m) { if (state === 'run') { board.flash(m.to, 'bad'); answer(false); } },
        onStatus(kind) { if (kind === 'reply' || kind === 'progress') fb('info', 'Good. Keep going…'); },
      });
      ex.start();
      t0 = performance.now();
      timer = setInterval(() => { if (performance.now() - t0 >= TIME_LIMIT) answer(false, 'time'); else drawBar(); }, 250);
      drawRun();
      drawBar();
    }
    function fb(kind, html) { const f = $('.feedback', panel); if (f) { f.className = 'feedback ' + kind; f.innerHTML = html; } }
    function drawRun() {
      const side = cur.fen.split(' ')[1];
      const guess = answers.length >= 3 ? toElo(estNow()).r : null;
      panel.innerHTML = `
        <div class="row spread" style="align-items:center"><h2 style="margin:0">🎚️ Soundcheck</h2><span class="pill">${answers.length + 1} / ${TEST_LEN}</span></div>
        ${dots()}
        <div class="feedback info"><span class="side ${side}"></span>${colorName(side)} to move${cur.mate ? `: mate in ${cur.mate}` : ': find the best move'}</div>
        <div class="muted">${guess ? `🎸 Rocco's guess so far: <b>about ${guess}</b>` : 'One try per puzzle. Take your time, you have 2 minutes.'}</div>
        <div class="row"><button class="btn small" data-a="skip">🤷 Skip</button><button class="btn small ghost" data-a="quit">■ Stop test</button></div>`;
      $('[data-a="skip"]', panel).onclick = () => answer(false, 'skip');
      $('[data-a="quit"]', panel).onclick = () => modal({ icon: '■', title: 'Stop the Soundcheck?', body: 'Your answers so far won\'t be saved.', buttons: [{ label: 'Keep going' }, { label: 'Stop', cls: 'primary', onClick: () => { stop(); state = 'intro'; drawIntro(); drawBar(); } }] });
    }
    function answer(ok, why) {
      if (state !== 'run' || !cur || answers.length >= TEST_LEN || used.size !== answers.length + 1) return;
      clearInterval(timer);
      const ms = performance.now() - t0;
      // Full credit up to 45 s, sliding to 70% at the time limit.
      const w = ok ? Math.max(0.7, 1 - (0.3 * Math.max(0, ms - 45000)) / (TIME_LIMIT - 45000)) : 0;
      answers.push({ id: cur.id, r: cur.rating, g: groupOf(cur), ok, w, ms: Math.round(ms) });
      if (ex) ex.stop();
      if (ok) {
        Sound.good();
        progress.puzzles[cur.id] = Object.assign(progress.puzzles[cur.id] || {}, { solved: true });
        saveProgress();
        fb('good', '✓ ' + Coach.line('solved'));
      } else {
        if (why === 'time') Sound.bad();
        fb('bad', why === 'time' ? '⏱ Time\'s up. Next one!' : why === 'skip' ? '🤷 Skipped. Next one!' : '✗ Not quite. Next one!');
      }
      const d = $('.sc-dots', panel); if (d) d.outerHTML = dots();
      pending = setTimeout(next, ok ? 650 : 900);
    }
    function stop() { clearInterval(timer); clearTimeout(pending); if (ex) ex.stop(); board.movable = () => false; }
    function finish() {
      stop();
      state = 'done';
      const e = toElo(estNow());
      const areas = {};
      answers.forEach((a) => { areas[a.g] = areas[a.g] || [0, 0]; areas[a.g][1]++; if (a.ok) areas[a.g][0]++; });
      const rec = Object.assign(e, { method: 'test', n: answers.length, ok: answers.filter((a) => a.ok).length, areas, seq: answers.map((a) => (a.ok ? 1 : 0)) });
      const before = prev ? prev.r : null;
      const cal = saveElo(rec);
      markActive();
      Sound.end && Sound.end();
      confetti();
      drawBar();
      drawResult(rec, before, cal);
      Extras.check();
      if (Coach.chatty(2)) Coach.speak(`Your Elo is about ${rec.r}. ${bandFor(rec.r).name}!`);
    }
    function drawResult(e, before, cal) {
      const band = bandFor(e.r);
      const diff = before != null ? e.r - before : null;
      const pl = plan();
      const replace = pl && !pl.doneAt;
      panel.innerHTML = `
        <div class="crumbs"><a href="#plan">My Plan</a> / Soundcheck</div>
        <div class="sc-result">
          <div class="muted">Your Elo estimate</div>
          <div class="sc-elo">${e.r}</div>
          <div class="muted">likely ${e.lo}–${e.hi}${diff != null ? ` · <b class="${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? '+' : ''}${diff}</b> since last time` : ''}</div>
          <div class="pill gold" style="margin-top:8px">${band.icon} ${band.name}</div>
        </div>
        ${dots()}
        <div class="muted">✅ ${e.ok} of ${e.n} solved. ${esc(band.blurb)}</div>
        ${skillBars(e)}
        ${cal.length ? `<div class="feedback info" style="font-weight:500"><span>🎛️ Calibrated: ${cal.join(' and ')}.</span></div>` : ''}
        <div class="row">
          <button class="btn primary" data-a="plan">🗺️ ${replace ? 'Update my plan' : 'Build my learning plan'}</button>
          <button class="btn" data-a="share">📤 Share</button>
        </div>
        ${replace ? '<div class="row"><a class="btn small ghost" href="#plan">Keep my current plan</a></div>' : ''}`;
      $('[data-a="plan"]', panel).onclick = () => { buildPlan(); location.hash = '#plan'; };
      $('[data-a="share"]', panel).onclick = () => shareElo(e);
    }
    Coach.setContext({ chess: () => (ex ? ex.chess : null), userColor: 'w', hint: () => 'No hints in the Soundcheck. I need to hear how you really play! 🎸' });
    drawIntro(); drawBar();
    return () => { state = 'gone'; stop(); };
  }

  function shareElo(e) {
    const band = bandFor(e.r);
    const seq = e.seq ? '\n' + e.seq.map((x) => (x ? '🟩' : '🟥')).join('') : '';
    Extras.share(`🎚️ Rook & Roll Soundcheck: my chess Elo is about ${e.r} ${band.icon} ${band.name}${seq}\nFind yours in 5 minutes: ${SITE}/#soundcheck`);
  }

  function skillBars(e) {
    if (!e.areas) return '';
    return `<div class="skills">${Object.entries(GROUPS).map(([k, G]) => {
      const a = e.areas[k];
      const pct = a && a[1] ? Math.round((a[0] / a[1]) * 100) : null;
      const cls = pct == null ? '' : pct >= 75 ? 'good' : pct >= 50 ? 'ok' : 'weak';
      return `<div class="skill ${cls}"><span>${G.icon} ${G.name}</span><span class="mini-bar"><i style="width:${pct || 0}%"></i></span><span class="muted">${a ? `${a[0]}/${a[1]}` : 'not tested'}</span></div>`;
    }).join('')}</div>`;
  }

  /* ---------------- My Plan page ---------------- */
  function verdict(e, pl) {
    const { esc } = A();
    const weak = weakGroups(e), strong = strongGroups(e);
    const name = (g) => GROUPS[g].name.toLowerCase();
    const list = (a) => a.length > 1 ? a.slice(0, -1).map(name).join(', ') + ' and ' + name(a[a.length - 1]) : name(a[0]);
    let t = `You're at about <b>${e.r}</b> (${bandFor(e.r).icon} ${bandFor(e.r).name}). ${esc(bandFor(e.r).blurb)} `;
    if (strong.length) t += `You're already good at <b>${list(strong)}</b>. `;
    if (weak.length) t += `The test showed you lose points on <b>${list(weak)}</b>, so this plan starts there. `;
    else if (e.method === 'self') t += 'Take the Soundcheck to find your weak spots, and I\'ll aim the drills at them. ';
    if (pl && pl.groups.length) t += `Tip: ${esc(GROUPS[pl.groups[0]].tip)}`;
    return t;
  }
  function growthNote(e) {
    const { progress } = A();
    const rated = Object.values(progress.puzzles).filter((x) => x.rated).length;
    const ad = progress.adaptive;
    const gamesSince = (ad.history || []).filter((h) => h.d >= e.d).length;
    if (rated >= 15 && progress.rating >= e.r + 150) return `📈 Your puzzle rating (${progress.rating}) is well above your Elo. Time to retake the Soundcheck!`;
    if (gamesSince >= 5 && ad.rating >= e.r + 150) return `📈 Adaptive Rocco is up to ${Math.round(ad.rating)}. You may have levelled up. Retake the Soundcheck!`;
    return '';
  }
  function sparkline(hist) {
    if (!hist || hist.length < 2) return '';
    const W = 260, H = 60, rs = hist.map((h) => h.r);
    const mn = Math.min(...rs) - 50, mx = Math.max(...rs) + 50;
    const pts = rs.map((r, i) => `${(i / (rs.length - 1)) * (W - 10) + 5},${H - 5 - ((r - mn) / (mx - mn)) * (H - 10)}`).join(' ');
    return `<div class="card elo-hist"><div class="row spread"><b>📈 Elo history</b><span class="muted">${rs[0]} → ${rs[rs.length - 1]}</span></div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Elo over time"><polyline points="${pts}" fill="none" stroke="var(--yellow)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg></div>`;
  }

  function viewPlan(view) {
    const { esc, coachBubble, progress } = A();
    clearDrill();
    const e = elo();
    if (!e) {
      view.innerHTML = `
        <div class="band-head yellow"><div><h1>My Plan</h1><p>Find your chess Elo in about 5 minutes, then get a step-by-step learning plan made for your level.</p>
          <div class="row"><a class="btn primary" href="#soundcheck">🎚️ Take the Soundcheck</a></div></div>
          <div style="width:110px">${Coach.svg('cheer')}</div></div>
        <div class="plan-how">
          <div class="card"><div class="ico">🧩</div><h3>1. Play 12 puzzles</h3><p class="muted">They adapt to you: right answers get harder ones, misses get easier ones.</p></div>
          <div class="card"><div class="ico">🎚️</div><h3>2. Get your Elo</h3><p class="muted">An estimate on the usual chess rating scale, plus your strong and weak skills.</p></div>
          <div class="card"><div class="ico">🗺️</div><h3>3. Follow your plan</h3><p class="muted">Lessons, puzzle drills, games and reviews picked for you. Progress is tracked automatically.</p></div>
        </div>`;
      return;
    }
    let pl = plan();
    if (!pl) pl = buildPlan();
    const band = bandFor(e.r);
    const pr = planProgress(pl);
    const cfg = BAND_PLAN[pl.band] || BAND_PLAN[band.key];
    const growth = growthNote(e);
    const complete = pr.done >= pr.total;
    view.innerHTML = `
      <div class="band-head yellow plan-head">
        <div><h1>My Plan</h1>
          <p>${band.icon} <b>${band.name}</b> · ${e.method === 'self' ? `from your ${esc(e.source || '')} rating` : `Soundcheck on ${esc(e.d)}`}${e.method === 'test' ? ` · likely ${e.lo}–${e.hi}` : ''}</p>
          <div class="row"><a class="btn primary" href="#soundcheck">🎚️ ${e.method === 'self' ? 'Take the Soundcheck' : 'Retake the test'}</a><button class="btn" data-a="share">📤 Share my Elo</button></div></div>
        <div style="text-align:right"><div class="muted">Your Elo</div><div class="rating-big">${e.r}</div><div class="muted">Puzzles ★ ${progress.rating} · Rocco ${Math.round(progress.adaptive.rating)}</div></div>
      </div>
      ${growth ? `<div class="feedback good" style="margin-top:16px"><span>${growth}</span></div>` : ''}
      <div class="duo plan-duo">
        <div class="card">${coachBubble(verdict(e, pl), 'happy')}</div>
        <div class="card"><h3 style="margin:0 0 10px">Your skills</h3>${skillBars(e) || '<div class="muted">Take the Soundcheck to see your skills.</div>'}</div>
      </div>
      <div class="section-title"><h2>${complete ? '🏁 Plan complete!' : 'Your steps'}</h2><span class="muted">${pr.done} / ${pr.total} done · started ${esc(pl.d)}</span></div>
      <div class="xp-bar plan-bar"><i style="width:${pr.total ? (pr.done / pr.total) * 100 : 0}%"></i></div>
      ${complete ? `<div class="card" style="margin-bottom:12px">${coachBubble('You finished the whole plan. Encore! 🤘 Build the next one from your new Elo.', 'cheer')}<div class="row" style="margin-top:12px"><button class="btn primary" data-a="rebuild">🗺️ Build my next plan</button></div></div>` : ''}
      <div class="plan-steps">${pl.steps.map((st, i) => {
        const inf = stepInfo(st, i);
        const done = inf.cur >= inf.goal;
        const isNext = i === pr.nextIndex;
        const shown = Math.max(0, Math.min(inf.cur, inf.goal));
        return `<div class="plan-step ${done ? 'done' : ''} ${isNext ? 'next' : ''}">
          <div class="ps-ico">${done ? '✓' : inf.icon}</div>
          <div class="ps-main"><div class="ps-t">${esc(inf.title)}${isNext ? ' <span class="pill gold">Next</span>' : ''}</div>
            <div class="muted ps-d">${esc(inf.desc)}</div>
            ${inf.goal > 1 ? `<div class="ps-prog"><span class="mini-bar"><i style="width:${(shown / inf.goal) * 100}%"></i></span><span class="muted">${shown}/${inf.goal}</span></div>` : ''}</div>
          <a class="btn small ${isNext ? 'primary' : ''}" href="${inf.href}">${done ? 'Again' : esc(inf.go)}</a>
        </div>`;
      }).join('')}</div>
      <div class="section-title"><h2>Your practice routine</h2><span class="muted">about 20 minutes a day</span></div>
      <div class="plan-how">${cfg.routine.map(([ico, t, d]) => `<div class="card"><div class="ico">${ico}</div><h3>${esc(t)}</h3><p class="muted">${esc(d)}</p></div>`).join('')}</div>
      ${sparkline(e.hist)}
      ${complete ? '' : '<div class="row" style="justify-content:center;margin-top:18px"><button class="btn small ghost" data-a="rebuild">⟳ Rebuild my plan</button></div>'}`;
    $$('[data-a="share"]', view).forEach((b) => (b.onclick = () => shareElo(e)));
    $$('[data-a="rebuild"]', view).forEach((b) => (b.onclick = () => { buildPlan(); viewPlan(view); A().toast('🗺️ New plan built from your Elo.'); }));
  }

  /* ---------------- Home card ---------------- */
  function homeCard() {
    const { esc } = A();
    const e = elo();
    if (!e) {
      return `<div class="card plan-card" data-go="#soundcheck">
        <div class="pc-ico">🎚️</div>
        <div class="pc-main"><span class="pill gold">New · 5 minutes</span><h3>What's your chess Elo?</h3>
          <div class="muted">Take Rocco's Soundcheck: 12 puzzles that adapt to you. You get your Elo and a learning plan made for your level.</div></div>
        <a class="btn primary" href="#soundcheck">Find my Elo</a>
      </div>`;
    }
    const band = bandFor(e.r);
    const pl = plan();
    const pr = planProgress(pl);
    return `<div class="card plan-card" data-go="#plan">
      <div class="pc-elo"><small>Elo</small><b>${e.r}</b><small>${band.icon} ${band.name}</small></div>
      <div class="pc-main"><span class="pill">🗺️ My Plan · ${pr.done}/${pr.total} steps</span>
        <h3>${pr.next ? 'Next: ' + esc(pr.next.title) : pl ? 'Plan complete! 🤘' : 'Build your learning plan'}</h3>
        <div class="mini-bar"><i style="width:${pr.total ? (pr.done / pr.total) * 100 : 0}%"></i></div></div>
      <a class="btn primary" href="${pr.next ? pr.next.href : '#plan'}">${pr.next ? esc(pr.next.go) : 'Open plan'}</a>
    </div>`;
  }

  window.Plan = { viewSoundcheck, viewPlan, viewDrill, homeCard, drillNext, drillBadge, clearDrill, tick, stats, bandFor, estimate, GROUPS, groupOf };
})();
