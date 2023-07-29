const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.send('<h1>Server running</h1>');
});

io.on('connection', (socket) => {
    socket.broadcast.emit('hi');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
});

io.on('connection', (socket) => {
    socket.on('message', (msg) => {
      io.emit(`message room:${msg.roomId}`, msg.text);
      console.log('message:');
      console.log(msg)
    });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});