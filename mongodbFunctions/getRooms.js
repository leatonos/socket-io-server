// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { MongoClient, ServerApiVersion, } from 'mongodb';
//const { MongoClient, ServerApiVersion } = require('mongodb');

const uri ='mongodb+srv://pedro:1CuYmShxJMsz23fj@cluster0.alojs.mongodb.net/?retryWrites=true&w=majority'
// Create a MongoClient with a MongoClientOptions object to set the Stable API version

export async function getRooms() {

  const client = new MongoClient(uri);

  try {

   const database = client.db('QuackChat')
   const roomCollection = database.collection('QuackRooms')

   const query = {password:''}
   const cursor = roomCollection.find(query)
   
   if ((await roomCollection.countDocuments(query)) === 0) {
    console.warn("No documents found!");
    }
  
    const result = await cursor.toArray()

    return result
    
  } finally {
  
    // Ensures that the client will close when you finish/error
    await client.close();
   
    
  }
}