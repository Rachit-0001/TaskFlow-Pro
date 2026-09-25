const pool = require("../config/database");

/*
    Check whether adding:
    
        predecessorId -> successorId

    would create a cycle.

    Example:

        1 -> 2
        2 -> 3

    Adding:

        3 -> 1

    would create:

        1 -> 2 -> 3 -> 1

    Therefore, reject it.
*/
const createsCycle = async (predecessorId, successorId, projectId) => {
    const [dependencies] = await pool.execute(
        `SELECT predecessor_id, successor_id
         FROM dependencies
         WHERE project_id = ?`,
        [projectId]
    );

    // Build adjacency list
    const graph = {};

    for (const dependency of dependencies) {
        if (!graph[dependency.predecessor_id]) {
            graph[dependency.predecessor_id] = [];
        }

        graph[dependency.predecessor_id].push(
            dependency.successor_id
        );
    }

    // Temporarily add the new edge
    if (!graph[predecessorId]) {
        graph[predecessorId] = [];
    }

    graph[predecessorId].push(successorId);

    // DFS cycle detection
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (node) => {
        if (recursionStack.has(node)) {
            return true;
        }

        if (visited.has(node)) {
            return false;
        }

        visited.add(node);
        recursionStack.add(node);

        const neighbors = graph[node] || [];

        for (const nextNode of neighbors) {
            if (dfs(nextNode)) {
                return true;
            }
        }

        recursionStack.delete(node);

        return false;
    };

    // Check every node in the graph
    for (const node of Object.keys(graph)) {
        if (dfs(Number(node))) {
            return true;
        }
    }

    return false;
};


// ======================================================
// CREATE DEPENDENCY
// ======================================================

