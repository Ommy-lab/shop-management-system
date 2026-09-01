import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/users': 'Users',
    '/products': 'Products',
    '/suppliers': 'Suppliers',
    '/trucks': 'Trucks',
    '/purchases': 'Purchases',
    '/inventory': 'Inventory',
    '/truck-loads': 'Truck Loads',
    '/sales': 'Sales',
    '/customers': 'Customers',
    '/payments': 'Payments',
    '/debts': 'Debts',
    '/expenses': 'Expenses',
    '/reconciliation': 'Reconciliation',
    '/reports': 'Reports',
    '/profit-loss': 'Profit / Loss',
};

export default function Header({ onMenuClick }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    const pageTitle = pageTitles[location.pathname] || 'Shop Management';

    const displayName =
        user?.name ||
        user?.fullName ||
        user?.username ||
        user?.email ||
        'User';

    return (
        <header className="app-header">
        <div className="header-left">
            <button
            type="button"
            className="menu-button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            >
            ☰
        </button>

            <div>
            <p className="header-eyebrow">SHOP MANAGEMENT SYSTEM</p>
            <h1>{pageTitle}</h1>
            </div>
        </div>

        <div className="header-actions">
            <ThemeToggle />

            <div className="user-menu">
            <div className="avatar" aria-hidden="true">
                {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="user-menu__details">
                <strong>{displayName}</strong>
                <span>{user?.role?.replace('_', ' ') || 'User'}</span>
            </div>

            <button type="button" className="logout-button" onClick={logout}>
                Logout
            </button>
            </div>
        </div>
        </header>
    );
    }
