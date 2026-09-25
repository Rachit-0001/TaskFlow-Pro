const pool = require("../config/database");

/*
    Get complete dependency graph for a project
*/
const getProjectDependencies = async (projectId) => {
    const [rows] = await pool.execute(
        `SELECT
            predecessor_id,
            successor_id
         FROM dependencies
         WHERE project_id = ?`,
        [projectId]
    );

    return rows;
};


/*
    Calculate whether a task is blocked.

    A task is blocked when at least one predecessor
    is not DONE.
*/
const calculateTaskReadiness = (
    taskId,
    dependencies,
    taskMap
) => {
    const predecessors = dependencies.filter(
        dependency =>
            Number(dependency.successor_id) === Number(taskId)
    );

    if (predecessors.length === 0) {
        return {
            ready: true,
            blocked: false,
            blockedBy: []
        };
    }

    const blockedBy = [];

    for (const dependency of predecessors) {
        const predecessor =
            taskMap[dependency.predecessor_id];

        if (
            predecessor &&
            predecessor.status !== "DONE"
        ) {
            blockedBy.push({
                taskId: predecessor.id,
                title: predecessor.title,
                status: predecessor.status
            });
        }
    }

    return {
        ready: blockedBy.length === 0,
        blocked: blockedBy.length > 0,
        blockedBy
    };
};


/*
    Calculate the earliest start date of a task.

    If a task has multiple predecessors,
    we use the LATEST predecessor end date.

    Example:

        A ──→ D
        B ──→ D

    If:

        A ends on Sept 10
        B ends on Sept 15

    D starts on Sept 16.

    This is important for the diamond dependency case.
*/
const calculateEarliestStart = (
    task,
    dependencies,
    taskMap
) => {
    const predecessors = dependencies.filter(
        dependency =>
            Number(dependency.successor_id) === Number(task.id)
    );

    if (
        predecessors.length === 0 ||
        !task.start_date
    ) {
        return task.start_date;
    }

    let latestEndDate = null;

    for (const dependency of predecessors) {
        const predecessor =
            taskMap[dependency.predecessor_id];

        if (
            predecessor &&
            predecessor.end_date
        ) {
            const predecessorEnd =
                new Date(predecessor.end_date);

            if (
                !latestEndDate ||
                predecessorEnd > latestEndDate
            ) {
                latestEndDate = predecessorEnd;
            }
        }
    }

    if (!latestEndDate) {
        return task.start_date;
    }

    const earliestStart = new Date(latestEndDate);

    earliestStart.setDate(
        earliestStart.getDate() + 1
    );

    return earliestStart
        .toISOString()
        .split("T")[0];
};


/*
    Calculate end date using duration.
*/
const calculateEndDate = (
    startDate,
    duration
) => {
    if (!startDate) {
        return null;
    }

    const start = new Date(startDate);

    const end = new Date(start);

    end.setDate(
        end.getDate() + Number(duration) - 1
    );

    return end
        .toISOString()
        .split("T")[0];
};


/*
    Propagate schedule changes through
    the complete dependency graph.
*/
const propagateSchedule = async (
    projectId
) => {
    const [tasks] = await pool.execute(
        `SELECT *
         FROM tasks
         WHERE project_id = ?
         ORDER BY id ASC`,
        [projectId]
    );

    const dependencies =
        await getProjectDependencies(projectId);

    const taskMap = {};

    for (const task of tasks) {
        taskMap[task.id] = task;
    }

    /*
        Repeatedly calculate tasks until
        no schedule changes remain.
    */

    let changed = true;
    let iterations = 0;

    while (changed && iterations < tasks.length + 1) {
        changed = false;
        iterations++;

        for (const task of tasks) {

            const earliestStart =
                calculateEarliestStart(
                    task,
                    dependencies,
                    taskMap
                );

            const currentStartDate = task.start_date
                ? new Date(task.start_date)
                    .toISOString()
                    .split("T")[0]
                : null;

            if (
                earliestStart &&
                currentStartDate &&
                earliestStart !== currentStartDate
            ) {
                const newEndDate =
                    calculateEndDate(
                        earliestStart,
                        task.duration
                    );

                await pool.execute(
                    `UPDATE tasks
                     SET
                        start_date = ?,
                        end_date = ?
                     WHERE id = ?`,
                    [
                        earliestStart,
                        newEndDate,
                        task.id
                    ]
                );

                task.start_date =
                    new Date(earliestStart);

                task.end_date =
                    new Date(newEndDate);

                changed = true;
            }
        }
    }

    return taskMap;
};



const getEnrichedTasks = async (
    projectId
) => {
    const [tasks] = await pool.execute(
        `SELECT *
         FROM tasks
         WHERE project_id = ?
         ORDER BY position ASC, created_at ASC`,
        [projectId]
    );

    const dependencies =
        await getProjectDependencies(projectId);

    const taskMap = {};

    for (const task of tasks) {
        taskMap[task.id] = task;
    }

    const enrichedTasks = tasks.map(task => {

        const readiness =
            calculateTaskReadiness(
                task.id,
                dependencies,
                taskMap
            );

        return {
            ...task,

            dependencyState:
                readiness.blocked
                    ? "BLOCKED"
                    : "READY",

            blockedBy:
                readiness.blockedBy,

            dependencyCount:
                dependencies.filter(
                    dependency =>
                        Number(
                            dependency.successor_id
                        ) === Number(task.id)
                ).length
        };
    });

    return enrichedTasks;
};


module.exports = {
    getProjectDependencies,
    calculateTaskReadiness,
    calculateEarliestStart,
    calculateEndDate,
    propagateSchedule,
    getEnrichedTasks
};