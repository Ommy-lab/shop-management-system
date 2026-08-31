// routes/reconciliation.routes.js

import express from "express";

import {
    closeTruckDay,
    getMyReconciliations,
    getTodayReconciliation,

    // Admin reconciliation functions
    getAllReconciliations,
    getReconciliationById,
    approveReconciliation,
    rejectReconciliation

} from "../controllers/reconciliation.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET TODAY'S CLOSING
|--------------------------------------------------------------------------
*/
router.get(
    "/today",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getTodayReconciliation
);

/*
|--------------------------------------------------------------------------
| GET RECONCILIATION HISTORY
|--------------------------------------------------------------------------
*/
router.get(
    "/my-history",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getMyReconciliations
);

/*
|--------------------------------------------------------------------------
| CLOSE THE DAY
|--------------------------------------------------------------------------
*/
router.post(
    "/close",
    authenticateUser,
    allowRoles("SALESPERSON"),
    closeTruckDay
);

/*
|--------------------------------------------------------------------------
| ADMIN / SUPER ADMIN ROUTES
|--------------------------------------------------------------------------
*/

// Get every reconciliation.
// Supports optional:
// ?status=SUBMITTED
// ?truck_id=2
// ?date=2026-08-31
router.get(
    "/admin",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    getAllReconciliations
);


// Get one reconciliation.
router.get(
    "/admin/:id",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    getReconciliationById
);


// Approve reconciliation.
router.put(
    "/admin/:id/approve",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    approveReconciliation
);


// Reject reconciliation.
router.put(
    "/admin/:id/reject",
    authenticateUser,
    allowRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    rejectReconciliation
);

export default router;