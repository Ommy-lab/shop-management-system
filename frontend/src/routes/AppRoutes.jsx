import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import PlaceholderPage from '../pages/PlaceholderPage';
import { ROLES } from '../utils/roles';

const allRoles = Object.values(ROLES);

const moduleRoutes = [
    { path: 'users', roles: [ROLES.SUPER_ADMIN] },
    { path: 'products', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STOREKEEPER] },
    { path: 'suppliers', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STOREKEEPER] },
    { path: 'trucks', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STOREKEEPER] },
    { path: 'purchases', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STOREKEEPER] },
    { path: 'inventory', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STOREKEEPER] },
    { path: 'truck-loads', roles: allRoles },
    { path: 'sales', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALESPERSON] },
    { path: 'customers', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALESPERSON] },
    { path: 'payments', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALESPERSON] },
    { path: 'debts', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALESPERSON] },
    { path: 'expenses', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALESPERSON] },
    { path: 'reconciliation', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALESPERSON] },
    { path: 'reports', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
    { path: 'profit-loss', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
];

export default function AppRoutes() {
    const { isAuthenticated, isInitializing } = useAuth();

    if (isInitializing) {
        return (
        <div className="auth-loading" role="status">
            <div className="spinner" />
            <p>Loading Shop Management System...</p>
        </div>
        );
    }

    return (
        <Routes>
        <Route
            path="/login"
            element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            }
        />

        {/* The first guard protects the entire authenticated application shell. */}
        <Route element={<ProtectedRoute allowedRoles={allRoles} />}>
            <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Each module gets its own role-aware guard before its page is rendered. */}
            {moduleRoutes.map((route) => (
                <Route key={route.path} element={<ProtectedRoute allowedRoles={route.roles} />}>
                <Route path={route.path} element={<PlaceholderPage />} />
                </Route>
            ))}
            </Route>
        </Route>

        <Route
            path="/"
            element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}
