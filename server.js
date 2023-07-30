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

//Disconnect Event
io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
});

//Message event
io.on('connection', (socket) => {
    socket.on('message', (msg) => {
      io.emit(`message room:${msg.roomId}`, msg);
    });
});

//Change Duck Event
io.on('connection', (socket) => {
    socket.on('changeDuck', (change) => {
      io.emit(`duck change:${change.roomId}`, change);
    });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});