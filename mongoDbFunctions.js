// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


const uri = process.env.MONGODB_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
/**
 * 
 * @returns All the Quackrooms
 */
async function getAllRooms() {

  const client = new MongoClient(uri);

  try {

   const database = client.db('QuackChat')
   const roomCollection = database.collection('QuackRooms')

   const cursor = roomCollection.find({})
   
    const result = await cursor.toArray()

    return result
    
  } finally {
  
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

async function getRoomInfo(roomId) {
  const client = new MongoClient(uri);

   const database = client.db('QuackChat')
   const roomCollection = database.collection('QuackRooms')

   const query = {_id:new ObjectId(roomId)}

   const options = {
    projection: { _id: 0, ducks: 1},
  };

   const room = await roomCollection.findOne(query, options);
   
   // Ensures that the client will close when you finish/error
   await client.close();
d
   return room 
  
}

/**
 * Adds a duck to a room document in MongoDB
 * @param {string} roomId 
 * @param {*} duckObj 
 * @returns roomInfo
 */
async function addDuckToRoom(roomId,duckObj){
  const client = new MongoClient(uri);

  try{

  const database = client.db('QuackChat')
  const roomCollection = database.collection('QuackRooms')

  const filter = {_id: new ObjectId(roomId)}

  const updateDoc = {
    $push: { ducks: duckObj }
  };

  await roomCollection.updateOne(filter, updateDoc);

  const options = {
   projection: { _id: 0, ducks: 1,roomName:1,limit:1 },
 };

  const room = await roomCollection.findOne(filter, options);

  return room

  }finally{
    await client.close()
  }

}

/**
 * 
 * @param {string} roomId 
 * @param {string} duckIdToRemove 
 * @returns roomInfo
 */
async function removeDuckFromRoom(roomId,duckIdToRemove){

  const client = new MongoClient(uri);

  try{

    const database = client.db('QuackChat')
    const roomCollection = database.collection('QuackRooms')
  
    const filter = {_id: new ObjectId(roomId)}
  
    console.log(duckIdToRemove)
  
    const updateDoc = {
      $pull: { ducks: {duckId:duckIdToRemove} }
    };
  
    const result = await roomCollection.updateOne(filter, updateDoc);

    console.log(
      `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
    );

    const options = {
      projection: { _id: 0, ducks: 1,roomName:1,limit:1 },
    };
   
     const room = await roomCollection.findOne(filter, options);
   
     return room

  }finally{
    await client.close()
  }

}
/**
 * 
 * @param {string} roomId 
 * @param {string} duckId 
 * @param {string} duckName 
 * @param {string} duckColor 
 * @returns roomInfo
 */
async function editDuck(roomId,duckId,duckName,duckColor){
  
  const client = new MongoClient(uri);
  
    try{

      const database = client.db('QuackChat')
      const roomCollection = database.collection('QuackRooms')
    
      const filter = { _id: new ObjectId(roomId), "ducks.duckId":duckId }
      
      const updateDoc = {
        $set: { "ducks.$.duckName": duckName, "ducks.$.color": duckColor }
      };
    
      await roomCollection.updateOne(filter, updateDoc);
    
      console.log(
        `Duck id: ${duckId} has been updated its name now is: ${duckName} and the color is ${duckColor}`,
      );

      const options = {
        projection: { _id: 0, ducks: 1 },
      };
     
       const room = await roomCollection.findOne(filter, options);
     
       return room


    }finally{
      await client.close()
    }

}


module.exports = {
  getAllRooms,
  addDuckToRoom,
  removeDuckFromRoom,
  editDuck,
  getRoomInfo
};