const pool = require("../config/database");

const {
    propagateSchedule,
    getEnrichedTasks
} = require("../services/schedulingService");



// Create task
const createTask = async (req, res) => {
    try {
        const { id: projectId } = req.params;

        const {
            title,
            description,
            status,
            startDate,
            endDate,
            duration,
            position
        } = req.body;

        // Validate title
        if (!title || title.trim() === "") {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        // Check project exists
        const [projects] = await pool.execute(
            "SELECT id FROM projects WHERE id = ?",
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Validate status
        const validStatuses = [
            "BACKLOG",
            "IN_PROGRESS",
            "REVIEW",
            "DONE"
        ];

        const taskStatus = status || "BACKLOG";

        if (!validStatuses.includes(taskStatus)) {
            return res.status(400).json({
                message: "Invalid task status"
            });
        }

        // Insert task
        const [result] = await pool.execute(
            `INSERT INTO tasks
            (
                project_id,
                title,
                description,
                status,
                start_date,
                end_date,
                duration,
                position
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                projectId,
                title.trim(),
                description || null,
                taskStatus,
                startDate || null,
                endDate || null,
                duration || 1,
                position || 0
            ]
        );

        await propagateSchedule(
                Number(projectId)
            );

        // Fetch created task
        const [rows] = await pool.execute(
            `SELECT *
             FROM tasks
             WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: "Task created successfully",
            task: rows[0]
        });

    } catch (error) {
        console.error("Create task error:", error);

        res.status(500).json({
            message: "Failed to create task"
        });
    }
};


// Get all tasks of a project
const getTasksByProject = async (req, res) => {
    try {
        const { id: projectId } = req.params;

        const [projects] = await pool.execute(
            "SELECT id FROM projects WHERE id = ?",
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const tasks = await getEnrichedTasks(
            projectId
        );

        res.status(200).json({
            count: tasks.length,
            tasks
        });

    } catch (error) {
        console.error(
            "Get tasks error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
};



// Update task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            description,
            status,
            startDate,
            endDate,
            duration,
            position
        } = req.body;

        // Check task exists
        const [existingTasks] = await pool.execute(
            "SELECT * FROM tasks WHERE id = ?",
            [id]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        const existingTask = existingTasks[0];

        // Validate status if provided
        const validStatuses = [
            "BACKLOG",
            "IN_PROGRESS",
            "REVIEW",
            "DONE"
        ];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid task status"
            });
        }

        const updatedTitle =
            title !== undefined
                ? title.trim()
                : existingTask.title;

        if (!updatedTitle) {
            return res.status(400).json({
                message: "Task title cannot be empty"
            });
        }

        await propagateSchedule(
            Number(existingTask.project_id)
        );

        await pool.execute(
            `UPDATE tasks
             SET
                title = ?,
                description = ?,
                status = ?,
                start_date = ?,
                end_date = ?,
                duration = ?,
                position = ?
             WHERE id = ?`,
            [
                updatedTitle,
                description !== undefined
                    ? description
                    : existingTask.description,

                status !== undefined
                    ? status
                    : existingTask.status,

                startDate !== undefined
                    ? startDate
                    : existingTask.start_date,

                endDate !== undefined
                    ? endDate
                    : existingTask.end_date,

                duration !== undefined
                    ? duration
                    : existingTask.duration,

                position !== undefined
                    ? position
                    : existingTask.position,

                id
            ]
        );

        // Get updated task
        const [rows] = await pool.execute(
            "SELECT * FROM tasks WHERE id = ?",
            [id]
        );

        res.status(200).json({
            message: "Task updated successfully",
            task: rows[0]
        });

    } catch (error) {
        console.error("Update task error:", error);

        res.status(500).json({
            message: "Failed to update task"
        });
    }
};


// Delete task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const [existingTasks] = await pool.execute(
            "SELECT id FROM tasks WHERE id = ?",
            [id]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        await pool.execute(
            "DELETE FROM tasks WHERE id = ?",
            [id]
        );

        res.status(200).json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete task error:", error);

        res.status(500).json({
            message: "Failed to delete task"
        });
    }
};


module.exports = {
    createTask,
    getTasksByProject,
    updateTask,
    deleteTask
};