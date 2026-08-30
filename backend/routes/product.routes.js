// routes/product.routes.js

import express from "express";

import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

import {
    allowRoles,
} from "../middleware/role.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PRODUCT ROUTES
|--------------------------------------------------------------------------
*/

// View products
router.get(
    "/",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER", "SALESPERSON"),
    getProducts
);

router.get(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN", "STOREKEEPER", "SALESPERSON"),
    getProductById
);

// Only management roles can create/change products
router.post(
    "/",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    createProduct
);

router.put(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    updateProduct
);

router.delete(
    "/:id",
    authenticateUser,
    allowRoles("SUPER_ADMIN", "ADMIN"),
    deleteProduct
);

export default router;