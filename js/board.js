/* Interactive chessboard: click-to-move, drag & drop, legal-move dots, arrows, marks, promotion picker. */
(function (global) {
  'use strict';
  const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  const VS = '︎';
  const LETTER = { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: 'P' };
  const glyph = (p) => (Board.pieceSet === 'letters' ? LETTER[p.toLowerCase()] : GLYPH[p.toLowerCase()] + VS);

  function pieceSpan(p) {
    const c = p < 'a' ? 'w' : 'b';
    return `<span class="pc pc-${c}" data-p="${p}">${glyph(p)}</span>`;
  }

  /* Static (non-interactive) mini board HTML — used for thumbnails. */
  function miniBoard(fen, orientation) {
    const rows = fen.split(' ')[0].split('/');
    const cells = [];
    rows.forEach((row) => { for (const ch of row) { if (/\d/.test(ch)) for (let k = 0; k < +ch; k++) cells.push(null); else cells.push(ch); } });
    let html = '<div class="mini">';
    for (let d = 0; d < 64; d++) {
      const i = orientation === 'b' ? 63 - d : d;
      const light = ((i >> 3) + (i & 7)) % 2 === 0;
      html += `<div class="sq ${light ? 'light' : 'dark'}">${cells[i] ? pieceSpan(cells[i]) : ''}</div>`;
    }
    return html + '</div>';
  }

  class Board {
    constructor(el, opts = {}) {
      this.el = el;
      this.orientation = opts.orientation || 'w';
      this.onMove = opts.onMove || null;
      this.movable = opts.movable || (() => false);
      this.movesFor = opts.movesFor || null; // optional (squareName) => legal move list override
      this.onSquare = opts.onSquare || null; // optional (squareName) => void, for square-clicking games
      this.coords = opts.coords !== undefined ? opts.coords : null; // null = follow Board.defaults
      this.chess = null;
      this.selected = null;
      this.lastMove = null;
      this.marks = [];
      this.arrows = [];
      this.hintSquares = [];
      this.drag = null;
      this.promo = null;
      el.classList.add('board');
      el.innerHTML = '<div class="squares"></div><svg class="arrows" viewBox="0 0 8 8" preserveAspectRatio="none"></svg><div class="promo hidden"></div>';
      this.sqWrap = el.querySelector('.squares');
      this.svg = el.querySelector('.arrows');
      this.promoEl = el.querySelector('.promo');
      this._down = this._down.bind(this);
      this._moveEv = this._moveEv.bind(this);
      this._up = this._up.bind(this);
      el.addEventListener('pointerdown', this._down);
      el.addEventListener('pointermove', this._moveEv);
      el.addEventListener('pointerup', this._up);
      el.addEventListener('pointercancel', () => this._cancelDrag());
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    destroy() {
      this.el.removeEventListener('pointerdown', this._down);
      this.el.innerHTML = '';
    }

    setOrientation(o) { if (o !== this.orientation) { this.orientation = o; this.render(); } }
    flip() { this.setOrientation(this.orientation === 'w' ? 'b' : 'w'); }

    /* lastMove: public move object ({from,to,flags}) or null */
    setPosition(chess, lastMove, opts = {}) {
      this.chess = chess;
      this.lastMove = lastMove || null;
      this.selected = null;
      this.hintSquares = [];
      if (!opts.keepAnnotations) { this.arrows = []; this.marks = []; }
      this._closePromo();
      this.render();
      const animate = opts.animate !== false && !this._skipAnim && Board.defaults.animate;
      this._skipAnim = false;
      const am = opts.animMove !== undefined ? opts.animMove : lastMove;
      if (animate && am) {
        if (opts.reverse) this._animate(am.to, am.from, null);
        else this._animate(am.from, am.to, am);
      }
    }

    annotate({ marks, arrows, hintSquares } = {}) {
      if (marks) this.marks = marks;
      if (arrows) this.arrows = arrows;
      if (hintSquares) this.hintSquares = hintSquares;
      this.render();
    }

    _disp(i) { const d = this.orientation === 'w' ? i : 63 - i; return { col: d & 7, row: d >> 3 }; }

    _targets(from) {
      if (from == null || !this.chess) return [];
      const name = Chess.sqName(from);
      return this.movesFor ? this.movesFor(name) : this.chess.moves({ square: name });
    }

    render() {
      const c = this.chess;
      const S = Chess.sqIndex;
      const targets = this._targets(this.selected);
      const tset = new Map();
      for (const m of targets) tset.set(S(m.to), m);
      const checkSq = c && c.inCheck() ? c.kings[c.turn] : -1;
      const last = this.lastMove ? [S(this.lastMove.from), S(this.lastMove.to)] : [];
      const marks = new Set(this.marks.map(S));
      const hints = new Set(this.hintSquares.map(S));
      const showCoords = this.coords === null ? Board.defaults.coords : this.coords;
      let html = '';
      for (let d = 0; d < 64; d++) {
        const i = this.orientation === 'w' ? d : 63 - d;
        const r = i >> 3, f = i & 7;
        const light = (r + f) % 2 === 0;
        const p = c ? c.board[i] : null;
        let cls = 'sq ' + (light ? 'light' : 'dark');
        if (last.includes(i)) cls += ' last';
        if (i === this.selected) cls += ' sel';
        if (i === checkSq) cls += ' check';
        if (marks.has(i)) cls += ' mark';
        if (hints.has(i)) cls += ' hint';
        if (tset.has(i)) cls += p || tset.get(i).flags === 'e' ? ' cap' : ' dot';
        let inner = '';
        if (showCoords && d >= 56) inner += `<span class="coord file">${'abcdefgh'[f]}</span>`;
        if (showCoords && (d & 7) === 0) inner += `<span class="coord rank">${8 - r}</span>`;
        if (p) inner += pieceSpan(p);
        html += `<div class="${cls}" data-i="${i}">${inner}</div>`;
      }
      this.sqWrap.innerHTML = html;
      this._drawArrows();
      const canMove = c && this.movable(c.turn);
      this.el.classList.toggle('interactive', !!canMove);
    }

    _drawArrows() {
      const S = Chess.sqIndex;
      let svg = '<defs>';
      const colors = { g: '#3fae5b', y: '#e8a93b', r: '#e05353', b: '#4a8fe0' };
      for (const [k, col] of Object.entries(colors)) {
        svg += `<marker id="ah-${k}-${this._uid()}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${col}"/></marker>`;
      }
      svg += '</defs>';
      for (const a of this.arrows) {
        const [from, to, color = 'g'] = a;
        const p1 = this._disp(S(from)), p2 = this._disp(S(to));
        const x1 = p1.col + 0.5, y1 = p1.row + 0.5, x2 = p2.col + 0.5, y2 = p2.row + 0.5;
        const len = Math.hypot(x2 - x1, y2 - y1), sh = 0.32;
        const ex = x2 - ((x2 - x1) / len) * sh, ey = y2 - ((y2 - y1) / len) * sh;
        svg += `<line x1="${x1}" y1="${y1}" x2="${ex}" y2="${ey}" stroke="${colors[color] || color}" stroke-width="0.17" stroke-linecap="round" opacity="0.85" marker-end="url(#ah-${color}-${this._uid()})"/>`;
      }
      this.svg.innerHTML = svg;
    }

    _uid() { if (!this.__uid) this.__uid = Math.random().toString(36).slice(2, 8); return this.__uid; }

    _animate(fromName, toName, move) {
      const S = Chess.sqIndex;
      const anim = (f, t) => {
        const el = this.sqWrap.querySelector(`[data-i="${t}"] .pc`);
        if (!el) return;
        const a = this._disp(f), b = this._disp(t);
        el.style.transition = 'none';
        el.style.transform = `translate(${(a.col - b.col) * 100}%, ${(a.row - b.row) * 100}%)`;
        el.style.zIndex = 5;
        void el.offsetWidth;
        el.style.transition = 'transform 160ms ease-out';
        el.style.transform = '';
        setTimeout(() => { el.style.zIndex = ''; }, 200);
      };
      anim(S(fromName), S(toName));
      if (move && (move.flags === 'k' || move.flags === 'q')) {
        const from = S(move.from);
        if (move.flags === 'k') anim(from + 3, from + 1); else anim(from - 4, from - 1);
      }
    }

    _sqAt(e) {
      const rect = this.sqWrap.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
      const col = Math.floor((x / rect.width) * 8), row = Math.floor((y / rect.height) * 8);
      const d = row * 8 + col;
      return this.orientation === 'w' ? d : 63 - d;
    }

    _resolveTarget(i) {
      if (this.selected == null) return null;
      const S = Chess.sqIndex;
      const moves = this._targets(this.selected);
      let list = moves.filter((m) => S(m.to) === i);
      if (!list.length) {
        // allow castling by clicking own rook
        const from = this.selected;
        list = moves.filter((m) => (m.flags === 'k' && i === from + 3) || (m.flags === 'q' && i === from - 4));
      }
      return list.length ? list : null;
    }

    _down(e) {
      if (this.promo) return;
      if (e.button !== undefined && e.button !== 0) return;
      if (this.onSquare) {
        const sq = this._sqAt(e);
        if (sq != null) { e.preventDefault(); this.onSquare(Chess.sqName(sq)); }
        return;
      }
      const c = this.chess;
      if (!c || !this.movable(c.turn)) return;
      const i = this._sqAt(e);
      if (i == null) return;
      const list = this._resolveTarget(i);
      if (list) { e.preventDefault(); this._commit(list); return; }
      const p = c.board[i];
      if (p && Chess.pcColor(p) === c.turn) {
        e.preventDefault();
        const wasSelected = this.selected === i;
        this.selected = i;
        this.render();
        this.drag = { from: i, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, wasSelected, id: e.pointerId };
        try { this.el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      } else if (this.selected != null) {
        this.selected = null;
        this.render();
      }
    }

    _moveEv(e) {
      const d = this.drag;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 5) return;
      const rect = this.sqWrap.getBoundingClientRect();
      const size = rect.width / 8;
      if (!d.moved) {
        d.moved = true;
        const src = this.sqWrap.querySelector(`[data-i="${d.from}"] .pc`);
        if (src) src.classList.add('ghosted');
        const g = document.createElement('div');
        g.className = 'drag-ghost';
        g.innerHTML = pieceSpan(this.chess.board[d.from]);
        g.style.width = g.style.height = size + 'px';
        this.el.appendChild(g);
        d.ghost = g;
      }
      const brect = this.el.getBoundingClientRect();
      d.ghost.style.transform = `translate(${e.clientX - brect.left - size / 2}px, ${e.clientY - brect.top - size / 2}px)`;
      // hover highlight
      const i = this._sqAt(e);
      this.sqWrap.querySelectorAll('.hover').forEach((n) => n.classList.remove('hover'));
      if (i != null) { const n = this.sqWrap.querySelector(`[data-i="${i}"]`); if (n) n.classList.add('hover'); }
    }

    _up(e) {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      if (d.ghost) d.ghost.remove();
      if (d.moved) {
        const i = this._sqAt(e);
        const list = i != null && i !== d.from ? this._resolveTarget(i) : null;
        if (list) { this._skipAnim = true; this._commit(list); return; }
        this.render();
      } else if (d.wasSelected) {
        this.selected = null;
        this.render();
      }
    }

    _cancelDrag() {
      if (this.drag && this.drag.ghost) this.drag.ghost.remove();
      this.drag = null;
      this.render();
    }

    _commit(list) {
      const m = list[0];
      if (list.length > 1 && m.promotion) { this._askPromo(m); return; }
      this.selected = null;
      if (this.onMove) this.onMove({ from: m.from, to: m.to, promotion: m.promotion });
    }

    _askPromo(m) {
      const color = this.chess.turn;
      this.promo = m;
      const pieces = ['q', 'r', 'b', 'n'];
      const names = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' };
      this.promoEl.innerHTML = '<div class="promo-box"><div class="promo-title">Promote to</div><div class="promo-row">' +
        pieces.map((p) => `<button class="promo-btn" data-p="${p}" title="${names[p]}">${pieceSpan(color === 'w' ? p.toUpperCase() : p)}</button>`).join('') +
        '</div></div>';
      this.promoEl.classList.remove('hidden');
      const handler = (ev) => {
        ev.stopPropagation();
        const b = ev.target.closest('.promo-btn');
        if (b) {
          this._closePromo();
          this.selected = null;
          if (this.onMove) this.onMove({ from: m.from, to: m.to, promotion: b.dataset.p });
        } else if (!ev.target.closest('.promo-box')) {
          this._closePromo();
          this.selected = null;
          this.render();
        }
      };
      this.promoEl.onpointerdown = handler;
    }

    flash(name, kind = 'good') {
      const el = this.sqWrap.querySelector(`[data-i="${Chess.sqIndex(name)}"]`);
      if (!el) return;
      el.classList.remove('flash-good', 'flash-bad');
      void el.offsetWidth;
      el.classList.add('flash-' + kind);
      setTimeout(() => el.classList.remove('flash-' + kind), 450);
    }

    _closePromo() {
      this.promo = null;
      this.promoEl.classList.add('hidden');
      this.promoEl.innerHTML = '';
    }
  }

  Board.pieceSet = 'glyph';
  Board.defaults = { coords: true, animate: true };
  Board.glyph = glyph;
  Board.pieceSpan = pieceSpan;
  Board.miniBoard = miniBoard;
  global.Board = Board;
})(window);
