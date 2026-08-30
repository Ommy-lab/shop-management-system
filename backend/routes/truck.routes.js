// routes/truck.routes.js

import express from "express";

import {
    createTruck,
    getTrucks,
    getTruckById,
    updateTruck,
    deleteTruck,
} from "../controllers/truck.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| TRUCK ROUTES
|--------------------------------------------------------------------------
*/

// Super Admin, Admin and Storekeeper can view trucks.
router.get(
    "/",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER"),
    getTrucks
);

router.get(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER"),
    getTruckById
);

// Only management can create/change trucks.
router.post(
    "/",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    createTruck
);

router.put(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    updateTruck
);

router.delete(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    deleteTruck
);

export default router;