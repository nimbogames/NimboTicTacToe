const socket = io();

let playerName = '';
let opponentName = '';
let isMyTurn = false;
let cells = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let playerWins = 0;

// Sound effects
const moveSound = document.getElementById('moveSound');
const winSound = document.getElementById('winSound');
const drawSound = document.getElementById('drawSound');

// Handle player joining
function joinGame() {
    playerName = document.getElementById('playerName').value.trim();
    if (playerName) {
        socket.emit('join', playerName);
        document.querySelector('.players').style.display = 'none';
    }
}

// Handle player names received
socket.on('playerNames', ({ players, turn }) => {
    opponentName = players.find(p => p !== playerName) || 'Waiting...';
    isMyTurn = (turn === playerName);
    updateGameStatus();
});

// Handle moves from server
socket.on('move', ({ index, player }) => {
    cells[index] = player;
    document.querySelectorAll('.cell')[index].innerText = player;
    currentPlayer = player === 'X' ? 'O' : 'X';
    isMyTurn = (playerName === currentPlayer);
    checkWinner();
    updateGameStatus();
});

// Handle game reset from server
socket.on('reset', () => {
    cells = ['', '', '', '', '', '', '', '', ''];
    document.querySelectorAll('.cell').forEach(cell => cell.innerText = '');
    currentPlayer = 'X';
    updateGameStatus();
});

// Handle clicking on a cell
document.querySelectorAll('.cell').forEach((cell, index) => {
    cell.addEventListener('click', () => {
        if (isMyTurn && cells[index] === '') {
            moveSound.play();
            cells[index] = currentPlayer;
            cell.innerText = currentPlayer;
            socket.emit('move', { index, player: currentPlayer });
            isMyTurn = false;
            checkWinner();
            updateGameStatus();
        }
    });
});

// Handle reset button
function resetGame() {
    socket.emit('reset');
}

// Update the game status text
function updateGameStatus() {
    const gameStatus = document.getElementById('gameStatus');
    if (!opponentName || opponentName === 'Waiting...') {
        gameStatus.innerText = 'Waiting for opponent...';
    } else {
        gameStatus.innerText = isMyTurn ? `Your Turn (${currentPlayer})` : `${opponentName}'s Turn (${currentPlayer === 'X' ? 'O' : 'X'})`;
    }
}

// Check for a winner or a draw
function checkWinner() {
    const gameStatus = document.getElementById('gameStatus');
    const winningCombos = [
        [0,1,2], [3,4,5], [6,7,8], 
        [0,3,6], [1,4,7], [2,5,8], 
        [0,4,8], [2,4,6]
    ];

    for (const combo of winningCombos) {
        const [a, b, c] = combo;
        if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
            gameStatus.innerText = `${cells[a]} wins! 🎉`;
            isMyTurn = false;
            winSound.play();
            if (cells[a] === currentPlayer) {
                playerWins++;
                updateLeaderboard();
            }
            return;
        }
    }

    if (cells.every(cell => cell !== '') && !gameStatus.innerText.includes('wins')) {
        gameStatus.innerText = `It's a Draw! 🤝`;
        drawSound.play();
    }
}

// Update the leaderboard
function updateLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard) {
        leaderboard.innerText = `${playerName}: ${playerWins} wins`;
    }
}

// Hide splash screen after loading
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splash').style.display = 'none';
    }, 3000);
});
