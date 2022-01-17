import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// app setup
const app = express();
const port = process.env.API_PORT || 5000;

app.use(cors());
app.use(express.json());

// database options
const user = process.env.MONGO_DB_USER
const pass = process.env.MONGO_DB_PASSWORD
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
mongoose.connect(uri, { useUnifiedTopology: true } );
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("Connected to database");
});

// set up routes
const userRouter = require('./routes/user');
app.use('/user', userRouter);

// start app
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
