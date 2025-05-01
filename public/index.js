const socket = io();
const joinForm = document.getElementById('joinForm');
const roomInput = document.getElementById('roomInput');
const board = document.getElementById('board');
const status = document.getElementById('status');
const error = document.getElementById('error');
const cells = document.querySelectorAll('.cell');
const restartBtn = document.getElementById('restartBtn');

let playerSymbol = '';
let myTurn = false;

joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roomId = roomInput.value.trim();
    if (roomId) {
        socket.emit('joinRoom', roomId);
    }
});

socket.on('roomJoined', (symbol) => {
    playerSymbol = symbol;
    joinForm.style.display = 'none';
    board.style.display = 'grid';
    status.textContent = 'Waiting for opponent...';
});

socket.on('startGame', (symbol) => {
    myTurn = (playerSymbol === symbol);
    updateStatus();
});

socket.on('gameUpdate', ({ board: serverBoard, currentTurn }) => {
    serverBoard.forEach((value, i) => {
        cells[i].textContent = value || '';
    });
    myTurn = (playerSymbol === currentTurn);
    updateStatus();
});

socket.on('gameOver', (result) => {
    status.textContent = result;
    myTurn = false;
    restartBtn.style.display = 'inline-block';
});

socket.on('errorMessage', (msg) => {
    error.textContent = msg;
});

restartBtn.addEventListener('click', () => {
    socket.emit('restartGame');
});

socket.on('restartGame', () => {
    cells.forEach(cell => cell.textContent = '');
    status.textContent = 'Game restarted. Waiting for opponent...';
    restartBtn.style.display = 'none';
});

cells.forEach((cell, i) => {
    cell.addEventListener('click', () => {
        if (myTurn && cell.textContent === '') {
            socket.emit('makeMove', i);
        }
    });
});

function updateStatus() {
    status.textContent = myTurn ? 'Your turn!' : 'Opponent\'s turn';
}
