// routes/expense.routes.js

import express from "express";

import {
    createExpense,
    getMyExpenses,
    getTodayExpenseSummary,
} from "../controllers/expense.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

// Today's expense summary.
// Keep this before /:id-style routes if we add them later.
router.get(
    "/today/summary",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getTodayExpenseSummary
);

// Get expenses belonging to logged-in salesperson.
router.get(
    "/my-expenses",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getMyExpenses
);

// Create expense.
router.post(
    "/",
    authenticateUser,
    allowRoles("SALESPERSON"),
    createExpense
);

export default router;