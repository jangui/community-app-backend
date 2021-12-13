const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

const { authUser } = require('./utils');

// app setup
const app = express();
const port = process.env.API_PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload({createParentPath: true}));

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
const registerRouter = require('./routes/register');
app.use('/register', registerRouter);

const loginRouter = require('./routes/login');
app.use('/login', loginRouter);

const userRouter = require('./routes/user');
app.use('/user', authUser, userRouter);

const postRouter = require('./routes/post');
app.use('/post', authUser, postRouter);

const communityRouter = require('./routes/community');
app.use('/community', authUser, communityRouter);

// start app
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
