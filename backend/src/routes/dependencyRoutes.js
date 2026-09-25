const express = require("express");

const {
    createDependency,
    getTaskDependencies,
    deleteDependency
} = require("../controllers/dependencyController");

const router = express.Router();


// Create dependency
router.post(
    "/dependencies",
    createDependency
);


// Get dependencies of a task
router.get(
    "/tasks/:id/dependencies",
    getTaskDependencies
);


// Delete dependency
router.delete(
    "/dependencies/:id",
    deleteDependency
);


module.exports = router;