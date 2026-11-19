require("dotenv").config({ quiet: true });
const app = require("./app");
const pool = require("./config/db");

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log("Connected to Mysql");

    app.listen(port, () => {
      console.log(`App runnig on https://localhost:${port}...`);
    });
  } catch (err) {
    console.error("Could not connect to Mysql:", err.message);
    process.exit(1);
  }
};

startServer();