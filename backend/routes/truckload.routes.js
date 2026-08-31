// routes/truckLoad.routes.js

import express from "express";

import {
    loadTruck,
    getTruckInventory,
    getTruckLoads,
    getTruckLoadById,
} from "../controllers/truckload.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| TRUCK LOAD ROUTES
|--------------------------------------------------------------------------
*/

// View all truck loading records.
router.get(
    "/",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "STOREKEEPER"
    ),
    getTruckLoads
);


// View one loading record.
router.get(
    "/:id",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "STOREKEEPER"
    ),
    getTruckLoadById
);


// Load products from store into a truck.
router.post(
    "/",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "STOREKEEPER"
    ),
    loadTruck
);


// View inventory of one truck.
router.get(
    "/truck/:truckId/inventory",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "STOREKEEPER",
        "SALESPERSON"
    ),
    getTruckInventory
);

export default router;