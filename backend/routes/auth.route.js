import express from "express";

import {
    login,
} from "../controllers/auth.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

//Public Login route
// Anyone with a valid account can attempt login
router.post("/login", login);

export default router;