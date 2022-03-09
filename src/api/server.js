const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const { conn } = require('./db.js');

// check env vars set
if (!(
    process.env.API_PORT
    && process.env.API_DB_USER
    && process.env.API_DB_PASSWORD
    && process.env.DATABASE
    && process.env.MONGO_DB_HOSTNAME
    && process.env.MONGO_DB_PORT
    && process.env.JWT_TOKEN_SECRET
    && process.env.JWT_EXPIRATION
    && process.env.BCRYPT_SALT_ROUNDS
    )) {
    console.log('Error: missing env vars');
    process.exit(1);
}

// app setup
const app = express();
const port = process.env.API_PORT;
app.use(cors());
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// check db connection
conn.once('open', () => {
  console.log("Connected to database");
});

// middle wares
const { authUser } = require('./utils/middlewares.js');

// set up routes
const registerRouter = require('./routes/register.js');
app.use('/register', registerRouter);

const loginRouter = require('./routes/login.js');
app.use('/login', loginRouter);

const verifyRouter = require('./routes/verify.js');
app.use('/verify', verifyRouter);

const userRouter = require('./routes/user.js');
app.use('/user', authUser, userRouter);

const postRouter = require('./routes/post.js');
app.use('/post', authUser, postRouter);

const communityRouter = require('./routes/community.js');
app.use('/community', authUser, communityRouter);

/*
const outingRouter = require('./routes/outing.js');
app.use('/outing', authUser, outingRouter);

const pollRouter = require('./routes/poll.js');
app.use('/poll', authUser, pollRouter);
*/

// start app
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
