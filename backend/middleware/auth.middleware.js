// middleware/auth.middleware.js

import jwt from "jsonwebtoken";

/*
|--------------------------------------------------------------------------
| AUTHENTICATION MIDDLEWARE
|--------------------------------------------------------------------------
| This middleware checks whether the request contains a valid JWT token.
| If valid, the decoded user information is attached to req.user.
|--------------------------------------------------------------------------
*/
export const authenticateUser = (req, res, next) => {
    try {
    // Read the Authorization header.
    // Expected format:
    // Authorization: Bearer <token>
        const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Authorization token is required",
        });
    }

    // Split "Bearer token_here"
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
            success: false,
            message: "Invalid authorization format",
        });
    }

    const token = parts[1];

    // Verify the token using the same secret used during login.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach logged-in user details to the request.
    req.user = decoded;

    next();
    } catch (error) {
        console.error("Authentication error:", error.message);

    return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        });
    }
};