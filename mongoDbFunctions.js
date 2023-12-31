const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const timeout = 4000;

const uri = process.env.MONGODB_URI
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
/**
 * 
 * @returns All the Quackrooms
 */
async function getAllRooms() {

  
  const client = new MongoClient(uri,{ 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS:timeout 
  });  
  

  try {

   await client.connect();

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

/**
 * 
 * @param {string} roomId 
 * @returns A room object
 */
async function getRoomInfo(roomId) {

    
  const client = new MongoClient(uri,{ 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS:timeout 
  });  

  try{

   
    await client.connect();

    const database = client.db('QuackChat')
    const roomCollection = database.collection('QuackRooms')
 
    const query = {_id:new ObjectId(roomId)}
 
    const options = {
     projection: { _id: 0, ducks: 1,roomName:1,limit:1},
   };
 
    const room = await roomCollection.findOne(query, options);
    return room 
  
  }catch (err) {
    console.error('Error:', err);
  }finally{
  // Ensures that the client will close when you finish/error
  await client.close();
  }

   
   
  
}

/**
 * Adds a duck to a room document in MongoDB
 * @param {string} roomId 
 * @param {*} duckObj 
 * @returns roomInfo
 */
async function addDuckToRoom(roomId,duckObj){

    
  const client = new MongoClient(uri,{ 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS:timeout 
  });  

  try{

  await client.connect();
  
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

  }catch (err) {
    console.error('Error:', err);
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

  
  const client = new MongoClient(uri,{ 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS:timeout 
  });  
 
  try{
    await client.connect();

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

     console.log(room)
   
     return room

  }catch (err) {
    console.error('Error:', err);
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
  
 
const client = new MongoClient(uri,{ 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS:timeout 
});  
  
    try{

      await client.connect();

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
        projection: { _id: 0, ducks: 1,ducks: 1,roomName:1,limit:1 },
      };
     
       const room = await roomCollection.findOne(filter, options);
     
       return room


    }catch (err) {
      console.error('Error:', err);
    }finally{
      await client.close()
    }

}

async function deleteRoom(roomId){

  const client = new MongoClient(uri,{ 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS:timeout 
  });  
  

  try{

    await client.connect();

    const database = client.db('QuackChat')
    const roomCollection = database.collection('QuackRooms')

    const query = {_id: new ObjectId(roomId)}

    const deleteResult = await roomCollection.deleteOne(query)

    if (deleteResult.deletedCount === 1) {
      console.log("Successfully deleted one room.");
    } else {
      console.log("No documents matched the query. Deleted 0 rooms.");
    }

  }catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }


}


module.exports = {
  getAllRooms,
  addDuckToRoom,
  removeDuckFromRoom,
  editDuck,
  deleteRoom,
  getRoomInfo
};