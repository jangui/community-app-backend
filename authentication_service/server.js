import express from 'express';
import cors from 'cors';

// app setup
const app = express();
if (!process.env.AUTHENTICATION_SERVER_PORT) {
    console.log('Error: AUTHENTICATION_SERVER_PORT not set');
    process.exit(1);
}
const port = process.env.AUTHENTICATION_SERVER_PORT;

app.use(cors());
app.use(express.json());

// set up routes
import authRouter from './routes/authRouter.js';
app.use('/', authRouter);

// start app
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
