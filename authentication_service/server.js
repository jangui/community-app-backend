const express = require('express');
const cors = require('cors');

const { authToken, genAccessToken } = require('./auth');

// app setup
const app = express();
if (!process.env.AUTHENTICATION_SERVER_PORT) {
    console.log('Error: AUTHENTICATION_SERVER_PORT not set');
    return;
}
const port = process.env.AUTHENTICATION_SERVER_PORT;

app.use(cors());
app.use(express.json());

// set up routes
const authRouter = require('./routes/authRouter');
app.use('/', authRouter);

// start app
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
