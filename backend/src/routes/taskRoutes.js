const express = require("express");

const {
    createTask,
    getTasksByProject,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

const router = express.Router();


// Project tasks
router.post("/projects/:id/tasks", createTask);

router.get("/projects/:id/tasks", getTasksByProject);


// Individual task
router.patch("/tasks/:id", updateTask);

router.delete("/tasks/:id", deleteTask);


module.exports = router;