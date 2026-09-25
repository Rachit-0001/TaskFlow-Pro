const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const pool = require("./config/database");

const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const dependencyRoutes = require("./routes/dependencyRoutes");
const aiRoutes =require("./routes/aiRoutes");



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


// Root
app.get("/", (req, res) => {
    res.json({
        message: "TaskFlow Pro API is running"
    });
});



// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        service: "TaskFlow Pro Backend"
    });
});


// Database test
app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT 1 AS database_test"
        );

        res.json({
            status: "OK",
            database: "MySQL",
            result: rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "ERROR",
            message: "Database connection failed"
        });
    }
});


// Routes
app.use("/api/projects", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api", dependencyRoutes);
app.use("/api", aiRoutes);

module.exports = app;