require('dotenv').config({ quiet: true });
const app = require('./app');
const pool = require('./config/db');
const queue = require('./utils/queue');

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('Connected to MySQL');

    await queue.connect();
    console.log('Connected to Redis');

    app.listen(port, () => {
      console.log(`App running on http://localhost:${port}...`);
    });
  } catch (err) {
    console.error('Could not start the server:', err.message);
    process.exit(1);
  }
};

startServer();