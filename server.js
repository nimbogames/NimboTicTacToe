const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Serve static files from "public" folder
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let players = {};
let turn = 'X';

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  if (Object.keys(players).length < 2) {
    const symbol = Object.keys(players).length === 0 ? 'X' : 'O';
    players[socket.id] = symbol;

    socket.emit('symbol', symbol);
    if (Object.keys(players).length === 2) {
      io.emit('startGame');
    }
  } else {
    socket.emit('full', 'Room is full!');
  }

  socket.on('makeMove', (data) => {
    io.emit('moveMade', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerLeft');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
