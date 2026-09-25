const pool = require("../config/database");

// Create a project
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Project name is required"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO projects (name, description)
             VALUES (?, ?)`,
            [name.trim(), description || null]
        );

        const [rows] = await pool.execute(
            `SELECT *
             FROM projects
             WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: "Project created successfully",
            project: rows[0]
        });

    } catch (error) {
        console.error("Create project error:", error);

        res.status(500).json({
            message: "Failed to create project"
        });
    }
};


// Get all projects
const getProjects = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT *
             FROM projects
             ORDER BY created_at DESC`
        );

        res.status(200).json({
            count: rows.length,
            projects: rows
        });

    } catch (error) {
        console.error("Get projects error:", error);

        res.status(500).json({
            message: "Failed to fetch projects"
        });
    }
};


// Get project by ID
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            `SELECT *
             FROM projects
             WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.status(200).json({
            project: rows[0]
        });

    } catch (error) {
        console.error("Get project error:", error);

        res.status(500).json({
            message: "Failed to fetch project"
        });
    }
};


module.exports = {
    createProject,
    getProjects,
    getProjectById
};