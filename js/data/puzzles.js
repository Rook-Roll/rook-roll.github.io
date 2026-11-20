/* Puzzle set. solution: UCI moves, alternating solver / opponent, starting with the side to move.
   A step may list alternatives separated by "|". mate: N means any move keeping a forced mate in N is accepted. */
(function (global) {
  const PUZZLES = [
    { id: 'p01', title: 'Back-rank blues', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', solution: ['d1d8'], mate: 1, themes: ['Mate in 1', 'Back rank'], rating: 400 },
    { id: 'p02', title: 'Fool\'s reward', fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2', solution: ['d8h4'], mate: 1, themes: ['Mate in 1', 'Opening'], rating: 420 },
    { id: 'p03', title: 'The weakest square', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: ['h5f7'], mate: 1, themes: ['Mate in 1', 'Opening'], rating: 450 },
    { id: 'p04', title: 'Rook roller', fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1', solution: ['a1a8'], mate: 1, themes: ['Mate in 1', 'Endgame'], rating: 450 },
    { id: 'p05', title: 'Return the favour', fen: '6k1/5ppp/8/8/8/8/r4PPP/6K1 b - - 0 1', solution: ['a2a1'], mate: 1, themes: ['Mate in 1', 'Back rank'], rating: 470 },
    { id: 'p06', title: 'The queen\'s kiss', fen: '7k/8/5K2/8/8/8/8/6Q1 w - - 0 1', solution: ['g1g7'], mate: 1, themes: ['Mate in 1', 'Endgame'], rating: 500 },
    { id: 'p07', title: 'Smothered', fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', solution: ['g5f7'], mate: 1, themes: ['Mate in 1', 'Smothered mate'], rating: 520 },
    { id: 'p08', title: 'Promotion party', fen: '7r/4k1P1/8/8/8/8/8/4K3 w - - 0 1', solution: ['g7h8q'], themes: ['Promotion'], rating: 550 },
    { id: 'p09', title: 'Bishop\'s backup', fen: '6k1/5p1p/5Bp1/8/8/8/5PPP/3Q2K1 w - - 0 1', solution: ['d1d8'], mate: 1, themes: ['Mate in 1'], rating: 600 },
    { id: 'p10', title: 'Light-square attack', fen: '6k1/5ppp/8/8/8/5b1q/5P1P/6K1 b - - 0 1', solution: ['h3g2'], mate: 1, themes: ['Mate in 1'], rating: 620 },
    { id: 'p11', title: 'Arabian nights', fen: '7k/R7/5N2/8/8/8/8/6K1 w - - 0 1', solution: ['a7h7'], mate: 1, themes: ['Mate in 1', 'Arabian mate'], rating: 650 },
    { id: 'p12', title: 'Knight on the rim', fen: 'r3k3/5ppp/8/1N6/8/8/5PPP/6K1 w - - 0 1', solution: ['b5c7', 'e8e7', 'c7a8'], themes: ['Fork'], rating: 650 },
    { id: 'p13', title: 'Greco\'s hook', fen: '5rk1/5pp1/8/6N1/7Q/8/5PPP/6K1 w - - 0 1', solution: ['h4h7'], mate: 1, themes: ['Mate in 1', 'Attack on the king'], rating: 680 },
    { id: 'p14', title: 'Little big pawn', fen: '6k1/5ppp/2n1b3/8/3PP3/8/P4PPP/1N4K1 w - - 0 1', solution: ['d4d5', 'c6e5', 'd5e6'], themes: ['Fork'], rating: 700 },
    { id: 'p15', title: 'Lift the curtain', fen: '4k3/pq3ppp/8/8/4B3/8/5PPP/4R1K1 w - - 0 1', solution: ['e4b7'], themes: ['Discovered check'], rating: 720 },
    { id: 'p16', title: 'Box them in', fen: 'k7/8/8/2K5/8/8/8/1Q6 w - - 0 1', solution: ['c5c6', 'a8a7', 'b1b7'], mate: 2, themes: ['Mate in 2', 'Endgame'], rating: 740 },
    { id: 'p17', title: 'Climb the ladder', fen: '6k1/8/8/8/8/8/R7/1R4K1 w - - 0 1', solution: ['a2a7', 'g8f8', 'b1b8'], mate: 2, themes: ['Mate in 2', 'Endgame'], rating: 760 },
    { id: 'p18', title: 'Pinned and helpless', fen: '4k3/pp4pp/4q3/8/8/2N5/PP3KPP/R7 w - - 0 1', solution: ['a1e1', 'e8d8', 'e1e6'], themes: ['Pin'], rating: 780 },
    { id: 'p19', title: 'Rook through the middle', fen: '8/8/r2k4/8/8/8/5K2/7R w - - 0 1', solution: ['h1h6', 'd6d5', 'h6a6'], themes: ['Skewer'], rating: 800 },
    { id: 'p20', title: 'Long-range fork', fen: '8/r5kp/6p1/8/8/8/5PPP/3Q2K1 w - - 0 1', solution: ['d1d4', 'g7g8', 'd4a7'], themes: ['Fork'], rating: 820 },
    { id: 'p21', title: 'Doubled on the file', fen: 'r5k1/5ppp/8/8/8/8/4RPPP/4R1K1 w - - 0 1', solution: ['e2e8', 'a8e8', 'e1e8'], mate: 2, themes: ['Mate in 2', 'Back rank'], rating: 850 },
    { id: 'p22', title: 'The long diagonal', fen: 'q7/8/2k5/8/8/8/2B5/6K1 w - - 0 1', solution: ['c2e4', 'c6c5', 'e4a8'], themes: ['Skewer'], rating: 870 },
    { id: 'p23', title: 'Knight out, rook in', fen: '4q1k1/5ppp/8/8/4N3/8/5PPP/4R1K1 w - - 0 1', solution: ['e4f6', 'g7f6', 'e1e8'], themes: ['Discovered attack'], rating: 920 },
    { id: 'p24', title: 'Black strikes first', fen: '3r2k1/5ppp/8/8/3q4/8/1B3PPP/2R3K1 b - - 0 1', solution: ['d4d1', 'c1d1', 'd8d1'], mate: 2, themes: ['Mate in 2', 'Back rank', 'Sacrifice'], rating: 960 },
    { id: 'p25', title: 'Philidor\'s legacy', fen: 'r6k/1b4pp/7N/3Q4/8/8/5PPP/6K1 w - - 0 1', solution: ['d5g8', 'a8g8', 'h6f7'], mate: 2, themes: ['Mate in 2', 'Smothered mate', 'Sacrifice'], rating: 1050 },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = PUZZLES;
  else global.PUZZLES = PUZZLES;
})(typeof window !== 'undefined' ? window : globalThis);
