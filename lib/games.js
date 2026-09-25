// In-memory game state — resets if the bot restarts, which is fine for
// short-lived minigames like these.
const ttt = new Map(); // jid -> { board: Array(9), turn: 'X'|'O' }
const trivia = new Map(); // jid -> { question, answer }

const TRIVIA_BANK = [
  { q: 'What is the capital of Japan?', a: 'tokyo' },
  { q: 'How many continents are there on Earth?', a: '7' },
  { q: 'What planet is known as the Red Planet?', a: 'mars' },
  { q: 'What is the chemical symbol for gold?', a: 'au' },
  { q: 'How many legs does a spider have?', a: '8' },
  { q: 'What is the largest ocean on Earth?', a: 'pacific' },
  { q: 'In what year did WWII end?', a: '1945' },
  { q: 'What is the smallest prime number?', a: '2' },
];

function renderBoard(board) {
  const cell = (v, i) => v || String(i + 1);
  return [0, 3, 6].map((r) => [0, 1, 2].map((c) => cell(board[r + c], r + c)).join(' │ ')).join('\n───┼───┼───\n');
}

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(Boolean)) return 'draw';
  return null;
}

module.exports = { ttt, trivia, TRIVIA_BANK, renderBoard, checkWinner };
