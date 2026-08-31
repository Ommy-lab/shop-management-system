// routes/dashboard.routes.js

import express from "express";

import {
    getSuperAdminDashboard,
    getAdminDashboard,
    getStorekeeperDashboard,
    getSalespersonDashboard,
} from "../controllers/dashboard.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| SUPER ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/
router.get(
    "/super-admin",
    authenticateUser,
    allowRoles("SUPER_ADMIN"),
    getSuperAdminDashboard
);


/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/
router.get(
    "/admin",
    authenticateUser,
    allowRoles("ADMIN"),
    getAdminDashboard
);


/*
|--------------------------------------------------------------------------
| STOREKEEPER DASHBOARD
|--------------------------------------------------------------------------
*/
router.get(
    "/storekeeper",
    authenticateUser,
    allowRoles("STOREKEEPER"),
    getStorekeeperDashboard
);


/*
|--------------------------------------------------------------------------
| SALESPERSON DASHBOARD
|--------------------------------------------------------------------------
*/
router.get(
    "/salesperson",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getSalespersonDashboard
);

export default router;