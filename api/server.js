const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const user = process.env.MONGO_DB_USER
const pass = process.env.MONGO_DB_PASSWORD
//const hostname = process.env.MONGO_DB_HOSTNAME
const hostname = "db:27017"
const database = process.env.DATABASE
const options = "retryWrites=true&authSource=admin"
const uri = "mongodb://"+user+":"+pass+"@"+hostname+"/"+database+"?"+options

mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true } );

const connection = mongoose.connection;

connection.once('open', () => {
  console.log("Connected to database");
});

// add routes for handling events
const eventRouter = require('./routes/Events');
app.use('/events', eventRouter);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
