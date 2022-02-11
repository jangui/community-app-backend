const mongoose = require('mongoose');

// check env vars
const user = process.env.API_DB_USER;
const pass = process.env.API_DB_PASSWORD;
const hostname = process.env.MONGO_DB_HOSTNAME
const mongodbPort = process.env.MONGO_DB_PORT
const database = process.env.DATABASE
const options = "retryWrites=true&authSource=admin"
const uri = `mongodb://${user}:${pass}@${hostname}:${mongodbPort}/${database}?${options}`

// get rid of depreciation warnings for mongoose v5.4.x
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// connect to database
const conn = mongoose.createConnection(uri, { useUnifiedTopology: true } );

// set up models
const userSchema = require("./schemas/user.js");
const User = conn.model("User", userSchema);

// exports
exports.conn = conn;
exports.User = User;

