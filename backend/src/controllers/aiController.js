const pool = require("../config/database");

const {
    generateDependencySuggestion
} = require("../services/aiService");

const {
    createsCycle
} = require("./dependencyController");


// ============================================
// GENERATE AI SUGGESTION
// ============================================

const createAISuggestion = async (
    req,
    res
) => {

    try {

        const {
            taskId
        } = req.body;

        if (!taskId) {
            return res.status(400).json({
                message:
                    "taskId is required"
            });
        }

        // -------------------------------
        // Get target task
        // -------------------------------

        const [tasks] =
            await pool.execute(
                `SELECT *
                 FROM tasks
                 WHERE id = ?`,
                [taskId]
            );

        if (tasks.length === 0) {
            return res.status(404).json({
                message:
                    "Task not found"
            });
        }

        const task = tasks[0];

        // -------------------------------
        // Get candidate tasks
        // -------------------------------

        const [candidateTasks] =
            await pool.execute(
                `SELECT *
                 FROM tasks
                 WHERE project_id = ?
                 AND id != ?
                 ORDER BY id ASC`,
                [
                    task.project_id,
                    taskId
                ]
            );

        if (candidateTasks.length === 0) {
            return res.status(400).json({
                message:
                    "No candidate tasks available"
            });
        }

        // -------------------------------
        // Ask Gemini
        // -------------------------------

        const suggestion =
            await generateDependencySuggestion({
                task,
                candidateTasks
            });

        // -------------------------------
        // No suggestion
        // -------------------------------

        if (
            suggestion.suggestedTaskId === null
        ) {
            return res.status(200).json({
                message:
                    "AI found no meaningful dependency",
                suggestion
            });
        }

        // -------------------------------
        // Validate suggested task
        // -------------------------------

        const suggestedTask =
            candidateTasks.find(
                candidate =>
                    Number(candidate.id) ===
                    Number(
                        suggestion.suggestedTaskId
                    )
            );

        if (!suggestedTask) {
            return res.status(400).json({
                message:
                    "AI returned an invalid task ID"
            });
        }

        // -------------------------------
        // Save suggestion
        // -------------------------------

        const [result] =
            await pool.execute(
                `INSERT INTO ai_suggestions
                (
                    task_id,
                    suggested_task_id,
                    confidence,
                    reason,
                    status
                )
                VALUES (?, ?, ?, ?, 'PENDING')`,
                [
                    taskId,
                    suggestion.suggestedTaskId,
                    suggestion.confidence,
                    suggestion.reason
                ]
            );

        // -------------------------------
        // Return suggestion
        // -------------------------------

        const [rows] =
            await pool.execute(
                `SELECT *
                 FROM ai_suggestions
                 WHERE id = ?`,
                [result.insertId]
            );

        return res.status(201).json({
            message:
                "AI dependency suggestion created",
            suggestion: rows[0]
        });

    } catch (error) {

        console.error(
            "AI suggestion error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to generate AI suggestion",
            error: error.message
        });
    }
};


// ============================================
// GET AI SUGGESTIONS
// ============================================

const getAISuggestions = async (
    req,
    res
) => {

    try {

        const [rows] =
            await pool.execute(
                `SELECT
                    ai.*,
                    t1.title AS task_title,
                    t2.title AS suggested_task_title
                 FROM ai_suggestions ai
                 JOIN tasks t1
                    ON ai.task_id = t1.id
                 JOIN tasks t2
                    ON ai.suggested_task_id = t2.id
                 ORDER BY ai.created_at DESC`
            );

        return res.status(200).json({
            count: rows.length,
            suggestions: rows
        });

    } catch (error) {

        console.error(
            "Get AI suggestions error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch AI suggestions"
        });
    }
};

// ============================================
// ACCEPT AI SUGGESTION
// ============================================

