/* Outpost chess rules engine — move generation, legality, SAN, game-end detection.
   Board index 0 = a8 ... 63 = h1. Uppercase = white, lowercase = black. */
(function (global) {
  'use strict';

  const FILES = 'abcdefgh';
  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const sqName = (i) => FILES[i & 7] + (8 - (i >> 3));
  const sqIndex = (s) => {
    if (!s || s.length < 2) return -1;
    const f = FILES.indexOf(s[0]);
    const r = parseInt(s[1], 10);
    if (f < 0 || !(r >= 1 && r <= 8)) return -1;
    return (8 - r) * 8 + f;
  };
  const pcColor = (p) => (p < 'a' ? 'w' : 'b');
  const typeOf = (p) => p.toLowerCase();

  // Precomputed attack tables
  const KNIGHT = [], KING = [], BRAYS = [], RRAYS = [];
  for (let i = 0; i < 64; i++) {
    const r = i >> 3, f = i & 7;
    KNIGHT[i] = []; KING[i] = []; BRAYS[i] = []; RRAYS[i] = [];
    for (const [dr, df] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
      const rr = r + dr, ff = f + df;
      if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) KNIGHT[i].push(rr * 8 + ff);
    }
    for (const [dr, df] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
      const rr = r + dr, ff = f + df;
      if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) KING[i].push(rr * 8 + ff);
    }
    const ray = (dr, df) => {
      const out = [];
      let rr = r + dr, ff = f + df;
      while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) { out.push(rr * 8 + ff); rr += dr; ff += df; }
      return out;
    };
    for (const [dr, df] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) BRAYS[i].push(ray(dr, df));
    for (const [dr, df] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) RRAYS[i].push(ray(dr, df));
  }

  class Chess {
    constructor(fen) { this.load(fen || START_FEN); }

    load(fen) {
      const parts = String(fen).trim().split(/\s+/);
      if (parts.length < 2) throw new Error('Invalid FEN: ' + fen);
      const rows = parts[0].split('/');
      if (rows.length !== 8) throw new Error('Invalid FEN rows: ' + fen);
      const board = new Array(64).fill(null);
      for (let r = 0; r < 8; r++) {
        let f = 0;
        for (const ch of rows[r]) {
          if (/[1-8]/.test(ch)) f += +ch;
          else if ('pnbrqkPNBRQK'.includes(ch)) { if (f > 7) throw new Error('Invalid FEN: ' + fen); board[r * 8 + f] = ch; f++; }
          else throw new Error('Invalid FEN char: ' + fen);
        }
        if (f !== 8) throw new Error('Invalid FEN row length: ' + fen);
      }
      this.board = board;
      this.turn = parts[1] === 'b' ? 'b' : 'w';
      const c = parts[2] || '-';
      this.castling = {
        K: c.includes('K') && board[60] === 'K' && board[63] === 'R',
        Q: c.includes('Q') && board[60] === 'K' && board[56] === 'R',
        k: c.includes('k') && board[4] === 'k' && board[7] === 'r',
        q: c.includes('q') && board[4] === 'k' && board[0] === 'r',
      };
      this.ep = !parts[3] || parts[3] === '-' ? -1 : sqIndex(parts[3]);
      this.halfmove = parseInt(parts[4] || '0', 10) || 0;
      this.fullmove = parseInt(parts[5] || '1', 10) || 1;
      this.kings = { w: board.indexOf('K'), b: board.indexOf('k') };
      this._stack = [];
      this._hist = [];
      this._positions = [this._posKey()];
      this.startFen = this.fen();
      return this;
    }

    reset() { return this.load(START_FEN); }

    fen() {
      let s = '';
      for (let r = 0; r < 8; r++) {
        let empty = 0;
        for (let f = 0; f < 8; f++) {
          const p = this.board[r * 8 + f];
          if (!p) empty++;
          else { if (empty) { s += empty; empty = 0; } s += p; }
        }
        if (empty) s += empty;
        if (r < 7) s += '/';
      }
      let c = (this.castling.K ? 'K' : '') + (this.castling.Q ? 'Q' : '') + (this.castling.k ? 'k' : '') + (this.castling.q ? 'q' : '');
      return `${s} ${this.turn} ${c || '-'} ${this.ep >= 0 ? sqName(this.ep) : '-'} ${this.halfmove} ${this.fullmove}`;
    }

    _posKey() {
      return this.board.map((p) => p || '.').join('') + this.turn +
        (this.castling.K ? 'K' : '') + (this.castling.Q ? 'Q' : '') + (this.castling.k ? 'k' : '') + (this.castling.q ? 'q' : '') + this.ep;
    }

    get(square) { const i = typeof square === 'number' ? square : sqIndex(square); return i >= 0 ? this.board[i] : null; }

    _attacked(sq, by) {
      if (sq < 0) return false;
      const b = this.board, r = sq >> 3, f = sq & 7;
      if (by === 'w') {
        if (r < 7) { if (f > 0 && b[sq + 7] === 'P') return true; if (f < 7 && b[sq + 9] === 'P') return true; }
      } else if (r > 0) {
        if (f > 0 && b[sq - 9] === 'p') return true; if (f < 7 && b[sq - 7] === 'p') return true;
      }
      const w = by === 'w';
      const N = w ? 'N' : 'n', K = w ? 'K' : 'k', B = w ? 'B' : 'b', R = w ? 'R' : 'r', Q = w ? 'Q' : 'q';
      for (const t of KNIGHT[sq]) if (b[t] === N) return true;
      for (const t of KING[sq]) if (b[t] === K) return true;
      for (const ray of BRAYS[sq]) for (const t of ray) { const p = b[t]; if (p) { if (p === B || p === Q) return true; break; } }
      for (const ray of RRAYS[sq]) for (const t of ray) { const p = b[t]; if (p) { if (p === R || p === Q) return true; break; } }
      return false;
    }

    inCheck() { return this._attacked(this.kings[this.turn], this.turn === 'w' ? 'b' : 'w'); }

    _pseudo(capturesOnly) {
      const b = this.board, us = this.turn, them = us === 'w' ? 'b' : 'w';
      const moves = [];
      const isEnemy = (p) => p && pcColor(p) === them;
      for (let i = 0; i < 64; i++) {
        const p = b[i];
        if (!p || pcColor(p) !== us) continue;
        const t = typeOf(p);
        if (t === 'p') {
          const dir = us === 'w' ? -8 : 8, start = us === 'w' ? 6 : 1, promoRow = us === 'w' ? 0 : 7;
          const r = i >> 3, f = i & 7, one = i + dir;
          const add = (to, captured, flags) => {
            if ((to >> 3) === promoRow) {
              for (const pr of ['q', 'r', 'b', 'n']) moves.push({ from: i, to, piece: p, captured, promotion: pr, flags: flags + 'p' });
            } else moves.push({ from: i, to, piece: p, captured, flags });
          };
          if (!b[one] && (!capturesOnly || (one >> 3) === promoRow)) {
            add(one, null, 'n');
            if (!capturesOnly && r === start && !b[one + dir]) moves.push({ from: i, to: one + dir, piece: p, captured: null, flags: 'b' });
          }
          for (const df of [-1, 1]) {
            const ff = f + df;
            if (ff < 0 || ff > 7) continue;
            const to = one + df;
            if (isEnemy(b[to])) add(to, b[to], 'c');
            else if (to === this.ep && !b[to]) {
              const cap = us === 'w' ? 'p' : 'P';
              if (b[us === 'w' ? to + 8 : to - 8] === cap) moves.push({ from: i, to, piece: p, captured: cap, flags: 'e' });
            }
          }
        } else if (t === 'n' || t === 'k') {
          for (const to of (t === 'n' ? KNIGHT : KING)[i]) {
            const q = b[to];
            if (!q) { if (!capturesOnly) moves.push({ from: i, to, piece: p, captured: null, flags: 'n' }); }
            else if (pcColor(q) === them) moves.push({ from: i, to, piece: p, captured: q, flags: 'c' });
          }
          if (t === 'k' && !capturesOnly) this._castles(i, us, them, moves);
        } else {
          const rays = t === 'b' ? BRAYS[i] : t === 'r' ? RRAYS[i] : BRAYS[i].concat(RRAYS[i]);
          for (const ray of rays) for (const to of ray) {
            const q = b[to];
            if (!q) { if (!capturesOnly) moves.push({ from: i, to, piece: p, captured: null, flags: 'n' }); continue; }
            if (pcColor(q) === them) moves.push({ from: i, to, piece: p, captured: q, flags: 'c' });
            break;
          }
        }
      }
      return moves;
    }

    _castles(i, us, them, moves) {
      const b = this.board, c = this.castling;
      if (us === 'w' && i === 60) {
        if (c.K && b[63] === 'R' && !b[61] && !b[62] && !this._attacked(60, them) && !this._attacked(61, them) && !this._attacked(62, them))
          moves.push({ from: 60, to: 62, piece: 'K', captured: null, flags: 'k' });
        if (c.Q && b[56] === 'R' && !b[59] && !b[58] && !b[57] && !this._attacked(60, them) && !this._attacked(59, them) && !this._attacked(58, them))
          moves.push({ from: 60, to: 58, piece: 'K', captured: null, flags: 'q' });
      } else if (us === 'b' && i === 4) {
        if (c.k && b[7] === 'r' && !b[5] && !b[6] && !this._attacked(4, them) && !this._attacked(5, them) && !this._attacked(6, them))
          moves.push({ from: 4, to: 6, piece: 'k', captured: null, flags: 'k' });
        if (c.q && b[0] === 'r' && !b[3] && !b[2] && !b[1] && !this._attacked(4, them) && !this._attacked(3, them) && !this._attacked(2, them))
          moves.push({ from: 4, to: 2, piece: 'k', captured: null, flags: 'q' });
      }
    }

    _make(m) {
      const b = this.board, us = this.turn, them = us === 'w' ? 'b' : 'w';
      this._stack.push({ castling: { ...this.castling }, ep: this.ep, halfmove: this.halfmove, fullmove: this.fullmove, kings: { ...this.kings } });
      b[m.to] = m.promotion ? (us === 'w' ? m.promotion.toUpperCase() : m.promotion) : m.piece;
      b[m.from] = null;
      if (m.flags === 'e') b[us === 'w' ? m.to + 8 : m.to - 8] = null;
      else if (m.flags === 'k') { if (us === 'w') { b[61] = b[63]; b[63] = null; } else { b[5] = b[7]; b[7] = null; } }
      else if (m.flags === 'q') { if (us === 'w') { b[59] = b[56]; b[56] = null; } else { b[3] = b[0]; b[0] = null; } }
      const t = typeOf(m.piece);
      if (t === 'k') {
        this.kings[us] = m.to;
        if (us === 'w') this.castling.K = this.castling.Q = false; else this.castling.k = this.castling.q = false;
      }
      for (const s of [m.from, m.to]) {
        if (s === 63) this.castling.K = false; else if (s === 56) this.castling.Q = false;
        else if (s === 7) this.castling.k = false; else if (s === 0) this.castling.q = false;
      }
      this.ep = -1;
      if (m.flags === 'b') {
        const f = m.to & 7, enemyPawn = us === 'w' ? 'p' : 'P';
        if ((f > 0 && b[m.to - 1] === enemyPawn) || (f < 7 && b[m.to + 1] === enemyPawn)) this.ep = (m.from + m.to) >> 1;
      }
      this.halfmove = t === 'p' || m.captured ? 0 : this.halfmove + 1;
      if (us === 'b') this.fullmove++;
      this.turn = them;
    }

    _unmake(m) {
      const st = this._stack.pop(), b = this.board;
      this.turn = this.turn === 'w' ? 'b' : 'w';
      const us = this.turn;
      b[m.from] = m.piece;
      if (m.flags === 'e') { b[m.to] = null; b[us === 'w' ? m.to + 8 : m.to - 8] = m.captured; }
      else b[m.to] = m.captured || null;
      if (m.flags === 'k') { if (us === 'w') { b[63] = b[61]; b[61] = null; } else { b[7] = b[5]; b[5] = null; } }
      else if (m.flags === 'q') { if (us === 'w') { b[56] = b[59]; b[59] = null; } else { b[0] = b[3]; b[3] = null; } }
      this.castling = st.castling; this.ep = st.ep; this.halfmove = st.halfmove; this.fullmove = st.fullmove; this.kings = st.kings;
    }

    _legal() {
      const us = this.turn, them = us === 'w' ? 'b' : 'w', out = [];
      for (const m of this._pseudo(false)) {
        this._make(m);
        if (!this._attacked(this.kings[us], them)) out.push(m);
        this._unmake(m);
      }
      return out;
    }

    _san(m, legal) {
      let s;
      if (m.flags === 'k') s = 'O-O';
      else if (m.flags === 'q') s = 'O-O-O';
      else {
        const t = typeOf(m.piece);
        if (t === 'p') {
          s = m.captured ? FILES[m.from & 7] + 'x' + sqName(m.to) : sqName(m.to);
          if (m.promotion) s += '=' + m.promotion.toUpperCase();
        } else {
          let dis = '';
          const others = legal.filter((o) => o.piece === m.piece && o.to === m.to && o.from !== m.from);
          if (others.length) {
            const sameFile = others.some((o) => (o.from & 7) === (m.from & 7));
            const sameRank = others.some((o) => (o.from >> 3) === (m.from >> 3));
            if (!sameFile) dis = FILES[m.from & 7];
            else if (!sameRank) dis = String(8 - (m.from >> 3));
            else dis = sqName(m.from);
          }
          s = t.toUpperCase() + dis + (m.captured ? 'x' : '') + sqName(m.to);
        }
      }
      this._make(m);
      if (this.inCheck()) s += this._legal().length === 0 ? '#' : '+';
      this._unmake(m);
      return s;
    }

    _pub(m, san) {
      return {
        from: sqName(m.from), to: sqName(m.to), piece: typeOf(m.piece), color: pcColor(m.piece),
        captured: m.captured ? typeOf(m.captured) : undefined, promotion: m.promotion, flags: m.flags,
        san, uci: sqName(m.from) + sqName(m.to) + (m.promotion || ''),
      };
    }

    moves(opts = {}) {
      const legal = this._legal();
      let list = legal;
      if (opts.square) { const s = sqIndex(opts.square); list = legal.filter((m) => m.from === s); }
      return list.map((m) => this._pub(m, this._san(m, legal)));
    }

    _find(x, legal) {
      if (typeof x === 'string') {
        const s = x.trim();
        if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(s)) {
          return this._find({ from: s.slice(0, 2), to: s.slice(2, 4), promotion: s[4] }, legal);
        }
        const clean = (t) => t.replace(/[+#!?]/g, '').replace(/0/g, 'O');
        const target = clean(s);
        return legal.find((o) => clean(this._san(o, legal)) === target) || null;
      }
      if (x && x.from && x.to) {
        const f = sqIndex(x.from), t = sqIndex(x.to), pr = x.promotion ? x.promotion.toLowerCase() : '';
        return legal.find((o) => o.from === f && o.to === t && (o.promotion ? o.promotion === (pr || 'q') : !pr)) || null;
      }
      return null;
    }

    move(x) {
      const legal = this._legal();
      const m = this._find(x, legal);
      if (!m) return null;
      const san = this._san(m, legal);
      this._make(m);
      const pub = this._pub(m, san);
      this._hist.push({ m, pub });
      this._positions.push(this._posKey());
      return pub;
    }

    undo() {
      const h = this._hist.pop();
      if (!h) return null;
      this._unmake(h.m);
      this._positions.pop();
      return h.pub;
    }

    history() { return this._hist.map((h) => h.pub); }

    isCheckmate() { return this.inCheck() && this._legal().length === 0; }
    isStalemate() { return !this.inCheck() && this._legal().length === 0; }
    isThreefold() {
      const k = this._positions[this._positions.length - 1];
      let n = 0;
      for (const p of this._positions) if (p === k) n++;
      return n >= 3;
    }
    isFiftyMove() { return this.halfmove >= 100; }
    isInsufficientMaterial() {
      const pieces = [];
      for (let i = 0; i < 64; i++) {
        const p = this.board[i];
        if (p && typeOf(p) !== 'k') pieces.push({ t: typeOf(p), sq: i });
      }
      if (pieces.length === 0) return true;
      if (pieces.length === 1 && (pieces[0].t === 'n' || pieces[0].t === 'b')) return true;
      if (pieces.every((p) => p.t === 'b')) {
        const colors = new Set(pieces.map((p) => ((p.sq >> 3) + (p.sq & 7)) % 2));
        return colors.size === 1;
      }
      return false;
    }
    hasMatingMaterial(color) {
      const pieces = [];
      for (const p of this.board) if (p && pcColor(p) === color && typeOf(p) !== 'k') pieces.push(typeOf(p));
      return pieces.length > 0;
    }
    isDraw() { return this.isStalemate() || this.isInsufficientMaterial() || this.isThreefold() || this.isFiftyMove(); }
    isGameOver() { return this._legal().length === 0 || this.isInsufficientMaterial() || this.isThreefold() || this.isFiftyMove(); }

    ascii() {
      let s = '';
      for (let r = 0; r < 8; r++) {
        s += (8 - r) + ' ';
        for (let f = 0; f < 8; f++) s += (this.board[r * 8 + f] || '.') + ' ';
        s += '\n';
      }
      return s + '  a b c d e f g h\n';
    }
  }

  Chess.START_FEN = START_FEN;
  Chess.sqName = sqName;
  Chess.sqIndex = sqIndex;
  Chess.typeOf = typeOf;
  Chess.pcColor = pcColor;

  if (typeof module !== 'undefined' && module.exports) module.exports = Chess;
  else global.Chess = Chess;
})(typeof window !== 'undefined' ? window : globalThis);
