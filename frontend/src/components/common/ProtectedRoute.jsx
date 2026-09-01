import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function LoadingState() {
    return (
        <div className="auth-loading" role="status" aria-live="polite">
        <div className="spinner" />
        <p>Restoring your session...</p>
        </div>
    );
    }

export default function ProtectedRoute({ allowedRoles }) {
    const { isAuthenticated, isInitializing, user } = useAuth();
    const location = useLocation();

    if (isInitializing) {
        return <LoadingState />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
    }
