// Import Express and middleware packages
import express from "express";
import cors from "cors";

const app = express();

// Allow requests from the frontend
app.use(cors());

// Allow the API to receive JSON request bodies
app.use(express.json());

// Simple route for testing the backend
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Shop Management System API is running",
    });
});

export default app;