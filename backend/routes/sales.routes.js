// routes/sale.routes.js

import express from "express";

import {
    createSale,
    getMySales,
    getSaleById,
} from "../controllers/sale.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

// Create a sale
router.post(
    "/",
    authenticateUser,
    allowRoles("SALESPERSON"),
    createSale
);

// Get salesperson's sales
router.get(
    "/my-sales",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getMySales
);

// Get one sale
router.get(
    "/:id",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getSaleById
);

export default router;