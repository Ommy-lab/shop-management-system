// routes/purchase.routes.js

import express from "express";

import {
    createPurchase,
    getPurchases,
    getPurchaseById,
} from "../controllers/purchase.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PURCHASE ROUTES
|--------------------------------------------------------------------------
*/

// View purchases.
router.get(
    "/",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "STOREKEEPER"
    ),
    getPurchases
);


// View one purchase and its products.
router.get(
    "/:id",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "STOREKEEPER"
    ),
    getPurchaseById
);


// Create purchase.
//
// Admin management records the supplier purchase.
// Once created, stock automatically enters the store.
router.post(
    "/",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    createPurchase
);

export default router;