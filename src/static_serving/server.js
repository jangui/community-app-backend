import express from 'express';
import cors from 'cors';

// check env vars set
if (!process.env.STATIC_FILE_SERVER_PORT) {
    console.log('Error: STATIC_FILE_SERVER_PORT not set');
    process.exit(1);
}
if (!process.env.STATIC_FILE_DIR) {
    console.log('Error: STATIC_FILE_DIR not set');
    process.exit(1);
}

// app setup
const app = express();
const port = process.env.STATIC_FILE_SERVER_PORT;

app.use(cors());
app.use(express.json());

// set static files directory
app.use('/', [express.static(process.env.STATIC_FILE_DIR)]);

// start app
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
