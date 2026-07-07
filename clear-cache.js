const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function clearCache() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  try {
    await mongoose.connection.db.collection('documentchecklists').deleteMany({});
    console.log("Cleared documentchecklists cache.");
  } catch (err) {
    console.error(err);
  }
  await mongoose.disconnect();
}

clearCache();
