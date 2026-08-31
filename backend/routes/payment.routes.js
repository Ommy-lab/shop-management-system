// routes/payment.routes.js

import express from "express";

import {
    recordSalePayment,
    getSalePayments,
} from "../controllers/payment.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

// Record payment for a sale.
router.post(
    "/sales/:sale_id",
    authenticateUser,
    allowRoles("SALESPERSON"),
    recordSalePayment
);

// View payment history for a sale.
    router.get(
    "/sales/:sale_id",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getSalePayments
);

export default router;