const createDependency = async (req, res) => {
    let connection;

    try {
        const {
            projectId,
            predecessorId,
            successorId
        } = req.body;

        // -------------------------------
        // Basic validation
        // -------------------------------

        if (
            projectId === undefined ||
            predecessorId === undefined ||
            successorId === undefined
        ) {
            return res.status(400).json({
                message:
                    "projectId, predecessorId and successorId are required"
            });
        }

        // -------------------------------
        // Prevent self dependency
        // -------------------------------

        if (
            Number(predecessorId) ===
            Number(successorId)
        ) {
            return res.status(400).json({
                message:
                    "A task cannot depend on itself"
            });
        }

        // -------------------------------
        // Get connection
        // -------------------------------

        connection = await pool.getConnection();

        // -------------------------------
        // Check project
        // -------------------------------

        const [projects] =
            await connection.execute(
                `SELECT id
                 FROM projects
                 WHERE id = ?`,
                [projectId]
            );

        if (projects.length === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // -------------------------------
        // Check predecessor
        // -------------------------------

        const [predecessorTasks] =
            await connection.execute(
                `SELECT id, project_id
                 FROM tasks
                 WHERE id = ?`,
                [predecessorId]
            );

        if (predecessorTasks.length === 0) {
            return res.status(404).json({
                message:
                    "Predecessor task not found"
            });
        }

        // -------------------------------
        // Check successor
        // -------------------------------

        const [successorTasks] =
            await connection.execute(
                `SELECT id, project_id
                 FROM tasks
                 WHERE id = ?`,
                [successorId]
            );

        if (successorTasks.length === 0) {
            return res.status(404).json({
                message:
                    "Successor task not found"
            });
        }

        // -------------------------------
        // Same project validation
        // -------------------------------

        if (
            Number(predecessorTasks[0].project_id) !==
            Number(projectId)
        ) {
            return res.status(400).json({
                message:
                    "Predecessor task does not belong to this project"
            });
        }

        if (
            Number(successorTasks[0].project_id) !==
            Number(projectId)
        ) {
            return res.status(400).json({
                message:
                    "Successor task does not belong to this project"
            });
        }

        // -------------------------------
        // Check duplicate
        // -------------------------------

        const [existingDependencies] =
            await connection.execute(
                `SELECT id
                 FROM dependencies
                 WHERE predecessor_id = ?
                 AND successor_id = ?`,
                [
                    predecessorId,
                    successorId
                ]
            );

        if (existingDependencies.length > 0) {
            return res.status(409).json({
                message:
                    "Dependency already exists"
            });
        }

        // -------------------------------
        // Check cycle
        // -------------------------------

        const cycleDetected =
            await createsCycle(
                Number(predecessorId),
                Number(successorId),
                Number(projectId)
            );

        if (cycleDetected) {
            return res.status(400).json({
                message:
                    "Dependency would create a circular dependency"
            });
        }

        // -------------------------------
        // START TRANSACTION
        // -------------------------------

        await connection.beginTransaction();

        try {

            const [result] =
                await connection.execute(
                    `INSERT INTO dependencies
                    (
                        project_id,
                        predecessor_id,
                        successor_id
                    )
                    VALUES (?, ?, ?)`,
                    [
                        projectId,
                        predecessorId,
                        successorId
                    ]
                );

            /*
                If additional scheduling operations
                fail later, everything inside this
                transaction will be rolled back.
            */

            await connection.commit();

            // Get created dependency
            const [rows] =
                await connection.execute(
                    `SELECT *
                     FROM dependencies
                     WHERE id = ?`,
                    [result.insertId]
                );

            return res.status(201).json({
                message:
                    "Dependency created successfully",
                dependency: rows[0]
            });

        } catch (transactionError) {

            await connection.rollback();

            throw transactionError;
        }

    } catch (error) {

        console.error(
            "Create dependency error:",
            error
        );

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                message:
                    "Dependency already exists"
            });
        }

        return res.status(500).json({
            message:
                "Failed to create dependency"
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};


// ======================================================
// GET DEPENDENCIES FOR A TASK
// ======================================================

const getTaskDependencies = async (req, res) => {
    try {
        const { id: taskId } = req.params;

        // Check task
        const [tasks] = await pool.execute(
            `SELECT id, project_id, title
             FROM tasks
             WHERE id = ?`,
            [taskId]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // Dependencies where this task is predecessor
        const [outgoing] = await pool.execute(
            `SELECT
                d.id,
                d.project_id,
                d.predecessor_id,
                d.successor_id,
                t.title AS successor_title
             FROM dependencies d
             JOIN tasks t
                ON d.successor_id = t.id
             WHERE d.predecessor_id = ?
             ORDER BY d.created_at ASC`,
            [taskId]
        );

        // Dependencies where this task is successor
        const [incoming] = await pool.execute(
            `SELECT
                d.id,
                d.project_id,
                d.predecessor_id,
                d.successor_id,
                t.title AS predecessor_title
             FROM dependencies d
             JOIN tasks t
                ON d.predecessor_id = t.id
             WHERE d.successor_id = ?
             ORDER BY d.created_at ASC`,
            [taskId]
        );

        return res.status(200).json({
            task: tasks[0],
            incoming,
            outgoing
        });

    } catch (error) {
        console.error(
            "Get dependencies error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch dependencies"
        });
    }
};


// ======================================================
// DELETE DEPENDENCY
// ======================================================

const deleteDependency = async (req, res) => {
    try {
        const { id } = req.params;

        // Check dependency
        const [dependencies] = await pool.execute(
            `SELECT *
             FROM dependencies
             WHERE id = ?`,
            [id]
        );

        if (dependencies.length === 0) {
            return res.status(404).json({
                message: "Dependency not found"
            });
        }

        await pool.execute(
            `DELETE FROM dependencies
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            message: "Dependency deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete dependency error:",
            error
        );

        return res.status(500).json({
            message: "Failed to delete dependency"
        });
    }
};


module.exports = {
    createDependency,
    getTaskDependencies,
    deleteDependency,
    createsCycle
};