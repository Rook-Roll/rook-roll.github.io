/* Lessons. Each step shows a position. Steps with `task` must be solved before moving on.
   task.solution: UCI moves alternating student / coach replies. task.mate: accept any forced mate in N. */
(function (global) {
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const LESSONS = [
    {
      id: 'board', category: 'Foundations', icon: '♜', title: 'Meet the board',
      summary: 'Squares, files, ranks and the starting position.',
      steps: [
        { text: 'A chessboard has <b>64 squares</b> in 8 columns called <b>files</b> (a–h) and 8 rows called <b>ranks</b> (1–8). Every square has a name: the highlighted square is <b>e4</b>.', fen: '8/8/8/8/8/8/8/8 w - - 0 1', marks: ['e4'], empty: true },
        { text: 'Set up the board so that each player has a <b>light square in the bottom-right corner</b>. Remember: "light on the right".', fen: '8/8/8/8/8/8/8/8 w - - 0 1', marks: ['h1', 'a8'], empty: true },
        { text: 'This is the starting position. White always moves first. Notice the <b>queen starts on her own colour</b>: the white queen on the light d1, the black queen on the dark d8.', fen: START, marks: ['d1', 'd8'] },
        { text: 'Your turn! A great first move is pushing the king\'s pawn two squares to the centre. <b>Play e2–e4.</b>', fen: START, task: { solution: ['e2e4'] }, hint: 'Click the pawn in front of your king, then click e4.' },
      ],
    },
    {
      id: 'pawn', category: 'Foundations', icon: '♟', title: 'The pawn',
      summary: 'Small but mighty: pushes, captures and promotion.',
      steps: [
        { text: 'Pawns move <b>straight forward one square</b>. On its very first move, a pawn may move <b>two squares</b>.', fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', arrows: [['e2', 'e3'], ['e2', 'e4']] },
        { text: 'Pawns are the only pieces that capture differently from how they move: they capture <b>one square diagonally forward</b>.', fen: '4k3/8/8/3p1p2/4P3/8/8/4K3 w - - 0 1', arrows: [['e4', 'd5'], ['e4', 'f5']] },
        { text: 'A black knight has wandered too close. <b>Capture it with your pawn.</b>', fen: '4k3/8/8/3n4/4P3/8/8/4K3 w - - 0 1', task: { solution: ['e4d5'] }, hint: 'Pawns capture diagonally forward.' },
        { text: 'When a pawn reaches the last rank it <b>promotes</b> — usually into a queen! <b>Push the pawn to b8 and choose a queen.</b>', fen: '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', task: { solution: ['b7b8q'] }, hint: 'Move the pawn to b8, then pick the queen.' },
      ],
    },
    {
      id: 'knight', category: 'Foundations', icon: '♞', title: 'The knight',
      summary: 'The tricky jumper that moves in an L.',
      steps: [
        { text: 'The knight moves in an <b>"L"</b>: two squares in one direction, then one square to the side. From the centre it reaches <b>8 squares</b>.', fen: '4k3/8/8/8/3N4/8/8/4K3 w - - 0 1', marks: ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'] },
        { text: 'The knight is the only piece that can <b>jump over</b> other pieces. That\'s why it can leave the starting position right away.', fen: START, arrows: [['g1', 'f3'], ['b1', 'c3']] },
        { text: 'A knight on the rim is dim — but this one can strike! <b>Jump to a square that attacks the king AND the rook</b>, then grab the rook.', fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', task: { solution: ['b5c7', 'e8e7', 'c7a8'] }, hint: 'Look at c7: what does a knight there attack?' },
      ],
    },
    {
      id: 'sliders', category: 'Foundations', icon: '♛', title: 'Rook, bishop & queen',
      summary: 'The long-range pieces and how they move.',
      steps: [
        { text: 'The <b>rook</b> moves any number of squares along a rank or file.', fen: '4k3/8/8/8/3R4/8/8/4K3 w - - 0 1', marks: ['d1', 'd2', 'd3', 'd5', 'd6', 'd7', 'd8', 'a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'h4'] },
        { text: 'The <b>bishop</b> moves diagonally. A bishop stays on the <b>same colour</b> for the whole game.', fen: '4k3/8/8/8/3B4/8/8/4K3 w - - 0 1', marks: ['a1', 'b2', 'c3', 'e5', 'f6', 'g7', 'h8', 'a7', 'b6', 'c5', 'e3', 'f2', 'g1'] },
        { text: 'The <b>queen</b> combines both: rook moves plus bishop moves. She is the most powerful piece.', fen: '4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1', arrows: [['d4', 'd8'], ['d4', 'h8'], ['d4', 'h4'], ['d4', 'g1'], ['d4', 'd1'], ['d4', 'a1'], ['d4', 'a4'], ['d4', 'a7']] },
        { text: 'That black rook is unprotected. <b>Capture it with the bishop.</b>', fen: '4k3/8/6r1/8/8/3B4/8/4K3 w - - 0 1', task: { solution: ['d3g6'] }, hint: 'Follow the diagonal from d3 up and to the right.' },
        { text: 'Now <b>use the queen to win the loose knight.</b>', fen: '4k3/8/8/8/n7/8/8/3QK3 w - - 0 1', task: { solution: ['d1a4'] }, hint: 'The queen can travel diagonally from d1.' },
      ],
    },
    {
      id: 'king', category: 'Foundations', icon: '♚', title: 'The king & check',
      summary: 'Protect your king: escaping, blocking and capturing.',
      steps: [
        { text: 'The <b>king</b> moves one square in any direction. It can never move onto a square that is attacked.', fen: '7k/8/8/8/3K4/8/8/8 w - - 0 1', marks: ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5'] },
        { text: 'When the king is attacked it is in <b>check</b>. You must get out of check right away: <b>move</b> the king, <b>block</b> the attack, or <b>capture</b> the attacker.', fen: '4k3/8/8/8/8/8/8/4K2r w - - 0 1', arrows: [['h1', 'e1']] },
        { text: 'The rook gives check. <b>Get out of check by capturing the rook.</b>', fen: '4k3/8/8/8/4B3/8/8/4K2r w - - 0 1', task: { solution: ['e4h1'] }, hint: 'Your bishop on e4 can see h1.' },
        { text: 'Check again! This time <b>block the check with your knight.</b>', fen: '4k3/8/8/8/8/4N3/8/4K2r w - - 0 1', task: { solution: ['e3f1'] }, hint: 'Put the knight between the rook and your king — on f1.' },
      ],
    },
    {
      id: 'special', category: 'Foundations', icon: '♖', title: 'Special moves',
      summary: 'Castling and en passant.',
      steps: [
        { text: '<b>Castling</b> moves the king two squares towards a rook, and the rook jumps to the other side. It tucks your king away safely and activates the rook.', fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', arrows: [['e1', 'g1'], ['h1', 'f1']] },
        { text: 'You may castle only if the king and that rook <b>have not moved</b>, nothing stands between them, and the king is <b>not in check</b> and does not pass through an attacked square. <b>Castle kingside now</b> (move the king to g1).', fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', task: { solution: ['e1g1'] }, hint: 'Drag the king two squares to the right.' },
        { text: '<b>En passant</b>: if a pawn moves two squares and lands beside your pawn, you may capture it as if it had moved only one — but only on the very next move. Black just played d7–d5. <b>Capture en passant!</b>', fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', task: { solution: ['e5d6'] }, hint: 'Your e5 pawn captures diagonally onto d6.' },
      ],
    },
    {
      id: 'mate', category: 'Foundations', icon: '♔', title: 'Checkmate & stalemate',
      summary: 'How games are won — and accidentally drawn.',
      steps: [
        { text: '<b>Checkmate</b> is check with no way out. The game ends immediately. Here Black\'s king is trapped behind its own pawns: a classic <b>back-rank mate</b>.', fen: '3R2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1', arrows: [['d8', 'g8']] },
        { text: 'Your turn: <b>deliver checkmate in one move.</b>', fen: 'k7/8/1K6/8/8/8/7Q/8 w - - 0 1', task: { solution: ['h2h8'], mate: 1 }, hint: 'Attack the king along the 8th rank. Your king guards the 7th.' },
        { text: '<b>Stalemate</b>: the player to move is <b>not</b> in check but has no legal move. That\'s a <b>draw</b>! Here Black has no safe square — careless winning attempts often end like this.', fen: 'k7/8/1Q6/8/8/8/8/K7 b - - 0 1', marks: ['a7', 'b7', 'b8'] },
        { text: 'Avoid the stalemate trap! <b>Find the checkmate</b> — and don\'t take away all of Black\'s moves without giving check.', fen: 'k7/8/2K5/8/8/8/8/1Q6 w - - 0 1', task: { solution: ['b1b7'], mate: 1 }, hint: 'Put the queen right next to the king, protected by your own king.' },
      ],
    },
    {
      id: 'values', category: 'Foundations', icon: '⚖', title: 'Piece values',
      summary: 'Know what you\'re trading.',
      steps: [
        { text: 'A rough guide to piece values: <b>pawn 1</b>, <b>knight 3</b>, <b>bishop 3</b>, <b>rook 5</b>, <b>queen 9</b>. The king is priceless. Use these to judge trades.', fen: START },
        { text: 'You can capture a knight or the queen. <b>Take the most valuable piece.</b>', fen: '4k3/8/8/2n3q1/8/8/8/2R1K1R1 w - - 0 1', task: { solution: ['g1g5'] }, hint: 'Which is worth more: 3 points or 9?' },
      ],
    },
    {
      id: 'forks', category: 'Tactics', icon: '⑂', title: 'Forks',
      summary: 'Attack two things at once.',
      steps: [
        { text: 'A <b>fork</b> is one piece attacking two (or more) targets at once. The opponent can only save one. Knights are famous for forks.', fen: 'r3k3/2N5/8/8/8/8/8/4K3 b - - 0 1', arrows: [['c7', 'e8'], ['c7', 'a8']] },
        { text: 'Queens fork too. <b>Find a check that also attacks the rook</b>, then collect it.', fen: '8/r5kp/6p1/8/8/8/5PPP/3Q2K1 w - - 0 1', task: { solution: ['d1d4', 'g7g8', 'd4a7'] }, hint: 'From d4 the queen sees both g7 and a7.' },
        { text: 'Even a humble pawn can fork. <b>Push a pawn to attack both the knight and the bishop.</b>', fen: '6k1/5ppp/2n1b3/8/3PP3/8/P4PPP/1N4K1 w - - 0 1', task: { solution: ['d4d5', 'c6e5', 'd5e6'] }, hint: 'A pawn on d5 would attack c6 and e6.' },
      ],
    },
    {
      id: 'pins', category: 'Tactics', icon: '📌', title: 'Pins & skewers',
      summary: 'Line attacks that freeze and win pieces.',
      steps: [
        { text: 'A <b>pin</b>: a piece can\'t move because it would expose a more valuable piece behind it. Here the knight on c6 is pinned to its king — it cannot legally move.', fen: '4k3/8/2n5/1B6/8/8/8/4K3 w - - 0 1', arrows: [['b5', 'e8']], marks: ['c6'] },
        { text: 'Pin the queen to the king! <b>Put your rook on the e-file</b> — it\'s protected by your king.', fen: '4k3/pp4pp/4q3/8/8/2N5/PP3KPP/R7 w - - 0 1', task: { solution: ['a1e1', 'e8d8', 'e1e6'] }, hint: 'Rook to e1. The queen can\'t step off the e-file.' },
        { text: 'A <b>skewer</b> is a reverse pin: you attack a valuable piece (often the king), and when it moves you capture the piece behind it.', fen: 'q7/8/2k5/8/4B3/8/8/6K1 b - - 0 1', arrows: [['e4', 'c6'], ['c6', 'a8']] },
        { text: '<b>Skewer the king and queen</b> with your bishop.', fen: 'q7/8/2k5/8/8/8/2B5/6K1 w - - 0 1', task: { solution: ['c2e4', 'c6c5', 'e4a8'] }, hint: 'Find a check on the long a8–h1 diagonal.' },
      ],
    },
    {
      id: 'patterns', category: 'Tactics', icon: '♕', title: 'Mating patterns',
      summary: 'Back rank, smothered mate and the ladder.',
      steps: [
        { text: '<b>Back-rank mate</b>: the king is boxed in by its own pawns. <b>Mate in one.</b>', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', task: { solution: ['d1d8'], mate: 1 }, hint: 'Go for the 8th rank.' },
        { text: '<b>Smothered mate</b>: the king is surrounded by its own pieces and a knight delivers the blow. <b>Mate in one.</b>', fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', task: { solution: ['g5f7'], mate: 1 }, hint: 'Which knight square attacks h8?' },
        { text: '<b>The ladder</b>: two rooks take turns cutting off ranks. <b>Mate in two</b> — first cut off the 7th rank.', fen: '6k1/8/8/8/8/8/R7/1R4K1 w - - 0 1', task: { solution: ['a2a7', 'g8f8', 'b1b8'], mate: 2 }, hint: 'Rook to a7 first, then the other rook mates on the 8th.' },
      ],
    },
    {
      id: 'opening', category: 'Strategy', icon: '♗', title: 'Opening principles',
      summary: 'Centre, development, king safety.',
      steps: [
        { text: 'Three golden rules for the opening: <b>1.</b> Fight for the centre (e4, d4, e5, d5). <b>2.</b> Develop knights and bishops quickly. <b>3.</b> Castle early to keep your king safe.', fen: START, marks: ['d4', 'e4', 'd5', 'e5'] },
        { text: 'Let\'s play the <b>Italian Game</b>. Follow the coach: <b>e4</b>, then <b>Nf3</b>, then <b>Bc4</b>, then <b>castle</b>. Black will reply each time.', fen: START, task: { solution: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'e1g1'] }, hint: 'Centre pawn, knight, bishop, castle — in that order.' },
        { text: 'Good habits: don\'t bring the queen out too early, avoid moving the same piece twice, and connect your rooks. You\'re ready to play!', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5' },
      ],
    },
    {
      id: 'endgame', category: 'Strategy', icon: '♔', title: 'Endgame: king & queen',
      summary: 'Finish the game when you\'re ahead.',
      steps: [
        { text: 'With a queen against a lone king, use the queen to shrink the king\'s box, then bring your own king close. The queen alone can\'t mate — the king must help.', fen: '8/8/3k4/8/8/2Q5/8/4K3 w - - 0 1', marks: ['d8', 'e8', 'f8', 'g8', 'h8', 'd7', 'e7', 'f7', 'g7', 'h7', 'd6', 'e6', 'f6', 'g6', 'h6', 'd5', 'e5', 'f5', 'g5', 'h5', 'd4', 'e4', 'f4', 'g4', 'h4'] },
        { text: '<b>The queen\'s kiss</b>: queen right next to the enemy king, defended by your king. <b>Mate in one.</b>', fen: '7k/8/5K2/8/8/8/8/6Q1 w - - 0 1', task: { solution: ['g1g7'], mate: 1 }, hint: 'Which square next to h8 does your king protect?' },
        { text: 'Now a <b>mate in two</b>. Careful: some queen moves stalemate! Bring your king closer first.', fen: 'k7/8/8/2K5/8/8/8/1Q6 w - - 0 1', task: { solution: ['c5c6', 'a8a7', 'b1b7'], mate: 2 }, hint: 'King to c6 — then the queen lands on b7.' },
      ],
    },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  else global.LESSONS = LESSONS;
})(typeof window !== 'undefined' ? window : globalThis);
