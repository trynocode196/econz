require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    console.log("Connecting to:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    // Count quotes
    if (collections.some(c => c.name === 'quotes')) {
      const quotesCount = await mongoose.connection.db.collection('quotes').countDocuments();
      console.log("Quotes count:", quotesCount);
      const sample = await mongoose.connection.db.collection('quotes').findOne();
      console.log("Sample quote:", sample);
    } else {
      console.log("No quotes collection found.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
