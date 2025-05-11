const { MongoClient } = require("mongodb");

// eslint-disable-next-line no-undef
const client = new MongoClient(process.env.DATABASE);

let db;

async function connectToDB() {
  if (!db) {
    await client.connect();
    db = client.db("GeniusPlay");
  }
  return db;
}

module.exports = { connectToDB };
