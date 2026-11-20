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
    {
      id: 'hanging', level: 'Beginner', category: 'Tactics', icon: '🎯', title: 'Don\'t hang your pieces',
      summary: 'Spot free pieces — and stop giving yours away.',
      steps: [
        { text: 'A piece is <b>hanging</b> when it is attacked and nobody defends it. Hanging pieces are free — for whoever spots them first! Here the white knight attacks the undefended black knight.', fen: '4k3/8/8/4n3/8/5N2/8/4K3 w - - 0 1', arrows: [['f3', 'e5']] },
        { text: 'A piece is <b>defended</b> when one of its friends could take back. The knight on d5 is protected by the pawn on e6 — if your queen grabs it, the pawn recaptures and you lose your queen for a knight!', fen: '4k3/8/4p3/3n4/8/8/8/3QK3 w - - 0 1', arrows: [['d1', 'd5', 'r'], ['e6', 'd5', 'y']] },
        { text: 'Your queen can capture on <b>g4</b> or on <b>d5</b>. One of those pieces is defended — <b>grab the free one!</b>', fen: '4k3/pp3ppp/4p3/3n4/6b1/8/PP3PPP/3QK3 w - - 0 1', task: { solution: ['d1g4|d1a4'] }, hint: 'The bishop on g4 has no defenders. The knight on d5 does.' },
        { text: 'The golden rule: before <b>every</b> move, ask two questions. <b>Can my opponent take something for free?</b> And <b>can I?</b> This one habit wins more games than any opening.', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
      ],
    },
    {
      id: 'develop', level: 'Beginner', category: 'Strategy', icon: '🚀', title: 'Develop & castle',
      summary: 'Get your pieces on stage fast.',
      steps: [
        { text: 'In the opening, almost every move should bring a <b>new piece</b> into play — knights and bishops first, then castle. Every piece you develop is another musician on stage!', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', arrows: [['g1', 'f3'], ['b1', 'c3'], ['f1', 'c4']] },
        { text: 'Both sides have played a pawn and a knight. <b>Develop a new piece</b> towards the centre.', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', task: { solution: ['f1c4|f1b5|b1c3|d2d4'] }, hint: 'Your bishop on f1 or knight on b1 are waiting to play.' },
        { text: 'Black brought the queen out too early. <b>Develop a knight and attack the queen</b> at the same time!', fen: 'rnb1kbnr/pppp1ppp/8/4p3/4P2q/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 3', task: { solution: ['g1f3'] }, hint: 'Which knight move hits the queen on h4?' },
        { text: 'Your pieces are out — now <b>castle</b> to keep your king safe.', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5', task: { solution: ['e1g1'] }, hint: 'Move the king two squares towards the h1 rook.' },
      ],
    },
    {
      id: 'rookmate', level: 'Beginner', category: 'Endgame', icon: '🏰', title: 'Checkmate with king & rook',
      summary: 'The rook cuts off, the king walks up.',
      steps: [
        { text: 'With king and rook against a lone king, the rook <b>cuts the board in two</b>, and your king walks up to help. Here the rook on the d-file traps the black king on the left side. Mate always happens on the edge.', fen: '8/8/2k5/8/8/8/8/3RK3 w - - 0 1', arrows: [['d1', 'd8']] },
        { text: 'The kings stand face to face. <b>Mate in one!</b>', fen: '6k1/8/6K1/8/8/8/8/R7 w - - 0 1', task: { solution: ['a1a8'], mate: 1 }, hint: 'Your king covers the 7th rank. Use the rook on the 8th.' },
        { text: '<b>Mate in two.</b> No check yet — make a quiet <b>waiting move</b> with the rook. The black king will have to step in front of yours.', fen: '1k6/8/2K5/8/8/8/8/7R w - - 0 1', task: { solution: ['h1a1', 'b8c8', 'a1a8'], mate: 2 }, hint: 'Put the rook on the a-file first.' },
      ],
    },
    {
      id: 'discovered', level: 'Intermediate', category: 'Tactics', icon: '💥', title: 'Discovered attacks',
      summary: 'Move one piece, unleash another.',
      steps: [
        { text: 'A <b>discovered attack</b>: one piece moves out of the way and reveals an attack by the piece behind it. Here your knight blocks your own rook from hitting the black queen.', fen: 'r6k/ppp1qppp/8/4N3/8/8/PPP2PPP/3QR1K1 w - - 0 1', arrows: [['e1', 'e7', 'r']] },
        { text: 'Move the knight <b>with check</b>. Black must deal with the check — and then your rook takes the queen.', fen: 'r6k/ppp1qppp/8/4N3/8/8/PPP2PPP/3QR1K1 w - - 0 1', task: { solution: ['e5g6', 'h7g6', 'e1e7'] }, hint: 'Which knight move checks the king on h8?' },
        { text: '<b>Discovered check</b> is the deadliest kind: the opponent has to answer the check, so they never get time to save the piece you attacked.', fen: 'r6k/ppp1qppp/6N1/8/8/8/PPP2PPP/3QR1K1 b - - 1 1', arrows: [['g6', 'h8', 'y'], ['e1', 'e7', 'r']] },
      ],
    },
    {
      id: 'doublecheck', level: 'Intermediate', category: 'Tactics', icon: '⚡', title: 'Double check',
      summary: 'Two checks at once — only the king can move.',
      steps: [
        { text: 'In a <b>double check</b>, two pieces give check at the same time. Blocking or capturing can\'t stop both — <b>the king must move</b>. If it has nowhere to go, it\'s checkmate, like here.', fen: 'rnbqkbnr/pppp1ppp/3N4/8/8/8/PPP2PPP/R1B1R1K1 b kq - 1 1', arrows: [['d6', 'e8', 'y'], ['e1', 'e8', 'r']] },
        { text: 'Recreate it yourself: <b>mate in one</b> with a double check!', fen: 'rnbqkbnr/pppp1ppp/8/8/4N3/8/PPP2PPP/R1B1R1K1 w kq - 0 1', task: { solution: ['e4d6'], mate: 1 }, hint: 'The knight jumps with check and unmasks the rook.' },
        { text: '<b>Mate in two.</b> Start with a double check — the king has to run — then finish it off.', fen: '4k3/1qpp1ppp/2p5/8/4N3/8/PP3PPP/4R1K1 w - - 0 1', task: { solution: ['e4d6', 'e8d8', 'e1e8'], mate: 2 }, hint: 'Knight to d6 checks twice. Then the rook visits the 8th rank.' },
      ],
    },
    {
      id: 'defender', level: 'Intermediate', category: 'Tactics', icon: '🛡', title: 'Remove the defender',
      summary: 'Take out the guard, then strike.',
      steps: [
        { text: 'When one enemy piece has an important job — like guarding a square next to the king — <b>capture it or chase it away</b>, and the job is left undone. Here the knight on f6 is the only guard of h7.', fen: 'r2q1rk1/ppp2ppp/5n2/6B1/7Q/3B4/PPP2PPP/R4RK1 w - - 0 1', arrows: [['f6', 'h7', 'y'], ['h4', 'h7', 'r'], ['d3', 'h7', 'r']] },
        { text: 'Your queen and bishop both aim at h7, but the knight defends it. <b>Remove the defender!</b> (If Black recaptures with the g-pawn, Qxh7 is checkmate.)', fen: 'r2q1rk1/ppp2ppp/5n2/6B1/7Q/3B4/PPP2PPP/R4RK1 w - - 0 1', task: { solution: ['g5f6'] }, hint: 'Your bishop on g5 can capture the knight.' },
      ],
    },
    {
      id: 'square', level: 'Intermediate', category: 'Endgame', icon: '🏃', title: 'Pawn races & opposition',
      summary: 'The rule of the square and facing kings.',
      steps: [
        { text: '<b>The rule of the square:</b> draw a square from the pawn to its promotion rank. If the enemy king can step inside it, the king catches the pawn. If not — the pawn queens!', fen: '8/8/8/P3k3/8/8/8/6K1 w - - 0 1', marks: ['a5', 'b5', 'c5', 'd5', 'a6', 'b6', 'c6', 'd6', 'a7', 'b7', 'c7', 'd7', 'a8', 'b8', 'c8', 'd8'] },
        { text: 'The black king is one step from the square. <b>Push the pawn</b> before it gets inside — the square shrinks with every push!', fen: '8/8/8/P3k3/8/8/8/6K1 w - - 0 1', task: { solution: ['a5a6'] }, hint: 'Don\'t move the king — every tempo counts.' },
        { text: '<b>Opposition:</b> when kings face each other with one square between them, the player who does <b>not</b> have to move holds the opposition. Here Black must step aside, and White\'s king marches forward to escort the pawn.', fen: '8/8/4k3/8/4K3/4P3/8/8 b - - 0 1', arrows: [['e4', 'e6', 'y']] },
      ],
    },
    /* GENERATED-LESSONS-START */
    {"id": "mate2drill", "level": "Intermediate", "category": "Attack", "icon": "🥁", "title": "Mate-in-two drill", "summary": "Three real-game mates in two moves.", "steps": [{"text": "Mate in two means: your move, any reply, then checkmate. <b>Checks, captures, threats</b> — look at every forcing move first, and ask what the defender can do after each one.", "fen": "rq1k3r/p1p2pp1/2Q1b2p/3n4/P2P4/2p1B3/2P1PPPP/3K1B1R b - - 2 18"}, {"text": "<b>Black to move — mate in 2.</b> Find the forcing start.", "fen": "rq1k3r/p1p2pp1/2Q1b2p/3n4/P2P4/2p1B3/2P1PPPP/3K1B1R b - - 2 18", "task": {"solution": ["d5e3", "d1e1", "b8b1"], "mate": 2}, "hint": "Start with a check using your knight."}, {"text": "<b>White to move — mate in 2.</b> Your opponent has only a few replies. Make sure every one of them loses.", "fen": "2bk1b1r/r1n1N1p1/p1Q1Pp2/3P3p/2B5/B1PP2P1/5P1P/1R4K1 w - - 1 25", "task": {"solution": ["b1b8", "g7g6", "b8c8"], "mate": 2}, "hint": "The first move is a quiet rook move — no check, no capture."}, {"text": "<b>Black to move — mate in 2.</b> Last one of the drill — finish it in style!", "fen": "4r1kr/p2p1pp1/Bpp5/7p/P4b2/BbNK4/6PP/R2n3R b - - 3 26", "task": {"solution": ["d1f2", "d3d4", "f4e3"], "mate": 2}, "hint": "Start with a check using your knight."}]},
    {"id": "mate3", "level": "Advanced", "category": "Attack", "icon": "👑", "title": "Mate in three", "summary": "Calculate a full forcing combination.", "steps": [{"text": "A mate in three is a real combination: you need to see <b>five half-moves ahead</b>. The trick: start with forcing moves that leave the king fewer and fewer squares, and check every defence.", "fen": "2r5/5kp1/4p1bp/p2p4/1p1P1P2/1P6/qRP3PP/2K2B1R b - - 1 25"}, {"text": "<b>Black to move — mate in 3.</b> Take your time and calculate before you touch a piece.", "fen": "2r5/5kp1/4p1bp/p2p4/1p1P1P2/1P6/qRP3PP/2K2B1R b - - 1 25", "task": {"solution": ["c8c2", "c1d1", "a2a1", "b2b1", "a1b1"], "mate": 3}, "hint": "Start with a check using your rook."}, {"text": "<b>Black to move — mate in 3.</b> Look for the move that takes away the king's escape squares.", "fen": "4k3/Bpp4Q/p1nb4/3n1qpK/2p5/8/PPb1N1PP/R4BR1 b - - 1 22", "task": {"solution": ["d5f6", "h5h6", "d6f8", "h7g7", "f5g6"], "mate": 3}, "hint": "Start with a check using your knight."}, {"text": "<b>Black to move — mate in 3.</b> The final boss. Calculate it to the end!", "fen": "r3k2r/p5p1/1q1b1n1p/2pp1p2/3P1pn1/BPP1Pb1K/P5PP/R3QBR1 b kq - 1 22", "task": {"solution": ["g4f2", "e1f2", "f3g4", "h3h4", "g7g5"], "mate": 3}, "hint": "Start with a check using your knight."}]},
    {"id": "quiet", "level": "Advanced", "category": "Tactics", "icon": "🤫", "title": "Quiet killer moves", "summary": "The strongest move isn't always a check.", "steps": [{"text": "Strong players also look for <b>quiet moves</b>: no check, no capture — but they create a threat your opponent can't meet. They are the hardest tactics to spot.", "fen": "4q1k1/3n1pb1/1p2p2p/1N5P/2rP1P2/P3B3/RP3P1R/5K2 w - - 5 34"}, {"text": "<b>White to move.</b> Find the quiet move that wins material.", "fen": "4q1k1/3n1pb1/1p2p2p/1N5P/2rP1P2/P3B3/RP3P1R/5K2 w - - 5 34", "task": {"solution": ["b5d6", "e8a8", "d6c4"]}, "hint": "The first move is a quiet knight move — no check, no capture."}, {"text": "<b>White to move.</b> No checks needed — find the threat that can't be parried.", "fen": "r1b5/pp1n2pp/4Q3/2p1p1k1/3P1r1q/P7/1P2PPPP/1RB1KBR1 w - - 1 22", "task": {"solution": ["g2g3", "g5h5", "g3h4"]}, "hint": "The first move is a quiet pawn move — no check, no capture."}, {"text": "<b>White to move.</b> One more. Think about what you threaten, not just what you attack.", "fen": "2rqkbnr/1ppnp1pp/p2p2b1/5p2/3PPN2/2N5/PPP2PPP/R1BQKB1R w KQk - 2 8", "task": {"solution": ["f4e6", "f5e4", "e6d8"]}, "hint": "The first move is a quiet knight move — no check, no capture."}]},
    {"id": "forcing", "level": "Advanced", "category": "Tactics", "icon": "🎯", "title": "Calculate forcing lines", "summary": "Check, reply, and the follow-up that wins.", "steps": [{"text": "A <b>forcing line</b> starts with a check, so your opponent has very few replies. Calculate each reply and find the follow-up that wins material.", "fen": "1r3rk1/Qpp3p1/3bp3/6qp/4P2P/2PP4/P5P1/R4BKR b - - 0 24"}, {"text": "<b>Black to move.</b> Start with a check, then cash in.", "fen": "1r3rk1/Qpp3p1/3bp3/6qp/4P2P/2PP4/P5P1/R4BKR b - - 0 24", "task": {"solution": ["d6c5", "a7c5", "g5c5"]}, "hint": "Start with a check using your bishop."}, {"text": "<b>Black to move.</b> The check is just the opening act — what comes next?", "fen": "2b1k2r/Q1p2p1p/8/1p1p2p1/1P4n1/P1q4P/2P1P1P1/1R1K1BR1 b - - 2 23", "task": {"solution": ["g4e3", "a7e3", "c3e3"]}, "hint": "Start with a check using your knight."}, {"text": "<b>White to move.</b> Calculate the whole sequence before moving.", "fen": "r1b2b1r/pp1k1p1p/2qp2p1/2p1pn2/8/1P2BN2/P1P1BPPP/R2QKR2 w Q - 0 15", "task": {"solution": ["f3e5", "d7e8", "e5c6"]}, "hint": "Start with a check using your knight."}]},
    {"id": "sacrifice", "level": "Advanced", "category": "Attack", "icon": "🔥", "title": "Sacrifice to win", "summary": "Give something up to get much more back.", "steps": [{"text": "A <b>sacrifice</b> gives away material on purpose — to rip open the king, deflect a defender or set up a bigger win. Before you sacrifice, calculate exactly what you get back!", "fen": "r1k2b2/1p4p1/p2p3q/P3p3/2PpPn2/3P4/1PNB1r1P/1RK2B1R b - - 0 30"}, {"text": "<b>Black to move.</b> Something has to be given up here. Find the sacrifice that works.", "fen": "r1k2b2/1p4p1/p2p3q/P3p3/2PpPn2/3P4/1PNB1r1P/1RK2B1R b - - 0 30", "task": {"solution": ["f4d3", "c1d1", "h6d2"], "mate": 2}, "hint": "Start with a check using your knight."}, {"text": "<b>Black to move.</b> Be brave — but calculate it first!", "fen": "rnb1k1nr/pp1pbppp/2p1pq2/7P/6P1/2N2P2/PPPPP3/R1BQKBNR b KQkq - 0 5", "task": {"solution": ["f6h4", "h1h4", "e7h4"], "mate": 2}, "hint": "Start with a check using your queen."}, {"text": "<b>Black to move.</b> The last sacrifice. Go for it!", "fen": "2k2b1r/1qn1pppp/1p6/2p4r/p7/P2PBQN1/1PP2PK1/2R1R3 b - - 0 25", "task": {"solution": ["h5h2", "g2h2", "b7f3"]}, "hint": "Start with a check using your rook."}]},
    {"id": "endtactics", "level": "Advanced", "category": "Endgame", "icon": "🎻", "title": "Endgame tactics", "summary": "Few pieces, sharp tricks.", "steps": [{"text": "With few pieces left, every tempo counts. Tactics still decide endgames: <b>forks, checks and mating nets</b> appear even with just a couple of pieces.", "fen": "8/6kp/3R4/PR2pP2/8/4KP2/r7/8 w - - 1 40"}, {"text": "<b>White to move.</b> Find the winning idea.", "fen": "8/6kp/3R4/PR2pP2/8/4KP2/r7/8 w - - 1 40", "task": {"solution": ["b5b7", "g7f8", "d6d8"], "mate": 2}, "hint": "Start with a check using your rook."}, {"text": "<b>Black to move.</b> Few pieces — but a sharp trick is hiding here.", "fen": "4k3/2p1ppb1/8/p7/7p/P4q2/RP5P/4R1K1 b - - 1 40", "task": {"solution": ["g7d4", "e1e3", "d4e3"], "mate": 2}, "hint": "Start with a check using your bishop."}, {"text": "<b>Black to move.</b> Calculate the line to the end.", "fen": "4k3/2p1P1r1/1R4p1/3P1p1p/5P2/8/1p1r4/6K1 b - - 0 42", "task": {"solution": ["c7b6", "d5d6", "b2b1q"], "mate": 2}, "hint": "Start by capturing with your pawn."}]},
    /* GENERATED-LESSONS-END */
  ];
  const LEVEL = { board: 'Beginner', pawn: 'Beginner', knight: 'Beginner', sliders: 'Beginner', king: 'Beginner', special: 'Beginner', mate: 'Beginner', values: 'Beginner', opening: 'Beginner', endgame: 'Beginner', forks: 'Intermediate', pins: 'Intermediate', patterns: 'Intermediate' };
  LESSONS.forEach((l) => { l.level = l.level || LEVEL[l.id] || 'Intermediate'; });
  const ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  const SEQ = ['board', 'pawn', 'knight', 'sliders', 'king', 'special', 'mate', 'values', 'hanging', 'develop', 'opening', 'rookmate', 'endgame',
    'forks', 'pins', 'discovered', 'doublecheck', 'defender', 'patterns', 'mate2drill', 'square', 'forcing', 'quiet', 'sacrifice', 'endtactics', 'mate3'];
  const pos = (l) => (SEQ.indexOf(l.id) < 0 ? 99 : SEQ.indexOf(l.id));
  LESSONS.sort((a, b) => ORDER[a.level] - ORDER[b.level] || pos(a) - pos(b));
  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  else global.LESSONS = LESSONS;
})(typeof window !== 'undefined' ? window : globalThis);
