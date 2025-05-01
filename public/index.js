const socket = io();
let symbol = '';
let myTurn = false;

const board = document.getElementById('board');
const status = document.getElementById('status');

// Create board
for (let i = 0; i < 9; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  cell.dataset.index = i;
  cell.addEventListener('click', () => {
    if (myTurn && cell.textContent === '') {
      cell.textContent = symbol;
      socket.emit('makeMove', {
        index: i,
        symbol: symbol
      });
      myTurn = false;
      updateStatus("Opponent's turn");
    }
  });
  board.appendChild(cell);
}

function updateStatus(message) {
  status.textContent = message;
}

socket.on('symbol', (sym) => {
  symbol = sym;
  updateStatus('You are ' + symbol);
});

socket.on('startGame', () => {
  if (symbol === 'X') {
    myTurn = true;
    updateStatus("Your turn");
  } else {
    updateStatus("Opponent's turn");
  }
});

socket.on('moveMade', (data) => {
  const cell = document.querySelector(`.cell[data-index='${data.index}']`);
  if (cell.textContent === '') {
    cell.textContent = data.symbol;
    if (data.symbol !== symbol) {
      myTurn = true;
      updateStatus("Your turn");
    }
  }
});

socket.on('playerLeft', () => {
  updateStatus('Opponent left. Waiting for player...');
});
