// routes/inventory.routes.js

import express from "express";

import {
    getStoreInventory,
    getLowStockProducts,
    getStoreInventorySummary,
    getStockMovements,
    getProductStockMovements,
} from "../controllers/inventory.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| STORE INVENTORY ROUTES
|--------------------------------------------------------------------------
*/

// Current store inventory.
router.get(
    "/store",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER"),
    getStoreInventory
);

// Store inventory summary.
router.get(
    "/store/summary",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER"),
    getStoreInventorySummary
);

// Low-stock products.
router.get(
    "/store/low-stock",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER"),
    getLowStockProducts
);

// Full stock movement history.
router.get(
    "/movements",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER"),
    getStockMovements
);

// Movement history for one product.
router.get(
    "/movements/product/:productId",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER"),
    getProductStockMovements
);

export default router;