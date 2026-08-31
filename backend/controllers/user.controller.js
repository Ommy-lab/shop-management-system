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


/*
|--------------------------------------------------------------------------
| GET ALL SYSTEM USERS
|--------------------------------------------------------------------------
| Only SUPER_ADMIN can access this controller.
|
| This returns all users without exposing password_hash.
|--------------------------------------------------------------------------
*/
export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.status,
            u.truck_id,

            -- Truck details will be null for users without a truck.
            t.name AS truck_name,
            t.registration_number,

            u.created_at,
            u.updated_at

        FROM users u

        LEFT JOIN trucks t
            ON t.id = u.truck_id

        ORDER BY u.id ASC
        `);

    return res.status(200).json({
        success: true,
        count: result.rows.length,
        users: result.rows,
    });

    } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE SYSTEM USER
|--------------------------------------------------------------------------
| Only SUPER_ADMIN can reach this controller through the route.
|
| SUPER_ADMIN can update:
| - name
| - email
| - phone
| - role
| - status
| - truck_id
|
| Important protections:
| - SUPER_ADMIN cannot be demoted.
| - SUPER_ADMIN cannot be deactivated.
| - Only SALESPERSON can have a truck_id.
|--------------------------------------------------------------------------
*/
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const {
        name,
        email,
        phone,
        role,
        status,
        truck_id,
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | CHECK WHETHER USER EXISTS
        |--------------------------------------------------------------------------
        */
        const userResult = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            phone,
            role,
            status,
            truck_id
        FROM users
        WHERE id = $1
        `,
        [id]
        );

        if (userResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    const user = userResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | PROTECT SUPER ADMIN ACCOUNT
    |--------------------------------------------------------------------------
    | The Super Admin can update their name, email or phone,
    | but cannot remove their own SUPER_ADMIN role or deactivate
    | the SUPER_ADMIN account.
    |--------------------------------------------------------------------------
    */
    if (user.role === "SUPER_ADMIN") {

        if (
            role !== undefined &&
            role !== "SUPER_ADMIN"
        ) {
            return res.status(400).json({
            success: false,
            message:
                "SUPER_ADMIN role cannot be changed",
            });
        }

        if (
            status !== undefined &&
            status !== "ACTIVE"
        ) {
            return res.status(400).json({
            success: false,
            message:
                "SUPER_ADMIN cannot be deactivated",
            });
        }
        }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE ROLE
    |--------------------------------------------------------------------------
    */
    const allowedRoles = [
        "ADMIN",
        "STOREKEEPER",
        "SALESPERSON",
        ];

        if (
        role !== undefined &&
        user.role !== "SUPER_ADMIN" &&
        !allowedRoles.includes(role)
        ) {
        return res.status(400).json({
            success: false,
            message:
            "Role must be ADMIN, STOREKEEPER or SALESPERSON",
        });
        }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE STATUS
    |--------------------------------------------------------------------------
    */
    if (
        status !== undefined &&
        !["ACTIVE", "INACTIVE"].includes(status)
        ) {
        return res.status(400).json({
            success: false,
            message:
            "Status must be ACTIVE or INACTIVE",
        });
        }

    /*
    |--------------------------------------------------------------------------
    | CHECK FOR DUPLICATE EMAIL
    |--------------------------------------------------------------------------
    | Another user must not already be using the new email address.
    |--------------------------------------------------------------------------
    */
    if (email !== undefined) {
        const emailResult = await pool.query(
            `
            SELECT id
            FROM users
            WHERE email = $1
            AND id <> $2
            `,
            [
            email,
            id,
            ]
        );

        if (emailResult.rows.length > 0) {
            return res.status(409).json({
            success: false,
            message:
                "Another user already uses this email",
            });
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DETERMINE FINAL ROLE
    |--------------------------------------------------------------------------
    */
    const finalRole =
        user.role === "SUPER_ADMIN"
            ? "SUPER_ADMIN"
            : role || user.role;

    /*
    |--------------------------------------------------------------------------
    | HANDLE TRUCK ASSIGNMENT
    |--------------------------------------------------------------------------
    | Only SALESPERSON users can have truck_id.
    |
    | If someone changes from SALESPERSON to ADMIN/STOREKEEPER,
    | their truck_id is automatically removed.
    |--------------------------------------------------------------------------
    */
    let finalTruckId = null;

    if (finalRole === "SALESPERSON") {

      // Keep existing truck unless a new truck_id was provided.
        finalTruckId =
            truck_id !== undefined
            ? truck_id
            : user.truck_id;

        /*
        |--------------------------------------------------------------------------
        | VALIDATE TRUCK
        |--------------------------------------------------------------------------
        */
        if (finalTruckId !== null) {
            const truckResult = await pool.query(
            `
            SELECT
                id,
                name,
                status
            FROM trucks
            WHERE id = $1
                AND status = 'ACTIVE'
            `,
            [finalTruckId]
            );

            if (truckResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                "Active truck not found",
            });
            }
        }
        }

    /*
    |--------------------------------------------------------------------------
    | UPDATE USER
    |--------------------------------------------------------------------------
    */
    const result = await pool.query(
        `
        UPDATE users

        SET
            name = COALESCE($1, name),
            email = COALESCE($2, email),
            phone = COALESCE($3, phone),
            role = $4,
            status = COALESCE($5, status),
            truck_id = $6,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $7

        RETURNING
            id,
            name,
            email,
            phone,
            role,
            truck_id,
            status,
            created_at,
            updated_at
        `,
        [
            name ?? null,
            email ?? null,
            phone ?? null,
            finalRole,
            status ?? null,
            finalTruckId,
            id,
        ]
        );

        /*
        |--------------------------------------------------------------------------
        | SUCCESS RESPONSE
        |--------------------------------------------------------------------------
        */
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: result.rows[0],
        });

    } catch (error) {
        console.error(
        "Update user error:",
        error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
    };

/*
|--------------------------------------------------------------------------
| ASSIGN SALESPERSON TO TRUCK
|--------------------------------------------------------------------------
| Only SUPER_ADMIN can assign a salesperson to a truck.
|--------------------------------------------------------------------------
*/
export const assignSalespersonToTruck = async (req, res) => {
    try {
        const { id } = req.params;
        const { truck_id } = req.body;

        // Truck is required.
        if (!truck_id) {
        return res.status(400).json({
            success: false,
            message: "Truck ID is required",
        });
    }

    // Check whether the user exists and is a salesperson.
        const userResult = await pool.query(
        `
        SELECT id, name, role
        FROM users
        WHERE id = $1
        `,
        [id]
        );

        if (userResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    const user = userResult.rows[0];

        if (user.role !== "SALESPERSON") {
        return res.status(400).json({
            success: false,
            message: "Only SALESPERSON users can be assigned to trucks",
        });
    }

    // Make sure the truck exists and is active.
    const truckResult = await pool.query(
        `
        SELECT id, name
        FROM trucks
        WHERE id = $1
            AND status = 'ACTIVE'
        `,
        [truck_id]
        );

        if (truckResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Active truck not found",
        });
    }

    // Assign the truck to the salesperson.
    const result = await pool.query(
        `
        UPDATE users
        SET
            truck_id = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
            id,
            name,
            email,
            phone,
            role,
            truck_id,
            status
        `,
        [truck_id, id]
        );

        return res.status(200).json({
            success: true,
            message: "Salesperson assigned to truck successfully",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Assign salesperson error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/*
|--------------------------------------------------------------------------
| RESET USER PASSWORD
|--------------------------------------------------------------------------
| Only SUPER_ADMIN can reset another user's password.
|
| This is useful when an ADMIN, STOREKEEPER, or SALESPERSON
| forgets their password.
|--------------------------------------------------------------------------
*/
export const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

    // New password is required.
        if (!new_password) {
        return res.status(400).json({
            success: false,
            message: "New password is required",
        });
    }

    // Basic password length validation.
        if (new_password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "New password must contain at least 8 characters",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK WHETHER USER EXISTS
    |--------------------------------------------------------------------------
    */
    const userResult = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            role,
            status
        FROM users
        WHERE id = $1
        `,
        [id]
        );

    if (userResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    const user = userResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | PROTECT SUPER ADMIN ACCOUNT
    |--------------------------------------------------------------------------
    | This endpoint is intended for resetting other users' passwords.
    |--------------------------------------------------------------------------
    */
    if (user.role === "SUPER_ADMIN") {
        return res.status(403).json({
            success: false,
            message:
            "Use the Super Admin password-change endpoint for the SUPER_ADMIN account",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | HASH NEW PASSWORD
    |--------------------------------------------------------------------------
    */
    const passwordHash = await bcrypt.hash(
        new_password,
        10
    );

    /*
    |--------------------------------------------------------------------------
    | UPDATE PASSWORD
    |--------------------------------------------------------------------------
    */
    await pool.query(
        `
        UPDATE users
        SET
            password_hash = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
            passwordHash,
            id,
        ]
    );

    return res.status(200).json({
        success: true,
        message: `Password reset successfully for ${user.name}`,
    });

    } catch (error) {
        console.error(
            "Reset user password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

