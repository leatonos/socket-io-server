const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const mongoDB = require('./mongoDbFunctions')
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`<h1>We are online! rooms running right now</h1>`);
});


app.get('/allrooms', async(req, res) => {
  const mongoDBRooms = await mongoDB.getAllRooms()
  res.send(mongoDBRooms);
});

app.get('/room', async(req, res) => {
  const mongoDBRooms = await mongoDB.getRoomInfo()
  res.send(mongoDBRooms);
});



const io = require("socket.io")(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: false
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

    socket.on("sendQuack", async(roomId,duckId,duckName,duckColor) =>{
      const duckInfo = {
        duckId:duckId,
        duckName:duckName,
        color:duckColor
      }

      const messageObj = {
        text: `Quack!`,
        duckName:duckName,
        color:duckColor,
        roomId:roomId
      }

      console.log('Quack received by', duckInfo)

      io.to(roomId).emit(`Quack`, duckInfo)
      io.to(roomId).emit('new message',messageObj)
 
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