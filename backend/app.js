// Import Express and middleware packages
import express from "express";
import cors from "cors";

// Import routes
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

// Import global error handlers
import {
    notFoundHandler,
    globalErrorHandler,
} from "./middleware/error.middleware.js";

const app = express();

/*
|--------------------------------------------------------------------------
| GLOBAL MIDDLEWARE
|--------------------------------------------------------------------------
*/

// Allowed frontend origin.
// During development, Vite usually runs on http://localhost:5173
const allowedOrigin =
    process.env.FRONTEND_URL || "http://localhost:5173";

// Configure CORS so only the frontend can call the API.
app.use(
    cors({
        origin: allowedOrigin,

        // Allow cookies/authorization headers if needed later.
        credentials: true,

        // Common HTTP methods used by our REST API.
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        // Headers commonly sent by React/API clients.
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

// Allow API to receive JSON bodies
app.use(express.json());

/*
|--------------------------------------------------------------------------
| TEST ROUTE
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Shop Management System API is running",
    });
});

/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

// Authentication routes
app.use("/api/auth", authRoutes);

// User management
app.use("/api/users", userRoutes);

// Products
app.use("/api/products", productRoutes);

// Suppliers
app.use("/api/suppliers", supplierRoutes);

// Trucks
app.use("/api/trucks", truckRoutes);

// Purchases
app.use("/api/purchases", purchaseRoutes);

// Store inventory
app.use("/api/inventory", inventoryRoutes);

// Truck loading
app.use("/api/truck-loads", truckLoadRoutes);

// Customers
app.use("/api/customers", customerRoutes);

// Sales
app.use("/api/sales", saleRoutes);

// Payments
app.use("/api/payments", paymentRoutes);

// Debts
app.use("/api/debts", debtRoutes);

// Truck stock events
app.use("/api/truck-stock-events", truckStockEventRoutes);

// Expenses
app.use("/api/expenses", expenseRoutes);

// Reconciliation
app.use("/api/reconciliations", reconciliationRoutes);

// Dashboards
app.use("/api/dashboard", dashboardRoutes);

// Reports
app.use("/api/reports", reportRoutes);

/*
|--------------------------------------------------------------------------
| 404 HANDLER
|--------------------------------------------------------------------------
| Must be AFTER every valid route.
|--------------------------------------------------------------------------
*/
app.use(notFoundHandler);

/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
| Must always be the LAST middleware.
|--------------------------------------------------------------------------
*/
app.use(globalErrorHandler);

export default app;