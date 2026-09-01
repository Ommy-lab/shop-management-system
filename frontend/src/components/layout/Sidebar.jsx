import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navigation = [
    { label: 'Dashboard', path: '/dashboard', icon: '▦', roles: ['SUPER_ADMIN', 'ADMIN', 'STOREKEEPER', 'SALESPERSON'] },
    { label: 'Users', path: '/users', icon: '♙', roles: ['SUPER_ADMIN'] },
    { label: 'Products', path: '/products', icon: '□', roles: ['SUPER_ADMIN', 'ADMIN', 'STOREKEEPER'] },
    { label: 'Suppliers', path: '/suppliers', icon: '⌂', roles: ['SUPER_ADMIN', 'ADMIN', 'STOREKEEPER'] },
    { label: 'Trucks', path: '/trucks', icon: '▰', roles: ['SUPER_ADMIN', 'ADMIN', 'STOREKEEPER'] },
    { label: 'Purchases', path: '/purchases', icon: '↓', roles: ['SUPER_ADMIN', 'ADMIN', 'STOREKEEPER'] },
    { label: 'Inventory', path: '/inventory', icon: '▤', roles: ['SUPER_ADMIN', 'ADMIN', 'STOREKEEPER'] },
    { label: 'Truck Loads', path: '/truck-loads', icon: '▰', roles: ['SUPER_ADMIN', 'ADMIN', 'STOREKEEPER', 'SALESPERSON'] },
    { label: 'Sales', path: '/sales', icon: '↗', roles: ['SUPER_ADMIN', 'ADMIN', 'SALESPERSON'] },
    { label: 'Customers', path: '/customers', icon: '♙', roles: ['SUPER_ADMIN', 'ADMIN', 'SALESPERSON'] },
    { label: 'Payments', path: '/payments', icon: '$', roles: ['SUPER_ADMIN', 'ADMIN', 'SALESPERSON'] },
    { label: 'Debts', path: '/debts', icon: '◷', roles: ['SUPER_ADMIN', 'ADMIN', 'SALESPERSON'] },
    { label: 'Expenses', path: '/expenses', icon: '−', roles: ['SUPER_ADMIN', 'ADMIN', 'SALESPERSON'] },
    { label: 'Reconciliation', path: '/reconciliation', icon: '✓', roles: ['SUPER_ADMIN', 'ADMIN', 'SALESPERSON'] },
    { label: 'Reports', path: '/reports', icon: '▥', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { label: 'Profit / Loss', path: '/profit-loss', icon: '≈', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user } = useAuth();

    const visibleItems = navigation.filter((item) => item.roles.includes(user?.role));

    return (
        <>
        {isOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}

        <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
            <div className="sidebar__brand">
            <div className="brand-mark">S</div>
            <div>
                <strong>Shop Management</strong>
                <span>Business Console</span>
            </div>
            </div>

            <nav className="sidebar__nav" aria-label="Main navigation">
            <p className="nav-section-title">WORKSPACE</p>

            {visibleItems.map((item) => (
                <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
                >
                <span className="nav-item__icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                </NavLink>
            ))}
            </nav>

            <div className="sidebar__footer-note">
            <span>Role</span>
            <strong>{user?.role?.replace('_', ' ') || 'User'}</strong>
            </div>
        </aside>
        </>
    );
}
