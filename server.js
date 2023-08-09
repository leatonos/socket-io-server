const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const mongoDB = require('./mongoDbFunctions')

app.get('/', (req, res) => {
  res.send(`<h1>We are online! rooms running right now</h1>`);
});

const corsOptions = {
  origin:  "http://localhost:3000", // Replace with your client domain
  methods: ['GET', 'POST'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
};

app.use(cors(corsOptions));

const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000","https://quack-rooms.vercel.app/"],
    methods: ["GET", "POST"],
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
  },
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
   // maxDisconnectionDuration: 1 * 60 * 1000,
    // whether to skip middlewares upon successful recovery
    //skipMiddlewares: true,
  }
});

io.on('connection', (socket) => {

    
    socket.on('createRoom', async()=>{
      const mongoDBRooms = await mongoDB.getAllRooms()
      io.emit('activeRooms', mongoDBRooms);
    })

    //This happens when someone tries to enter a room
    socket.on('joinRoom' , async(roomId,duckName,duckColor)=>{

      socket.data.duckName = duckName
      socket.data.color = duckColor

      const newDuck = {
        duckId:socket.id,
        duckName:duckName,
        color:duckColor
      }

      socket.join(roomId)

      const updatedRoom = await mongoDB.addDuckToRoom(roomId,newDuck)
      const messageObj = {
        text: `There is a new duck in this room`,
        duckName:'Duck server',
        color:'#FFD700',
        roomId:socket.id
      }

      const activeRooms = await mongoDB.getAllRooms()

      io.to(roomId).emit('new message',messageObj)
      io.emit('activeRooms', activeRooms);
      console.log(updatedRoom)
      io.to(roomId).emit(`Ducks in the room`, updatedRoom)
    })
   
    //This happens when someone tries to enter a room DONE!
    socket.on('message', (msg) => {
      console.log(msg)
      io.to(msg.roomId).emit('new message',msg)
    });
    //Does nothing for now
    socket.on("disconnect", () => {
     //console.log(`User with socket ${socket.id} was disconnected`)
    });

    socket.on("disconnecting", async(reason) => {
     
      for (const room of socket.rooms) {
        if (room !== socket.id) {

          console.log(`Duck with id:${socket.id} is leaving the room ${room}`)

          const disconnectMessage = {
            text: `A duck named: ${socket.data.duckName} left the room`,
            duckName:"Duck server",
            color:'#FFD700',
            roomId:room
          }

          const updatedRoomInfo = await mongoDB.removeDuckFromRoom(room, socket.id)
          if(!updatedRoomInfo){
            return
          }
          if(updatedRoomInfo.ducks.length < 1){
            await mongoDB.deleteRoom(room)
          }
          io.to(room).emit('new message',disconnectMessage)
          io.to(room).emit(`Ducks in the room`, updatedRoomInfo)
        }
      }

      io.emit('activeRooms', await mongoDB.getAllRooms());
      
    });

    socket.on("getRooms", async(id) =>{
      io.to(id).emit('activeRooms', await mongoDB.getAllRooms());
    })

    socket.on("duckChange", async(roomId,duckId,duckName,duckColor) =>{


     const roomInfo = await mongoDB.editDuck(roomId,duckId,duckName,duckColor)
     io.to(roomId).emit(`Ducks in the room`, roomInfo)

    })



});


function emitDucksInRoom(roomName) {
  console.log('emmiting changes')
  const socketsInRoom = [];
  const room = io.sockets.adapter.rooms.get(roomName);

  if (room) {
    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socketsInRoom.push({
          duckId: socket.id,
          duckName: socket.data.duckName,
          color: socket.data.color
        });
      }
    }

    console.log('These are the ducks in this room:')
    console.log(socketsInRoom)


  }
  
  io.to(roomName).emit(`Ducks in the room`, socketsInRoom);
}


const port = process.env.PORT || 3004

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});