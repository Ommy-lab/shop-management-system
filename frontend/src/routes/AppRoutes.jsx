import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";

// Products
import Products from "../pages/products/Products";
import ProductForm from "../pages/products/Form";
import ProductDetails from "../pages/products/Details";

// Suppliers
import Suppliers from "../pages/suppliers/Suppliers";
import SupplierForm from "../pages/suppliers/Form";
import SupplierDetails from "../pages/suppliers/Details";

// Trucks
import Trucks from "../pages/trucks/Trucks";
import TruckForm from "../pages/trucks/Form";
import TruckDetails from "../pages/trucks/Details";

// Purchases
import Purchases from "../pages/purchases/Purchases";
import PurchaseForm from "../pages/purchases/PurchaseForm";
import PurchaseDetails from "../pages/purchases/PurchaseDetails";

// Store inventory
import StoreInventory from "../pages/inventory/StoreInventory";
import LowStock from "../pages/inventory/LowStock";
import StockMovements from "../pages/inventory/StockMovements";

// Truck loads
import TruckLoads from "../pages/truckLoads/TruckLoads";
import TruckLoadForm from "../pages/truckLoads/TruckLoadForm";
import TruckLoadDetails from "../pages/truckLoads/TruckLoadDetails";
import TruckInventory from "../pages/truckLoads/TruckInventory";

// Customers
import Customers from "../pages/customers/Customers";
import CustomerForm from "../pages/customers/CustomerForm";
import CustomerDetails from "../pages/customers/CustomerDetails";

// Sales
import Sales from "../pages/sales/Sales";
import SaleForm from "../pages/sales/SaleForm";
import SaleDetails from "../pages/sales/SaleDetails";

// Payments
import PaymentForm from "../pages/payments/PaymentForm";
import SalePayments from "../pages/payments/SalePayments";
import Payments from "../pages/payments/Payments";

// Debts
import DebtDashboard from "../pages/debts/DebtDashboard";

// Expenses
import Expenses from "../pages/expenses/Expenses";
import ExpenseForm from "../pages/expenses/ExpenseForm";
import ExpenseDetails from "../pages/expenses/ExpenseDetails";

// Truck stock events
import StockEvents from "../pages/truckStockEvents/StockEvents";
import StockEventForm from "../pages/truckStockEvents/StockEventForm";
import StockEventDetails from "../pages/truckStockEvents/StockEventDetails";

// Reconciliation
import Reconciliation from "../pages/reconciliation/Reconciliation";
import ReconciliationHistory from "../pages/reconciliation/ReconciliationHistory";
import ReconciliationDetails from "../pages/reconciliation/ReconciliationDetails";
import AdminReconciliations from "../pages/reconciliation/AdminReconciliations";

// Reports
import Reports from "../pages/reports/Reports";
import ProfitLossReport from "../pages/reports/ProfitLossReport";

// Users
import Users from "../pages/users/Users";
import UserForm from "../pages/users/UserForm";
import UserDetails from "../pages/users/UserDetails";
import ResetPassword from "../pages/users/ResetPassword";
import AssignTruck from "../pages/users/AssignTruck";

import { ROLES } from "../utils/roles";

/*
 * Role groups
 *
 * Keeping these groups here makes the routing rules easier
 * to understand and maintain.
 */
const ALL_ROLES = Object.values(ROLES);

const SUPER_ADMIN_ROLES = [
    ROLES.SUPER_ADMIN,
];

const MANAGEMENT_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
];

const STORE_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.STOREKEEPER,
];

const SALES_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.SALESPERSON,
];

