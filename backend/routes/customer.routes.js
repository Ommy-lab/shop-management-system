// routes/customer.routes.js

import express from "express";

import {
    createCustomer,
    getMyCustomers,
} from "../controllers/customer.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
    "/",
    authenticateUser,
    allowRoles("SALESPERSON"),
    createCustomer
);

router.get(
    "/my-customers",
    authenticateUser,
    allowRoles("SALESPERSON"),
    getMyCustomers
);


export default router;