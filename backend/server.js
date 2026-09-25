require("dotenv").config();

const app = require("./src/app");
const pool = require("./src/config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await pool.getConnection();

        console.log("MySQL database connected successfully");

        connection.release();

        app.listen(PORT, () => {
            console.log(`TaskFlow Pro backend running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MySQL connection failed:");
        console.error(error.message);

        process.exit(1);
    }
}

startServer();