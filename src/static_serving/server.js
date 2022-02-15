const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { conn } = require('./db.js');

// check env vars set
if (!(
    process.env.STATIC_STORAGE
    && process.env.STATIC_SERVING_PORT
    && process.env.STATIC_SERVING_DB_USER
    && process.env.STATIC_SERVING_DB_PASSWORD
    && process.env.DATABASE
    && process.env.MONGO_DB_HOSTNAME
    && process.env.MONGO_DB_PORT
)) {
    console.log('Error: env vars not set');
    process.exit(1);
}

// app setup
const app = express();
const port = process.env.STATIC_SERVING_PORT;

app.use(cors());

// set static files directory
app.use('/', [express.static("/static")]);

// check db connection
conn.once('open', () => {
  console.log("Connected to database");
});

// start app
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