export default function AppRoutes() {
    const {
        isAuthenticated,
        isInitializing,
    } = useAuth();

    /*
     * Wait until AuthContext finishes checking the
     * current authentication state.
     */
    if (isInitializing) {
        return (
            <div className="auth-loading">
                <div className="spinner" />

                <p>
                    Loading Shop Management System...
                </p>
            </div>
        );
    }

    return (
        <Routes>

            {/* ================================
                PUBLIC ROUTES
            ================================= */}

            <Route
                path="/login"
                element={
                    isAuthenticated ? (
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    ) : (
                        <LoginPage />
                    )
                }
            />


            {/* ================================
                AUTHENTICATED APPLICATION
            ================================= */}

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={ALL_ROLES}
                    />
                }
            >
                <Route
                    element={<DashboardLayout />}
                >

                    {/* ================================
                        GENERAL DASHBOARD
                    ================================= */}

                    <Route
                        path="/dashboard"
                        element={<DashboardPage />}
                    />


                    {/* ================================
                        SUPER ADMIN - USERS
                    ================================= */}

                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={SUPER_ADMIN_ROLES}
                            />
                        }
                    >
                        <Route
                            path="/admin/users"
                            element={<Users />}
                        />

                        <Route
                            path="/admin/users/new"
                            element={<UserForm />}
                        />

                        <Route
                            path="/admin/users/:id"
                            element={<UserDetails />}
                        />

                        <Route
                            path="/admin/users/:id/edit"
                            element={<UserForm />}
                        />

                        <Route
                            path="/admin/users/:id/reset-password"
                            element={<ResetPassword />}
                        />

                        <Route
                            path="/admin/users/:id/assign-truck"
                            element={<AssignTruck />}
                        />
                    </Route>


                    {/* ================================
                        STORE / PRODUCT MANAGEMENT
                    ================================= */}

                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={STORE_ROLES}
                            />
                        }
                    >
                        {/* Products */}
                        <Route
                            path="/products"
                            element={<Products />}
                        />

                        <Route
                            path="/products/new"
                            element={<ProductForm />}
                        />

                        <Route
                            path="/products/:id"
                            element={<ProductDetails />}
                        />

                        <Route
                            path="/products/:id/edit"
                            element={<ProductForm />}
                        />

                        {/* Suppliers */}
                        <Route
                            path="/suppliers"
                            element={<Suppliers />}
                        />

                        <Route
                            path="/suppliers/new"
                            element={<SupplierForm />}
                        />

                        <Route
                            path="/suppliers/:id"
                            element={<SupplierDetails />}
                        />

                        <Route
                            path="/suppliers/:id/edit"
                            element={<SupplierForm />}
                        />

                        {/* Trucks */}
                        <Route
                            path="/trucks"
                            element={<Trucks />}
                        />

                        <Route
                            path="/trucks/new"
                            element={<TruckForm />}
                        />

                        <Route
                            path="/trucks/:id"
                            element={<TruckDetails />}
                        />

                        <Route
                            path="/trucks/:id/edit"
                            element={<TruckForm />}
                        />

                        {/* Purchases */}
                        <Route
                            path="/purchases"
                            element={<Purchases />}
                        />

                        <Route
                            path="/purchases/new"
                            element={<PurchaseForm />}
                        />

                        <Route
                            path="/purchases/:id"
                            element={<PurchaseDetails />}
                        />

                        {/* Store inventory */}
                        <Route
                            path="/inventory"
                            element={<StoreInventory />}
                        />

                        <Route
                            path="/inventory/low-stock"
                            element={<LowStock />}
                        />

                        <Route
                            path="/inventory/movements"
                            element={<StockMovements />}
                        />
                    </Route>


                    {/* ================================
                        TRUCK LOADS
                    ================================= */}

                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={ALL_ROLES}
                            />
                        }
                    >
                        <Route
                            path="/truck-loads"
                            element={<TruckLoads />}
                        />

                        <Route
                            path="/truck-loads/new"
                            element={<TruckLoadForm />}
                        />

                        <Route
                            path="/truck-loads/:id"
                            element={<TruckLoadDetails />}
                        />

                        <Route
                            path="/truck-loads/truck/:truckId/inventory"
                            element={<TruckInventory />}
                        />
                    </Route>


                    {/* ================================
                        SALESPERSON MODULES
                    ================================= */}

                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={SALES_ROLES}
                            />
                        }
                    >
                        {/* Customers */}
                        <Route
                            path="/customers"
                            element={<Customers />}
                        />

                        <Route
                            path="/customers/new"
                            element={<CustomerForm />}
                        />

                        <Route
                            path="/customers/:id"
                            element={<CustomerDetails />}
                        />

                        {/* Sales */}
                        <Route
                            path="/sales"
                            element={<Sales />}
                        />

                        <Route
                            path="/sales/new"
                            element={<SaleForm />}
                        />

                        <Route
                            path="/sales/:id"
                            element={<SaleDetails />}
                        />

                        <Route
                            path="/sales/:id/payments"
                            element={<SalePayments />}
                        />

                        <Route
                            path="/sales/:id/payment"
                            element={<PaymentForm />}
                        />

                        {/* Payments */}
                        <Route
                            path="/payments"
                            element={<Payments />}
                        />

                        {/* Debts */}
                        <Route
                            path="/debts"
                            element={<DebtDashboard />}
                        />

                        {/* Expenses */}
                        <Route
                            path="/expenses"
                            element={<Expenses />}
                        />

                        <Route
                            path="/expenses/new"
                            element={<ExpenseForm />}
                        />

                        <Route
                            path="/expenses/:id"
                            element={<ExpenseDetails />}
                        />

                        {/* Truck stock events */}
                        <Route
                            path="/truck-stock-events"
                            element={<StockEvents />}
                        />

                        <Route
                            path="/truck-stock-events/new"
                            element={<StockEventForm />}
                        />

                        <Route
                            path="/truck-stock-events/:id"
                            element={<StockEventDetails />}
                        />
                    </Route>


                    {/* ================================
                        SALESPERSON RECONCILIATION
                    ================================= */}

                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={SALES_ROLES}
                            />
                        }
                    >
                        <Route
                            path="/reconciliation"
                            element={<Reconciliation />}
                        />

                        <Route
                            path="/reconciliation/history"
                            element={<ReconciliationHistory />}
                        />

                        <Route
                            path="/reconciliation/:id"
                            element={<ReconciliationDetails />}
                        />
                    </Route>


                    {/* ================================
                        MANAGEMENT - RECONCILIATION & REPORTS
                    ================================= */}

                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={MANAGEMENT_ROLES}
                            />
                        }
                    >
                        <Route
                            path="/reconciliation/admin"
                            element={<AdminReconciliations />}
                        />

                        <Route
                            path="/reports"
                            element={<Reports />}
                        />

                        <Route
                            path="/profit-loss"
                            element={<ProfitLossReport />}
                        />
                    </Route>

                </Route>
            </Route>


            {/* ================================
                DEFAULT ROUTES
            ================================= */}

            <Route
                path="/"
                element={
                    <Navigate
                        to={
                            isAuthenticated
                                ? "/dashboard"
                                : "/login"
                        }
                        replace
                    />
                }
            />

            <Route
                path="*"
                element={
                    <Navigate
                        to={
                            isAuthenticated
                                ? "/dashboard"
                                : "/login"
                        }
                        replace
                    />
                }
            />

        </Routes>
    );
}