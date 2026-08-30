// routes/user.routes.js

import express from "express";

import {
    createUser,
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

// Only SUPER_ADMIN can create system users.
router.post(
    "/",
    authenticateUser,
    allowRoles("SUPER_ADMIN"),
    createUser
);

export default router;