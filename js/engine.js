/* Outpost coach engine — alpha-beta search for the computer opponent and hints,
   plus a small forced-mate solver used by puzzles and lessons. */
(function (global) {
  'use strict';
  const Chess = global.Chess || (typeof require !== 'undefined' ? require('./chess.js') : null);

  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const PST = {
    p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
    ke: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50],
  };
  const MATE = 100000, INF = 1e9;
  const mirror = (i) => ((7 - (i >> 3)) << 3) | (i & 7);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  function evaluate(ch) {
    const b = ch.board;
    let score = 0, nonPawn = 0;
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (p && p !== 'k' && p !== 'K' && p !== 'p' && p !== 'P') nonPawn += VAL[p.toLowerCase()];
    }
    const endgame = nonPawn <= 1600;
    let wb = 0, bb = 0;
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p) continue;
      const white = p < 'a';
      let t = p.toLowerCase();
      if (t === 'b') { if (white) wb++; else bb++; }
      const table = t === 'k' && endgame ? PST.ke : PST[t];
      const v = VAL[t] + table[white ? i : mirror(i)];
      score += white ? v : -v;
    }
    if (wb >= 2) score += 30;
    if (bb >= 2) score -= 30;
    return score;
  }

  function orderMoves(moves, first) {
    for (const m of moves) {
      let s = 0;
      if (m.captured) s += 10 * VAL[m.captured.toLowerCase()] - VAL[m.piece.toLowerCase()] + 1000;
      if (m.promotion) s += VAL[m.promotion] + 900;
      if (first && m.from === first.from && m.to === first.to && m.promotion === first.promotion) s += 1e6;
      m._s = s;
    }
    moves.sort((a, b) => b._s - a._s);
    return moves;
  }

  function quiesce(ch, alpha, beta, ctx, qd) {
    ctx.nodes++;
    const stand = evaluate(ch) * (ch.turn === 'w' ? 1 : -1);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (qd > 6) return alpha;
    const us = ch.turn, them = us === 'w' ? 'b' : 'w';
    const caps = orderMoves(ch._pseudo(true));
    for (const m of caps) {
      ch._make(m);
      if (ch._attacked(ch.kings[us], them)) { ch._unmake(m); continue; }
      const score = -quiesce(ch, -beta, -alpha, ctx, qd + 1);
      ch._unmake(m);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function search(ch, depth, alpha, beta, ply, ctx) {
    if ((++ctx.nodes & 1023) === 0 && now() > ctx.deadline) ctx.stop = true;
    if (ctx.stop) return 0;
    const inCheck = ch.inCheck();
    if (inCheck && ply < 12) depth++;
    if (depth <= 0) return quiesce(ch, alpha, beta, ctx, 0);
    const moves = ch._legal();
    if (!moves.length) return inCheck ? -MATE + ply : 0;
    if (ch.halfmove >= 100) return 0;
    orderMoves(moves, null);
    let best = -INF;
    for (const m of moves) {
      ch._make(m);
      const score = -search(ch, depth - 1, -beta, -alpha, ply + 1, ctx);
      ch._unmake(m);
      if (ctx.stop) return 0;
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    return best;
  }

  /* Returns { uci, score } for the side to move.
     opts: depth (max), timeMs, noise (centipawns of random jitter at the root), randomChance */
  function bestMove(chess, opts = {}) {
    const ch = new Chess(chess.fen());
    const maxDepth = opts.depth || 3, noise = opts.noise || 0;
    const ctx = { nodes: 0, stop: false, deadline: now() + (opts.timeMs || 1500) };
    const root = ch._legal();
    if (!root.length) return null;
    const toUci = (m) => Chess.sqName(m.from) + Chess.sqName(m.to) + (m.promotion || '');
    if (opts.randomChance && Math.random() < opts.randomChance) {
      const m = root[Math.floor(Math.random() * root.length)];
      return { uci: toUci(m), score: 0 };
    }
    let best = root[0], bestScore = -INF;
    for (let d = 1; d <= maxDepth; d++) {
      orderMoves(root, best);
      let alpha = -INF, iterBest = null, iterScore = -INF;
      for (const m of root) {
        ch._make(m);
        let score = noise ? -search(ch, d - 1, -INF, INF, 1, ctx) : -search(ch, d - 1, -INF, -alpha, 1, ctx);
        ch._unmake(m);
        if (ctx.stop) break;
        if (noise && Math.abs(score) < MATE - 1000) score += (Math.random() * 2 - 1) * noise;
        if (score > iterScore) { iterScore = score; iterBest = m; }
        if (score > alpha) alpha = score;
      }
      if (ctx.stop && !iterBest) break;
      if (iterBest && (!ctx.stop || iterScore > bestScore)) { best = iterBest; bestScore = iterScore; }
      if (ctx.stop || bestScore > MATE - 1000) break;
    }
    return { uci: toUci(best), score: bestScore, nodes: ctx.nodes };
  }

  /* ---------- Forced mate solver ---------- */
  // Side to move can force mate in <= n of its own moves. Returns internal move or null.
  function mateIn(ch, n) {
    const moves = ch._legal();
    // try checks first: cheap heuristic ordering
    const scored = moves.map((m) => { ch._make(m); const c = ch.inCheck(); ch._unmake(m); return { m, c }; });
    scored.sort((a, b) => b.c - a.c);
    for (const { m } of scored) {
      ch._make(m);
      const ok = defenderLoses(ch, n - 1);
      ch._unmake(m);
      if (ok) return m;
    }
    return null;
  }
  // Side to move (defender) is mated now, or every reply allows mate in <= n.
  function defenderLoses(ch, n) {
    const replies = ch._legal();
    if (!replies.length) return ch.inCheck();
    if (n <= 0) return false;
    for (const r of replies) {
      ch._make(r);
      const ok = !!mateIn(ch, n);
      ch._unmake(r);
      if (!ok) return false;
    }
    return true;
  }
  // Pick a defence that delays mate as long as possible (defender to move, mate in <= n).
  function bestDefense(ch, n) {
    const replies = ch._legal();
    let best = null, bestLen = -1;
    for (const r of replies) {
      ch._make(r);
      let len = n + 1;
      for (let k = 1; k <= n; k++) if (mateIn(ch, k)) { len = k; break; }
      ch._unmake(r);
      if (len > bestLen || (len === bestLen && Math.random() < 0.3)) { bestLen = len; best = r; }
    }
    return best;
  }

  const toUci = (m) => (m ? Chess.sqName(m.from) + Chess.sqName(m.to) + (m.promotion || '') : null);

  const Engine = {
    evaluate,
    bestMove,
    /* Score every legal move (side-to-move perspective), best first. Used to check puzzles have one clear answer. */
    scoreMoves(chess, depth = 3, timeMs = 4000) {
      const ch = new Chess(chess.fen());
      const ctx = { nodes: 0, stop: false, deadline: now() + timeMs };
      const out = [];
      for (const m of ch._legal()) {
        ch._make(m);
        const s = -search(ch, depth - 1, -INF, INF, 1, ctx);
        ch._unmake(m);
        out.push({ uci: toUci(m), score: s });
      }
      out.sort((a, b) => b.score - a.score);
      return ctx.stop ? null : out;
    },
    mateMove(chess, n) { return toUci(mateIn(new Chess(chess.fen()), n)); },
    // after the attacker's move: does every defence still lose within n attacker moves?
    stillMating(chess, n) { return defenderLoses(new Chess(chess.fen()), n); },
    defenseMove(chess, n) { return toUci(bestDefense(new Chess(chess.fen()), n)); },
    LEVELS: [
      { name: 'Beginner', depth: 1, noise: 220, randomChance: 0.25, timeMs: 400 },
      { name: 'Casual', depth: 2, noise: 70, randomChance: 0.05, timeMs: 800 },
      { name: 'Club', depth: 3, noise: 15, timeMs: 1500 },
      { name: 'Strong', depth: 5, noise: 0, timeMs: 2500 },
      { name: 'Adaptive', adaptive: true },
    ],
    ADAPTIVE: 4,
    /* Search settings for an adaptive rating (300–2200). coachEval: the coach's current advantage in
       centipawns (from its own side) — used as a rubber band so lopsided games stay fun. */
    adaptiveParams(rating, coachEval = 0) {
      const r = Math.max(300, Math.min(2200, rating));
      const p = {
        depth: r < 650 ? 1 : r < 950 ? 2 : r < 1350 ? 3 : r < 1750 ? 4 : 5,
        noise: Math.max(0, Math.min(260, (1700 - r) / 4.5)),
        randomChance: r < 600 ? 0.18 : r < 800 ? 0.09 : r < 1000 ? 0.035 : 0,
        timeMs: Math.round(Math.max(300, Math.min(2500, 300 + (r - 300) * 1.2))),
      };
      if (coachEval > 400 && r < 1600) { p.noise += 90; p.randomChance += 0.05; }
      else if (coachEval < -300) { p.noise *= 0.5; p.randomChance = 0; }
      return p;
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else global.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
