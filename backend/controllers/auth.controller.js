import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
| This endpoint will initially be useful for creating the first
| SUPER_ADMIN and later other users.
|--------------------------------------------------------------------------
*/
export const createUser = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
        return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
        });
    }

    // Check whether the supplied role is valid
    const allowedRoles = [
        "SUPER_ADMIN",
        "ADMIN",
        "STOREKEEPER",
        "SALESPERSON",
    ];

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({
        success: false,
        message: "Invalid user role",
        });
    }

    // Check whether the email already exists
    const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
    );

    if (existingUser.rows.length > 0) {
        return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
        });
    }

    // Hash the password before saving it.
    // Never save plain-text passwords.
    const passwordHash = await bcrypt.hash(password, 10);

    // Save the user
    const result = await pool.query(
        `
        INSERT INTO users (
        name,
        email,
        phone,
        password_hash,
        role
    )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, phone, role, status, created_at
        `,
        [name, email, phone || null, passwordHash, role]
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
| LOGIN
|--------------------------------------------------------------------------
| Checks email + password and returns a JWT token.
|--------------------------------------------------------------------------
*/
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

    // Validate login input
    if (!email || !password) {
        return res.status(400).json({
        success: false,
        message: "Email and password are required",
        });
    }

    // Find the user
    const result = await pool.query(
        `
        SELECT
        id,
        name,
        email,
        phone,
        password_hash,
        role,
        truck_id,
        status
        FROM users
        WHERE email = $1
        `,
        [email]
        );

    if (result.rows.length === 0) {
        return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        });
    }

    const user = result.rows[0];

    // Prevent inactive users from logging in
    if (user.status !== "ACTIVE") {
        return res.status(403).json({
        success: false,
        message: "This account is inactive",
        });
    }

    // Compare the submitted password with the stored hash
    const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatches) {
        return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        });
    }

    // Create an authentication token
    const token = jwt.sign(
        {
        userId: user.id,
        role: user.role,
        truckId: user.truck_id,
        },
        process.env.JWT_SECRET,
        {
        expiresIn: "1d",
        }
    );

    return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        truck_id: user.truck_id,
        },
});
    } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
    }
};