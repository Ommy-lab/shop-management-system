// controllers/user.controller.js

import bcrypt from "bcrypt";
import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE SYSTEM USER
|--------------------------------------------------------------------------
| Only the SUPER_ADMIN will be allowed to reach this controller.
|
| The SUPER_ADMIN can create:
| - ADMIN
| - STOREKEEPER
| - SALESPERSON
|
| We intentionally do not allow creation of another SUPER_ADMIN here.
|--------------------------------------------------------------------------
*/
export const createUser = async (req, res) => {
    try {
        const {
        name,
        email,
        phone,
        password,
        role,
        truck_id,
        } = req.body;

    // Validate required fields.
    if (!name || !email || !password || !role) {
        return res.status(400).json({
            success: false,
            message: "Name, email, password and role are required",
        });
    }

    // These are the roles that the Super Admin is allowed to create.
        const allowedRoles = [
        "ADMIN",
        "STOREKEEPER",
        "SALESPERSON",
        ];

        if (!allowedRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message:
            "You can only create ADMIN, STOREKEEPER or SALESPERSON users",
        });
        }

        // Check whether the email is already registered.
        const existingUser = await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
        `,
        [email]
        );

        if (existingUser.rows.length > 0) {
        return res.status(409).json({
            success: false,
            message: "A user with this email already exists",
        });
        }

    // Hash the password before storing it.
    const passwordHash = await bcrypt.hash(password, 10);

    // For now truck_id can remain null.
    // Later when we create the trucks table,
    // SALESPERSON users will be assigned to a truck.
        const result = await pool.query(
        `
        INSERT INTO users (
            name,
            email,
            phone,
            password_hash,
            role,
            truck_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            name,
            email,
            phone,
            role,
            truck_id,
            status,
            created_at
        `,
        [
            name,
            email,
            phone || null,
            passwordHash,
            role,
            truck_id || null,
        ]
        );

    return res.status(201).json({
        success: true,
        message: "User created successfully",
        user: result.rows[0],
        });
    } catch (error) {
        console.error("Create user error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};