const mongoose = require('mongoose');

// db options
const user = process.env.STATIC_SERVING_DB_USER;
const pass = process.env.STATIC_SERVING_DB_PASSWORD;
const hostname = process.env.MONGO_DB_HOSTNAME
const mongodbPort = process.env.MONGO_DB_PORT
const database = process.env.DATABASE
const options = "retryWrites=true&authSource=admin"
const uri = `mongodb://${user}:${pass}@${hostname}:${mongodbPort}/${database}?${options}`

// connect to database
const conn = mongoose.createConnection(uri, { useUnifiedTopology: true } );

// set up models
const userSchema = require("./schemas/user.js");
const User = conn.model("User", userSchema);

// exports
exports.conn = conn;
exports.User = User;

