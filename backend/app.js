// Import Express and middleware packages
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import truckRoutes from "./routes/truck.routes.js";
import purchaseRoutes from "./routes/purchase.route.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import truckLoadRoutes from "./routes/truckload.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import saleRoutes from "./routes/sales.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import debtRoutes from "./routes/debt.routes.js";
import truckStockEventRoutes from "./routes/truckStockEvent.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import reconciliationRoutes from "./routes/reconciliation.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportRoutes from "./routes/report.routes.js";

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

// Purchase API routes
app.use("/api/purchases", purchaseRoutes);

// Inventory and stock movements API
app.use("/api/inventory", inventoryRoutes);

// Truckloads and products released API
app.use("/api/truck-loads", truckLoadRoutes)

// Customer API's only seen by salesperson
app.use("/api/customers", customerRoutes);

// Sales route
app.use("/api/sales", saleRoutes);

// Modes of payment API
app.use("/api/payments", paymentRoutes);

// Debts collections API
app.use("/api/debts", debtRoutes);

// Trucks returned to stocks API
app.use("/api/truck-stock-events", truckStockEventRoutes);

// Truck expenses routes API
app.use("/api/expenses", expenseRoutes);

// Truck reconciliation API
app.use("/api/reconciliations", reconciliationRoutes);

// Dasboards routes API
app.use("/api/dashboard", dashboardRoutes);

//Business reports routes
app.use("/api/reports", reportRoutes);


export default app;