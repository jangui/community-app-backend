const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// app setup
const app = express();
const port = 6000; // TODO

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


// middle wares
const { authUser } = require('./utils/middlewares.js');

// set up routes
const registerRouter = require('./routes/register.js');
app.use('/register', registerRouter);

const loginRouter = require('./routes/login.js');
app.use('/login', loginRouter);

const userRouter = require('./routes/user.js');
app.use('/user', authUser, userRouter);

const postRouter = require('./routes/post.js');
app.use('/post', authUser, postRouter);

// start app
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
