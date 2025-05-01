const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Game rooms
const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: [],
                board: Array(9).fill(null),
                currentTurn: 'X',
                gameOver: false
            };
        }

        const room = rooms[roomId];

        if (room.players.length >= 2) {
            socket.emit('errorMessage', 'Room full.');
            return;
        }

        const symbol = room.players.length === 0 ? 'X' : 'O';
        room.players.push({ id: socket.id, symbol });
        socket.join(roomId);
        socket.emit('roomJoined', symbol);

        if (room.players.length === 2) {
            // Notify both players to start
            io.to(roomId).emit('startGame', room.currentTurn);
            sendGameUpdate(roomId);
        }
    });

    socket.on('makeMove', (index) => {
        const roomId = getPlayerRoom(socket.id);
        if (!roomId) return;
        const room = rooms[roomId];

        const player = room.players.find(p => p.id === socket.id);
        if (!player || room.gameOver) return;
        if (room.board[index]) return;

        if (player.symbol !== room.currentTurn) return;

        room.board[index] = player.symbol;
        const winner = checkWinner(room.board);

        if (winner) {
            io.to(roomId).emit('gameUpdate', {
                board: room.board,
                currentTurn: room.currentTurn
            });
            io.to(roomId).emit('gameOver', `${winner} wins!`);
            room.gameOver = true;
        } else if (room.board.every(cell => cell)) {
            io.to(roomId).emit('gameUpdate', {
                board: room.board,
                currentTurn: room.currentTurn
            });
            io.to(roomId).emit('gameOver', `It's a draw!`);
            room.gameOver = true;
        } else {
            room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
            sendGameUpdate(roomId);
        }
    });

    socket.on('restartGame', () => {
        const roomId = getPlayerRoom(socket.id);
        if (!roomId) return;

        const room = rooms[roomId];
        room.board = Array(9).fill(null);
        room.currentTurn = 'X';
        room.gameOver = false;

        io.to(roomId).emit('restartGame');
        sendGameUpdate(roomId);
    });

    socket.on('disconnect', () => {
        const roomId = getPlayerRoom(socket.id);
        if (!roomId) return;

        const room = rooms[roomId];
        room.players = room.players.filter(p => p.id !== socket.id);

        if (room.players.length === 0) {
            delete rooms[roomId];
        } else {
            io.to(roomId).emit('errorMessage', 'Opponent left the game.');
        }
    });

    function getPlayerRoom(socketId) {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.players.find(p => p.id === socketId)) {
                return roomId;
            }
        }
        return null;
    }

    function sendGameUpdate(roomId) {
        const room = rooms[roomId];
        io.to(roomId).emit('gameUpdate', {
            board: room.board,
            currentTurn: room.currentTurn
        });
    }

    function checkWinner(board) {
        const winCombos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];

        for (const [a, b, c] of winCombos) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
