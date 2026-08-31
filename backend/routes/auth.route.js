import express from "express";

import {
    login,
    getCurrentUser,
} from "../controllers/auth.controller.js";

import {
    authenticateUser,
} from "../middleware/auth.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

//Public Login route
// Anyone with a valid account can attempt login
router.post("/login", login);

// Protected route that returns the currently logged-in user.
router.get(
    "/me",
    authenticateUser,
    getCurrentUser
);


export default router;