const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

app.get('/', (req, res) => {
  res.send(`<h1>We have ${getAllRooms.length} rooms running right now</h1>`);
});


const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  },
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
   // maxDisconnectionDuration: 1 * 60 * 1000,
    // whether to skip middlewares upon successful recovery
    //skipMiddlewares: true,
  }
});

//Both namespaces share the same 'Database'
const activeRooms = [];

io.on('connection', (socket) => {

    socket.on('joinRoom' , (roomId,duckName,duckColor)=>{
      socket.data.username = duckName
      socket.data.duckColor = duckColor
      socket.join(roomId)
      
      if(findRoomIndex(roomId) != -1){
        console.log(`Adding a duck in the Room index:${findRoomIndex(roomId)}`)
        activeRooms[findRoomIndex(roomId)].ducks.push({duckId:socket.id,duckName:duckName,color:duckColor})
      }else{
        console.log("Error: Room not found")
      }
      
      console.log('userJoined Room:',roomId)
      io.emit('activeRooms', activeRooms);
    })

    socket.on('createRoom',(roomId,roomName,limit)=>{
      activeRooms.push({
        roomId:roomId,
        roomName:roomName,
        limit:limit,
        ducks:[]
      })
     
      console.log(activeRooms)
    })
    
    socket.on('message', (msg) => {
      console.log(msg)
      io.to(msg.roomId).emit('new message',msg)
    });

    socket.on("disconnect", () => {
     // console.log(`User with socket ${socket.id} was disconnected`)
    });

    socket.on("disconnecting", (reason) => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("A duck left the room", socket.id);
          if(findRoomIndex(room) != -1){
           removeDuckFromRoom(room,socket.id) 
          }
        }
      }
      io.emit('activeRooms', activeRooms);
    });

    socket.on("getRooms",(id) =>{
      io.to(id).emit('activeRooms', activeRooms);
    })

});

//Rooms namespace

io.of("/room").on("connection", (socket) => {
  socket.on("user:list", () => {});
});

//Get all Users in a Room
const getUsersInRoom = (roomName) => {
  const room = io.sockets.adapter.rooms.get(roomName);

  if (room) {
    const sockets = Array.from(room.values()).map((socketId) => io.sockets.sockets.get(socketId));
    const users = sockets.map((socket) => ({ id: socket.id, username: socket.username }));
    return users;
  } else {
    return [];
  }
};


const findRoomIndex = (roomId) => {
  for (let i = 0; i < activeRooms.length; i++) {
    if (activeRooms[i].roomId === roomId) {
      return i; // Room with the given roomId exists, return its index
    }
  }
  return -1; // Room with the given roomId does not exist in the array
}

const findDuckInTheRoom = (roomId,duckId) => {
  for (let i = 0; i < activeRooms.length; i++) {
    if (activeRooms[i].roomId === roomId) {
        let duckArray = activeRooms[i].ducks
        for(let duckIndex = 0;duckIndex < duckArray.length;duckIndex++){
          if(duckArray[duckIndex].duckId === duckId){
            return duckIndex
          }
        }
    }
  }
  return -1; // We could not find the duck
}

/**
 * Removes a user "Duck" from a quack room.
 * Also if there are no more ducks left in the room it deletes the room
 * @param {string} roomId - the roomId where the duck is
 * @param {string} duckId - the duck id
 */
const removeDuckFromRoom = (roomId,duckId) =>{

  const duckIndex = findDuckInTheRoom(roomId,duckId)
  const roomIndex = findRoomIndex(roomId)

  if(duckIndex != -1){
    activeRooms[roomIndex].ducks.splice(duckIndex,1)
  }

  if(activeRooms[roomIndex].ducks.length == 0){
    activeRooms.splice(roomIndex,1)
  }
}

const port = process.env.PORT || 3000


server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});