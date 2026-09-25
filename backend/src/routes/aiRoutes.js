const express = require("express");

const {
    createAISuggestion,
    getAISuggestions,
    acceptAISuggestion,
    rejectAISuggestion
} = require("../controllers/aiController");

const router = express.Router();


// ============================================
// GENERATE AI SUGGESTION
// ============================================

router.post(
    "/ai/suggestions",
    createAISuggestion
);


// ============================================
// GET ALL AI SUGGESTIONS
// ============================================

router.get(
    "/ai/suggestions",
    getAISuggestions
);


// ============================================
// ACCEPT AI SUGGESTION
// ============================================

router.patch(
    "/ai/suggestions/:id/accept",
    acceptAISuggestion
);


// ============================================
// REJECT AI SUGGESTION
// ============================================

router.patch(
    "/ai/suggestions/:id/reject",
    rejectAISuggestion
);


module.exports = router;