const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.API_PORT || 5000;

app.use(cors());
app.use(express.json());

const user = process.env.MONGO_DB_USER
const pass = process.env.MONGO_DB_PASSWORD
const hostname = process.env.MONGO_DB_HOSTNAME
const mongodbPort = process.env.MONGO_DB_PORT
const database = process.env.DATABASE
const options = "retryWrites=true&authSource=admin"
const uri = `mongodb://${user}:${pass}@${hostname}:${mongodbPort}/${database}?${options}`

mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true } );

const connection = mongoose.connection;

connection.once('open', () => {
  console.log("Connected to database");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
