// Import Express and middleware packages
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import truckRoutes from "./routes/truck.routes.js";

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

// Authentication routes
app.use("/api/auth", authRoutes);

//Protected user management routes.
app.use("/api/users", userRoutes);

// Products API route
app.use("/api/products", productRoutes);

// Supplier API routes
app.use("/api/suppliers", supplierRoutes);

// Trucks API routes
app.use("/api/trucks", truckRoutes);


export default app;