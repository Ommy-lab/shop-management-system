// routes/debt.routes.js

import express from "express";

import {
    getOutstandingSales,
    getCustomerDebts,
    getCustomerDebtDetails,
    getTruckDebtSummary,
} from "../controllers/debt.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| SALESPERSON CREDIT / DEBT ROUTES
|--------------------------------------------------------------------------
*/

// Overall debt summary for salesperson's truck.
router.get(
    "/summary",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getTruckDebtSummary
);

// All outstanding sales.
router.get(
    "/outstanding-sales",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getOutstandingSales
);

// Customers who currently owe money.
router.get(
    "/customers",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getCustomerDebts
);

// Full debt history for one customer.
router.get(
    "/customers/:customerId",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getCustomerDebtDetails
);

export default router;