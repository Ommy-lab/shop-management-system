// routes/user.routes.js

import express from "express";

import {
    createUser,
    getAllUsers,
    updateUser,
    resetUserPassword,
    assignSalespersonToTruck
} from "../controllers/user.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| USER MANAGEMENT ROUTES
|--------------------------------------------------------------------------
| Every route here first checks:
|
| 1. Is the user logged in?
| 2. Is the logged-in user a SUPER_ADMIN?
|--------------------------------------------------------------------------
*/

// Only SUPER_ADMIN can view all system users.
router.get(
    "/",
    authenticateUser,
    allowRoles("SUPER_ADMIN"),
    getAllUsers
);

// Only SUPER_ADMIN can create system users.
router.post(
    "/",
    authenticateUser,
    allowRoles("SUPER_ADMIN"),
    createUser,
);

// Reset another user's password.
router.put(
    "/:id/reset-password",
    authenticateUser,
    allowRoles("SUPER_ADMIN"),
    resetUserPassword
);

// Assign salesperson to truck
router.put(
    "/:id/assign-truck",
    authenticateUser,
    allowRoles("SUPER_ADMIN"),
    assignSalespersonToTruck
);

// Edit user.
router.put(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN"),
    updateUser
);

export default router;