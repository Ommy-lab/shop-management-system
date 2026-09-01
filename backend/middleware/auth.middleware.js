// middleware/auth.middleware.js

import jwt from "jsonwebtoken";
import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| AUTHENTICATION MIDDLEWARE
|--------------------------------------------------------------------------
| This middleware:
|
| 1. Reads the Bearer token
| 2. Verifies the JWT
| 3. Checks that the user still exists
| 4. Checks that the user is still ACTIVE
| 5. Refreshes req.user from current database values
|--------------------------------------------------------------------------
*/
export const authenticateUser = async (req, res, next) => {
    try {
        /*
        |--------------------------------------------------------------------------
        | READ AUTHORIZATION HEADER
        |--------------------------------------------------------------------------
        |
        | Expected:
        | Authorization: Bearer <token>
        |--------------------------------------------------------------------------
        */
        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message:
                    "Authorization token is required",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATE HEADER FORMAT
        |--------------------------------------------------------------------------
        */
        const parts =
            authHeader.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authorization format",
            });
        }

        const token =
            parts[1];

        /*
        |--------------------------------------------------------------------------
        | VERIFY JWT
        |--------------------------------------------------------------------------
        */
        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        /*
        |--------------------------------------------------------------------------
        | CHECK CURRENT USER IN DATABASE
        |--------------------------------------------------------------------------
        |
        | We do NOT fully trust the old token payload anymore.
        |
        | Example:
        | A user may have logged in earlier, then SUPER_ADMIN later
        | deactivated the account.
        |--------------------------------------------------------------------------
        */
        const userResult =
            await pool.query(
                `
                SELECT
                    id,
                    role,
                    truck_id,
                    status

                FROM users

                WHERE id = $1
                `,
                [decoded.userId]
            );

        /*
        |--------------------------------------------------------------------------
        | USER NO LONGER EXISTS
        |--------------------------------------------------------------------------
        */
        if (
            userResult.rows.length === 0
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "User account no longer exists",
            });
        }

        const user =
            userResult.rows[0];

        /*
        |--------------------------------------------------------------------------
        | BLOCK INACTIVE USER
        |--------------------------------------------------------------------------
        */
        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message:
                    "Your account is inactive",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | ATTACH CURRENT USER INFORMATION
        |--------------------------------------------------------------------------
        |
        | Using current database values is important because:
        |
        | - role may have changed
        | - truck assignment may have changed
        | - account status may have changed
        |--------------------------------------------------------------------------
        */
        req.user = {
            userId: user.id,
            role: user.role,
            truckId: user.truck_id,
        };

        /*
        |--------------------------------------------------------------------------
        | CONTINUE TO CONTROLLER
        |--------------------------------------------------------------------------
        */
        next();

    } catch (error) {
        console.error(
            "Authentication error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired token",
        });
    }
};