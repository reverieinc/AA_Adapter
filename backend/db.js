const { MongoClient } = require("mongodb");
const clientForMongo = new MongoClient("mongodb+srv://reverieinc:revuser123@cluster0.daotyn4.mongodb.net/?retryWrites=true&w=majority");
const db = clientForMongo.db("AA_WRAPPER");
const sessionCollection = db.collection("Session");
const aaClientCollection = db.collection("AAClient");
const authCollection = db.collection("Auth");

module.exports = { sessionCollection, authCollection, aaClientCollection }