const acceptAISuggestion = async (req, res) => {
    let connection;

    try {
        const { id } = req.params;

const getProjectIdForTasks = async (
    predecessorId,
    successorId
) => {

    const [rows] = await pool.execute(
        `SELECT
            t1.project_id AS predecessor_project_id,
            t2.project_id AS successor_project_id
         FROM tasks t1
         JOIN tasks t2
         WHERE t1.id = ?
         AND t2.id = ?`,
        [
            predecessorId,
            successorId
        ]
    );

    if (rows.length === 0) {
        return null;
    }

    const predecessorProject =
        rows[0].predecessor_project_id;

    const successorProject =
        rows[0].successor_project_id;

    if (
        Number(predecessorProject) !==
        Number(successorProject)
    ) {
        return null;
    }

    return predecessorProject;
};

        // --------------------------------
        // Get AI suggestion
        // --------------------------------

        const [suggestions] = await pool.execute(
            `SELECT *
             FROM ai_suggestions
             WHERE id = ?`,
            [id]
        );

        if (suggestions.length === 0) {
            return res.status(404).json({
                message: "AI suggestion not found"
            });
        }

        const suggestion = suggestions[0];

        // --------------------------------
        // Only PENDING suggestions
        // --------------------------------

        if (suggestion.status !== "PENDING") {
            return res.status(400).json({
                message:
                    `Suggestion is already ${suggestion.status}`
            });
        }

        /*
            Example:

            task_id = 3
            suggested_task_id = 1

            Means:

            1 → 3
        */

        const predecessorId =
            suggestion.suggested_task_id;

        const successorId =
            suggestion.task_id;

        const projectId =
            await getProjectIdForTasks(
                predecessorId,
                successorId
            );

        if (!projectId) {
            return res.status(400).json({
                message:
                    "Tasks do not belong to the same project"
            });
        }

        // --------------------------------
        // Prevent circular dependency
        // --------------------------------

        const cycleDetected =
            await createsCycle(
                Number(predecessorId),
                Number(successorId),
                Number(projectId)
            );

        if (cycleDetected) {
            return res.status(400).json({
                message:
                    "Accepting this suggestion would create a circular dependency"
            });
        }

        // --------------------------------
        // Start transaction
        // --------------------------------

        connection =
            await pool.getConnection();

        await connection.beginTransaction();

        try {

            // --------------------------------
            // Check duplicate dependency
            // --------------------------------

            const [existing] =
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

            if (existing.length > 0) {

                await connection.execute(
                    `UPDATE ai_suggestions
                     SET status = 'ACCEPTED'
                     WHERE id = ?`,
                    [id]
                );

                await connection.commit();

                return res.status(200).json({
                    message:
                        "AI suggestion accepted. Dependency already existed.",
                    suggestionId: Number(id),
                    dependencyId:
                        existing[0].id
                });
            }

            // --------------------------------
            // Create dependency
            // --------------------------------

            const [dependencyResult] =
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

            // --------------------------------
            // Mark suggestion ACCEPTED
            // --------------------------------

            await connection.execute(
                `UPDATE ai_suggestions
                 SET status = 'ACCEPTED'
                 WHERE id = ?`,
                [id]
            );

            // --------------------------------
            // Commit
            // --------------------------------

            await connection.commit();

            return res.status(200).json({
                message:
                    "AI suggestion accepted successfully",

                suggestionId:
                    Number(id),

                dependency: {
                    id:
                        dependencyResult.insertId,

                    projectId:
                        Number(projectId),

                    predecessorId:
                        Number(predecessorId),

                    successorId:
                        Number(successorId)
                },

                status: "ACCEPTED"
            });

        } catch (transactionError) {

            await connection.rollback();

            throw transactionError;
        }

    } catch (error) {

        console.error(
            "Accept AI suggestion error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to accept AI suggestion",
            error: error.message
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};

// ============================================
// REJECT AI SUGGESTION
// ============================================

const rejectAISuggestion = async (req, res) => {

    try {

        const { id } = req.params;

        // --------------------------------
        // Find suggestion
        // --------------------------------

        const [suggestions] =
            await pool.execute(
                `SELECT *
                 FROM ai_suggestions
                 WHERE id = ?`,
                [id]
            );

        if (suggestions.length === 0) {
            return res.status(404).json({
                message:
                    "AI suggestion not found"
            });
        }

        const suggestion =
            suggestions[0];

        // --------------------------------
        // Only PENDING can be rejected
        // --------------------------------

        if (
            suggestion.status !==
            "PENDING"
        ) {
            return res.status(400).json({
                message:
                    `Suggestion is already ${suggestion.status}`
            });
        }

        // --------------------------------
        // Update status
        // --------------------------------

        await pool.execute(
            `UPDATE ai_suggestions
             SET status = 'REJECTED'
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            message:
                "AI suggestion rejected successfully",

            suggestionId:
                Number(id),

            status: "REJECTED"
        });

    } catch (error) {

        console.error(
            "Reject AI suggestion error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to reject AI suggestion",
            error: error.message
        });
    }
};  


module.exports = {
    createAISuggestion,
    getAISuggestions,
    acceptAISuggestion,
    rejectAISuggestion
};