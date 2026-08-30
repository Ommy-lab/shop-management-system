// Load environment variables before importing the application
import "dotenv/config";

import app from "./app.js";
import pool from "./src/config/database.js";

const PORT = process.env.PORT || 4000;

// Test PostgreSQL before starting the server
const startServer = async () => {
    try {
     // Run a simple database query
    await pool.query("SELECT NOW()");

    console.log("Database connection verified");

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
    } catch (error) {
        console.error("Failed to start server:", error.message);
    process.exit(1);
    }
};

startServer();