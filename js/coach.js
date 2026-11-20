/* Rocco — the Rook & Roll coach: character art, personality, chat, voice and move reviews. */
(function () {
  'use strict';
  const A = () => window.App;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const INK = '#0e0c12', Y = '#ffd23f', R = '#ff4d5e';

  /* ---------- Character art ---------- */
  const MOUTH = {
    happy: `<path d="M39 78 Q50 93 61 78 Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M44.5 85 Q50 89.5 55.5 85 Q50 82.5 44.5 85Z" fill="${R}"/>`,
    wow: `<ellipse cx="50" cy="83" rx="5.5" ry="7" fill="${INK}"/>`,
    sad: `<path d="M40 88 Q50 78 60 88" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
    smirk: `<path d="M41 83 Q52 89 61 78" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
    think: `<path d="M43 84 H57" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
    cheer: `<path d="M38 77 Q50 96 62 77 Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M44 86 Q50 92 56 86 Q50 83 44 86Z" fill="${R}"/>`,
  };
  function svg(mood = 'happy') {
    const m = MOUTH[mood] ? mood : 'happy';
    return `<svg class="rocco mood-${m}" viewBox="0 0 100 124" aria-hidden="true">
      <ellipse cx="50" cy="119" rx="34" ry="4.5" fill="rgba(0,0,0,.28)"/>
      ${m === 'cheer' ? `<path d="M8 20 l6 5 M6 34 h7 M92 20 l-6 5 M94 34 h-7" stroke="${Y}" stroke-width="3.5" stroke-linecap="round"/>` : ''}
      <path d="M14 116 Q14 103 26 101 H74 Q86 103 86 116 Z" fill="${Y}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M47.5 104 L43 111 H49 L46 116 L55 108 H49 L52.5 104 Z" fill="${R}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M28 101 L31 47 H69 L72 101 Z" fill="${Y}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M19 48 V16 H33 V26 H43 V16 H57 V26 H67 V16 H81 V48 Z" fill="${Y}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M30.6 49 H69.4 L69.9 56 H30.1 Z" fill="${R}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M69 51 L80 46 L78 58 Z" fill="${R}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
      <rect x="31.5" y="59" width="16.5" height="12" rx="4" fill="${INK}"/>
      <rect x="52" y="59" width="16.5" height="12" rx="4" fill="${INK}"/>
      <path d="M47 63 H53" stroke="${INK}" stroke-width="3"/>
      <path class="glint" d="M35 62.5 L40 62.5 M55.5 62.5 L60.5 62.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      ${m === 'think' ? `<path d="M52 56.5 L67 54" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` : ''}
      <circle cx="34" cy="78" r="3.2" fill="${R}" opacity=".55"/><circle cx="66" cy="78" r="3.2" fill="${R}" opacity=".55"/>
      ${MOUTH[m]}
    </svg>`;
  }
  const avatar = (mood) => `<div class="avatar">${svg(mood)}</div>`;

  /* ---------- Personality ---------- */
  const LINES = {
    greet: ['Yo! Rocco here — ready to rock some chess? 🎸', 'Welcome back to the stage, superstar!', 'The crowd is warmed up. Let\'s play some chess!'],
    good: ['That move slaps! 🎸', 'Crowd goes wild! 🤘', 'Encore! Encore!', 'Now THAT is a power chord!', 'Smooth like a guitar solo.'],
    best: ['That\'s the best move on the board! 🔥', 'Headliner material right there!', 'You just hit the perfect note.'],
    inaccuracy: ['Decent — but slightly off-beat. There was a cleaner move.', 'Okay move, but I heard a better riff.'],
    mistake: ['Hmm, that\'s a mistake. There was a stronger move.', 'Not your best track — watch what that allows.'],
    blunder: ['Ouch… that hit a sour note. 😬', 'Yikes — you dropped that like a hot mic!', 'Big oops! Check what that move left hanging.'],
    wrong: ['Off-key! Try another note.', 'Not quite — rewind the tape and try again.', 'The crowd went quiet… give it another shot!'],
    solved: ['Nailed it! 🤘', 'That\'s how you rock a puzzle!', 'Standing ovation! 👏', 'Boom — solved like a pro.'],
    check: ['Check! Turn up the pressure!', 'Check! The king is feeling the bass.'],
    capture: ['Snatched it! 💰', 'Backstage pass revoked for that piece!', 'Into the mosh pit it goes!'],
    castle: ['Castling — every rockstar needs security for the frontman.', 'King tucked in safe. Smart move.'],
    myMove: ['My turn… *tunes guitar*', 'Here comes my riff.', 'Let me answer that.'],
    win: ['You beat me! Take a bow, rockstar! 🤘', 'Standing ovation — you won!'],
    lose: ['Gotcha! Every legend loses a gig now and then. Rematch?', 'That one\'s mine! We\'ll rehearse — you\'ll get me next time.'],
    draw: ['A draw! What a duet. 🎶'],
    lesson: ['Lesson complete — you\'re climbing the charts!', 'Another track on the setlist mastered! 🎸'],
  };
  const JOKES = [
    'Why did the pawn join a band? It wanted to get promoted to lead singer! 🎤',
    'I\'m a rook — I only move in straight lines, but my jokes go sideways.',
    'What\'s a knight\'s favourite music? Anything with a good hop-hop beat.',
    'Why don\'t bishops play the drums? They can never keep it straight!',
    'I tried to castle at the concert. Security said I couldn\'t pass through check-in.',
    'The queen can go anywhere. Basically she\'s got an all-access backstage pass.',
  ];
  const TIPS = [
    'Before every move, ask: what is my opponent threatening?',
    'Castle early. A king in the centre is like a singer with no bodyguard.',
    'Look for checks, captures and threats — in that order — every single move.',
    'Knights love outposts: squares deep in enemy land that pawns can\'t attack.',
    'When you see a good move, look for a better one.',
    'Rooks belong on open files — that\'s where they can turn up the volume.',
    'In the endgame your king becomes a fighter. Bring it to the centre!',
    'Trade pieces when you\'re ahead; avoid trades when you\'re behind.',
  ];
  const PIECES = {
    king: 'The king moves one square in any direction. Keep him safe — if he\'s checkmated, the show\'s over.',
    queen: 'The queen moves any number of squares in any straight line or diagonal. She\'s worth about 9 pawns.',
    rook: 'Rooks — my people! — move any number of squares along ranks and files. Worth about 5 pawns. 🎸',
    bishop: 'Bishops slide diagonally any distance and stay on one colour all game. Worth about 3 pawns.',
    knight: 'Knights jump in an L: two squares one way, then one to the side. They\'re the only piece that hops over others.',
    pawn: 'Pawns move forward one square (two on their first move) and capture diagonally. Reach the last rank and they promote!',
  };
  const RULES = {
    castl: 'Castling: move your king two squares towards a rook, and the rook hops over. Allowed only if neither has moved, nothing is between them, and the king isn\'t in, through or into check.',
    passant: 'En passant: if an enemy pawn moves two squares and lands right beside your pawn, you can capture it as if it moved one — but only on the very next move.',
    stalemate: 'Stalemate: the player to move isn\'t in check but has no legal moves. It\'s a draw — so be careful when you\'re winning!',
    checkmate: 'Checkmate: the king is in check and there\'s no way out. Game over!',
    promot: 'Promotion: a pawn that reaches the far side turns into a queen, rook, bishop or knight — almost always a queen.',
  };

  /* ---------- Voice ---------- */
  // Rank the device's voices so Rocco uses the most natural-sounding one available.
  const NOVELTY = /\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Fred|Good News|Hysterical|Jester|Junior|Organ|Pipe Organ|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|eSpeak|espeak)\b/i;
  const GOOD = /\b(Samantha|Daniel|Karen|Moira|Tessa|Rishi|Alex|Ava|Evan|Nathan|Joelle|Noelle|Tom|Allison|Susan|Zoe|Serena|Arthur|Martha|Aaron|Nicky|Fiona|Oliver|Jamie|Lee|Matilda)\b/i;
  const MALE = /\b(Daniel|Alex|Evan|Nathan|Tom|Aaron|Arthur|Rishi|Oliver|Jamie|Lee|Guy|Andrew|Brian|Christopher|Eric|Davis|Ryan|Roger|Steffan|Thomas|William|Liam|Male)\b/i;
  function voiceScore(v) {
    const n = v.name;
    if (NOVELTY.test(n)) return -1000;
    let s = 0;
    if (/Natural|Neural/i.test(n)) s += 100;
    if (/Premium/i.test(n)) s += 90;
    if (/Enhanced/i.test(n)) s += 80;
    if (/^Google/i.test(n)) s += 70;
    if (/Microsoft.*Online/i.test(n)) s += 60;
    if (GOOD.test(n)) s += 30;
    if (/^en[-_](US|GB)/i.test(v.lang)) s += 10;
    if (MALE.test(n)) s += 8;
    if (v.localService === false) s += 3;
    return s;
  }
  function voiceQuality(v) {
    const s = voiceScore(v);
    return s >= 60 ? 'natural' : s >= 0 ? 'standard' : 'novelty';
  }
  let voices = [];
  function loadVoices() {
    try { voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a)); } catch (e) { voices = []; }
  }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.addEventListener('voiceschanged', loadVoices); }
  function chooseVoice() {
    if (!voices.length) loadVoices();
    const p = A().prefs;
    if (p.voiceName) { const v = voices.find((x) => x.name === p.voiceName); if (v) return v; }
    return voices.find((v) => voiceScore(v) > -100) || voices[0] || null;
  }

  // Turn on-screen text into something that sounds natural when spoken.
  const PIECE_WORD = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight' };
  function sanToWords(_, piece, fromFile, fromRank, takes, dest, promo, mark) {
    let w;
    if (piece) w = PIECE_WORD[piece] + (takes ? ' takes ' : ' to ') + dest;
    else w = takes ? `${fromFile} takes ${dest}` : dest;
    if (promo) w += ' promotes to a ' + PIECE_WORD[promo];
    if (mark === '+') w += ', check';
    if (mark === '#') w += ', checkmate';
    return w;
  }
  function humanize(text) {
    let t = String(text)
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}️‍]/gu, '')
      .replace(/\*[^*]+\*/g, (m) => m.slice(1, -1) + ',')
      .replace(/\bO-O-O\b/g, 'castles queenside').replace(/\bO-O\b/g, 'castles kingside')
      .replace(/(?<![\w-])([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([QRBN]))?([+#])?(?![\w])/g, sanToWords)
      .replace(/−\s?(\d)/g, 'minus $1').replace(/\+(\d)/g, 'plus $1')
      .replace(/\bvs\.?\b/gi, 'versus')
      .replace(/\s*&\s*/g, ' and ')
      .replace(/[!?]{2,}/g, '!')
      .replace(/\s*[—–]\s*/g, ', ').replace(/…/g, '... ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return t;
  }
  // Split into short sentences: browsers sound far more natural (and don't cut off) with short utterances.
  function sentences(t) { return t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s && /\w/.test(s)); }

  function speak(text, force) {
    const p = A().prefs;
    if ((!p.voice && !force) || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const v = chooseVoice();
      const natural = v && voiceQuality(v) === 'natural';
      sentences(humanize(text)).forEach((s, i) => {
        const u = new SpeechSynthesisUtterance(s);
        if (v) { u.voice = v; u.lang = v.lang; }
        const excited = /!$/.test(s);
        // Neural voices sound best untouched; standard voices get a little life from tiny rate/pitch changes.
        u.rate = natural ? 1.0 : 0.98 + (excited ? 0.06 : 0) + (i % 2 ? 0.02 : -0.01);
        u.pitch = natural ? 1.0 : excited ? 1.08 : 1.0;
        u.volume = 1;
        speechSynthesis.speak(u);
      });
    } catch (e) { /* speech unavailable */ }
  }

  /* ---------- Dock (floating chat) ---------- */
  let dock = null, ctx = null, popTimer = null;
  const CHIPS = [['💡 Hint', 'Give me a hint'], ['📈 How am I doing?', 'How am I doing?'], ['🔍 Last move?', 'Was my last move good?'], ['🧭 Plan', 'What should my plan be?'], ['🎯 Tip', 'Give me a tip'], ['😂 Joke', 'Tell me a joke']];

  function mountDock() {
    if (dock) return;
    const btn = document.createElement('button');
    btn.className = 'dock-btn';
    btn.title = 'Talk to Rocco';
    btn.setAttribute('aria-label', 'Talk to Rocco, your coach');
    btn.innerHTML = svg('happy') + '<span class="dot"></span>';
    const panel = document.createElement('div');
    panel.className = 'dock hidden';
    panel.setAttribute('role', 'dialog');
    panel.innerHTML = `
      <div class="dock-head">${avatar('happy')}<div class="sp"><b>Rocco</b><small>Your rock-star chess coach</small></div>
        <button class="v" title="Rocco's voice on/off"></button><button class="x" title="Close">✕</button></div>
      <div class="dock-log" aria-live="polite"></div>
      <div class="dock-chips">${CHIPS.map(([l, q]) => `<button data-q="${esc(q)}">${l}</button>`).join('')}</div>
      <form class="dock-form"><input placeholder="Ask Rocco anything about chess…" maxlength="160" aria-label="Message Rocco"><button class="btn primary small" type="submit">Send</button></form>`;
    document.body.append(btn, panel);
    dock = { btn, panel, log: $('.dock-log', panel), open: false, greeted: false };
    const setV = () => { $('.v', panel).textContent = A().prefs.voice ? '🔊' : '🔇'; };
    setV();
    $('.v', panel).onclick = () => { const p = A().prefs; p.voice = !p.voice; A().savePrefs(); setV(); if (p.voice) speak('Voice on. Let\'s rock!', true); else speechSynthesis && speechSynthesis.cancel(); };
    $('.x', panel).onclick = () => toggle(false);
    btn.onclick = () => toggle(!dock.open);
    panel.querySelectorAll('.dock-chips button').forEach((b) => (b.onclick = () => ask(b.dataset.q)));
    $('.dock-form', panel).onsubmit = (e) => { e.preventDefault(); const i = $('input', panel); const q = i.value.trim(); if (q) { i.value = ''; ask(q); } };
    dock.setV = setV;
  }
  function toggle(open) {
    mountDock();
    dock.open = open;
    dock.panel.classList.toggle('hidden', !open);
    dock.btn.classList.remove('unread');
    clearPop();
    if (open) {
      dock.setV();
      if (!dock.greeted) { dock.greeted = true; addMsg('r', pick(LINES.greet) + ' Ask me for a hint, how you\'re doing, a tip — or just a joke.'); }
      setTimeout(() => $('input', dock.panel).focus(), 50);
    }
  }
  function addMsg(who, html) {
    mountDock();
    const d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = html;
    dock.log.appendChild(d);
    dock.log.scrollTop = dock.log.scrollHeight;
  }
  function clearPop() { clearTimeout(popTimer); document.querySelectorAll('.dock-pop').forEach((n) => n.remove()); }
  function pop(text) {
    clearPop();
    const p = document.createElement('div');
    p.className = 'dock-pop';
    p.innerHTML = text;
    p.onclick = () => toggle(true);
    document.body.appendChild(p);
    dock.btn.classList.add('talking');
    setTimeout(() => dock.btn.classList.remove('talking'), 1400);
    popTimer = setTimeout(() => p.remove(), 4200);
  }

  /* Rocco says something. opts: {pop: show popup when dock is closed, speak: default true} */
  function say(text, mood = 'happy', opts = {}) {
    mountDock();
    addMsg('r', text);
    if (!dock.open) { if (opts.pop !== false) pop(text); else dock.btn.classList.add('unread'); }
    if (opts.speak !== false) speak(text);
  }
  function chatty(level) { // level: 1 important, 2 normal, 3 chatty
    const c = A().prefs.chatty || 'normal';
    return level <= (c === 'quiet' ? 1 : c === 'chatty' ? 3 : 2);
  }

  /* ---------- Brain ---------- */
  function ask(q) {
    addMsg('u', esc(q));
    const typing = setTimeout(() => {}, 0);
    setTimeout(() => { clearTimeout(typing); const a = answer(q); if (a) { addMsg('r', a); speak(a); } }, 260);
  }

  function evalFor(chess, color) {
    const r = Engine.bestMove(chess, { depth: 3, timeMs: 700 });
    if (!r) return { score: chess.inCheck() ? (chess.turn === color ? -1e5 : 1e5) : 0, best: null };
    return { score: chess.turn === color ? r.score : -r.score, best: r.uci };
  }
  function describeScore(s) {
    if (s > 90000) return 'You have a forced checkmate! Find it! 🔥';
    if (s < -90000) return 'Uh-oh — there\'s a checkmate coming against you. Look for the best defence.';
    const p = (Math.abs(s) / 100).toFixed(1);
    if (s > 500) return `You're crushing it — about +${p} pawns up. Keep it simple and finish the show.`;
    if (s > 150) return `You're clearly better (about +${p}). Keep the pressure on!`;
    if (s > 50) return `You've got a small edge (about +${p}). Nice and steady.`;
    if (s >= -50) return 'It\'s dead even right now. Anyone\'s gig!';
    if (s >= -150) return `You're a little worse (about −${p}). Stay solid and look for chances.`;
    if (s >= -500) return `You're behind (about −${p}). Look for tactics — checks, captures, threats!`;
    return `Rough night — about −${p}. Don't give up; set traps and make it tricky!`;
  }
  function hanging(chess, color) {
    const them = color === 'w' ? 'b' : 'w';
    const NAMES = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };
    const out = [];
    for (let i = 0; i < 64; i++) {
      const p = chess.board[i];
      if (!p || Chess.pcColor(p) !== color) continue;
      const t = p.toLowerCase();
      if (t === 'k') continue;
      if (chess._attacked(i, them) && !chess._attacked(i, color)) out.push(`${NAMES[t]} on ${Chess.sqName(i)}`);
    }
    return out;
  }
  function planFor(chess, color) {
    const n = chess.history().length || (chess.fullmove - 1) * 2;
    const b = chess.board;
    let material = 0;
    for (const p of b) if (p && !'kKpP'.includes(p)) material += { q: 9, r: 5, b: 3, n: 3 }[p.toLowerCase()];
    const tips = [];
    const hang = hanging(chess, color);
    if (hang.length) tips.push(`Careful — your ${hang.slice(0, 2).join(' and ')} ${hang.length > 1 ? 'are' : 'is'} undefended and under attack!`);
    if (material <= 26) tips.push('This is an endgame: activate your king, and push your passed pawns towards promotion.');
    else if (n < 20) {
      const back = color === 'w' ? ['b1', 'c1', 'f1', 'g1'] : ['b8', 'c8', 'f8', 'g8'];
      const minor = color === 'w' ? ['N', 'B', 'B', 'N'] : ['n', 'b', 'b', 'n'];
      const undeveloped = back.filter((s, i) => chess.get(s) === minor[i]).length;
      const k = chess.kings[color], kf = k & 7;
      if (undeveloped >= 2) tips.push(`Get your pieces out — ${undeveloped} of your knights and bishops are still at home.`);
      if (kf === 4) tips.push('Castle soon so your king is safe.');
      if (!tips.length) tips.push('Good development! Now connect your rooks and look for a target in the centre.');
    } else tips.push('Middlegame time: look for checks, captures and threats, and point your pieces at the enemy king.');
    return tips.join(' ');
  }

  function answer(raw) {
    const q = raw.toLowerCase();
    const c = ctx && ctx.chess ? ctx.chess() : null;
    const color = ctx ? ctx.userColor || (c && c.turn) : null;
    if (/\b(hint|help me|stuck|best move|what (should|do) i (play|move)|which move)\b/.test(q)) {
      if (ctx && ctx.hint) { const r = ctx.hint(); return r || 'Check the board — I\'ve marked something for you. 💡'; }
      return 'Open a game, a puzzle or a lesson task and I\'ll point you in the right direction!';
    }
    if (/(how am i|how.*doing|evaluat|am i winning|am i losing|who.*(better|winning)|score|position)/.test(q)) {
      if (!c) return 'Start a game or puzzle and I\'ll tell you who\'s rocking it.';
      return describeScore(evalFor(c, color).score);
    }
    if (/(last move|my move|was (that|it)|why (was|is)|good move|bad move|mistake|blunder)/.test(q)) {
      if (ctx && ctx.lastReview) { const r = ctx.lastReview(); if (r) return r; }
      return 'Make a move in a game against me or a friend, and I\'ll review it for you.';
    }
    if (/(plan|strategy|what now|focus|idea|what next|advice for)/.test(q)) {
      if (!c) return 'General plan: develop your pieces, control the centre, castle early. Open a game and I\'ll get specific!';
      return planFor(c, color);
    }
    for (const [k, v] of Object.entries(PIECES)) if (q.includes(k) || (k === 'knight' && q.includes('horse'))) return v;
    for (const [k, v] of Object.entries(RULES)) if (q.includes(k)) return v;
    if (/\bcheck\b/.test(q)) return 'Check means the king is attacked. You must deal with it: move the king, block, or capture the attacker.';
    if (/(tip|advice|improve|better at|get good)/.test(q)) return '🎯 ' + pick(TIPS);
    if (/(joke|funny|laugh)/.test(q)) return pick(JOKES);
    if (/(who are you|your name|what are you|about you)/.test(q)) return 'I\'m Rocco — a rook with sunglasses, a lightning bolt, and a passion for loud chess. I coach lessons, puzzles and games. 🎸';
    if (/(rating|level|how strong|my elo)/.test(q)) {
      const pr = A().progress.rating, ad = A().adaptiveRating();
      return `Your puzzle rating is ${pr}. In Adaptive mode I'm currently playing at about ${ad} — and I adjust after every game.`;
    }
    if (/(sing|song|music|rock|guitar)/.test(q)) return '🎵 Push the pawn, take the knight, castle early, win the fight! 🎸 …I\'ll stick to coaching.';
    if (/^(hi|hello|hey|yo|sup|hiya)\b/.test(q)) return pick(LINES.greet);
    if (/(thank|thx|cheers)/.test(q)) return 'Anytime, rockstar! 🤘';
    if (/(sad|lost|lose|bad at|give up|hard)/.test(q)) return 'Every legend started out hitting wrong notes. Do a lesson, solve a puzzle a day, and you\'ll hear the difference. 💪';
    return 'I\'m a rook, not a search engine 🎸 — try asking for a hint, how you\'re doing, a plan, how a piece moves, a tip, or a joke!';
  }

  /* ---------- Move review (used by games) ---------- */
  // best: score (side-to-move perspective) before the move; after: score for the mover after the move.
  function classify(loss, wasBest) {
    if (wasBest || loss <= 10) return 'best';
    if (loss < 60) return 'good';
    if (loss < 130) return 'inaccuracy';
    if (loss < 300) return 'mistake';
    return 'blunder';
  }

  window.Coach = {
    name: 'Rocco', svg, avatar, LINES, JOKES, TIPS, speak, say, pick, chatty, classify, answer, humanize, voiceScore, voiceQuality,
    voices: () => { loadVoices(); return voices; }, currentVoice: () => chooseVoice(),
    line(kind) { return pick(LINES[kind] || LINES.good); },
    setContext(c) { ctx = c; },
    clearContext() { ctx = null; },
    mountDock, open: () => toggle(true),
    refreshVoiceButton() { if (dock) dock.setV(); },
  };
})();
