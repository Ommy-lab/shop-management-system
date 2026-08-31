// routes/report.routes.js

import express from "express";

import {
    getSalesSummaryReport,
    getSalesByTruckReport,
    getSalesByProductReport,
    getPurchaseReport,
    getExpenseReport,
    getDebtReport,
    getStockEventReport,
    getBestSellingProducts,
} from "../controllers/report.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| REPORT ACCESS
|--------------------------------------------------------------------------
| SUPER_ADMIN and ADMIN can access business reports.
|
| STOREKEEPER and SALESPERSON cannot access these business-wide reports.
|--------------------------------------------------------------------------
*/

router.get(
    "/sales/summary",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    getSalesSummaryReport
);

router.get(
    "/sales/by-truck",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    getSalesByTruckReport
);

router.get(
    "/sales/by-product",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    getSalesByProductReport
);

router.get(
    "/purchases",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    getPurchaseReport
);

router.get(
    "/expenses",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    getExpenseReport
);

router.get(
    "/debts",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    getDebtReport
);

router.get(
    "/stock-events",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    getStockEventReport
);

router.get(
    "/best-selling-products",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    getBestSellingProducts
);

export default router;