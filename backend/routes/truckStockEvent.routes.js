// routes/truckStockEvent.routes.js

import express from "express";

import {
    createTruckStockEvent,
    getMyTruckStockEvents,
    getTruckStockEventById,
} from "../controllers/truckStockEvent.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

// Record return, damage, loss or expiry.
router.post(
    "/",
    authenticateUser,
    allowRoles("SALESPERSON"),
    createTruckStockEvent
);

// Get salesperson's truck stock events.
router.get(
    "/my-events",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getMyTruckStockEvents
);

// Get one event.
router.get(
    "/:id",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getTruckStockEventById
);

export default router;