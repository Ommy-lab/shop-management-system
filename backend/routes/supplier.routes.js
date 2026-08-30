// routes/supplier.routes.js

import express from "express";

import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
} from "../controllers/supplier.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| SUPPLIER ROUTES
|--------------------------------------------------------------------------
*/

// Management users can view suppliers.
router.get(
    "/",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER"),
    getSuppliers
);

router.get(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER"),
    getSupplierById
);

// Only Super Admin and Admin can manage supplier records.
router.post(
    "/",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    createSupplier
);

router.put(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    updateSupplier
);

router.delete(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    deleteSupplier
);

export default router;