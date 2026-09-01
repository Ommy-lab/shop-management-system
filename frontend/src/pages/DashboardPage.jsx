import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';

const roleDescriptions = {
    [ROLES.SUPER_ADMIN]: 'Monitor the entire business and manage system-wide operations.',
    [ROLES.ADMIN]: 'Manage day-to-day shop operations and business performance.',
    [ROLES.STOREKEEPER]: 'Keep products, inventory and stock movement organized.',
    [ROLES.SALESPERSON]: 'Focus on customers, sales, payments and assigned stock.',
};

const quickActions = [
    {
        title: 'Products',
        description: 'Product management workspace',
        path: '/products',
        tone: 'blue',
    },
    {
        title: 'Inventory',
        description: 'Stock management workspace',
        path: '/inventory',
        tone: 'green',
    },
    {
        title: 'Sales',
        description: 'Sales management workspace',
        path: '/sales',
        tone: 'purple',
    },
    {
        title: 'Reports',
        description: 'Business reporting workspace',
        path: '/reports',
        tone: 'orange',
    },
];

function StatCard({ label, value, detail, tone }) {
    return (
        <article className={`stat-card stat-card--${tone}`}>
        <div className="stat-card__top">
            <span>{label}</span>
            <span className="stat-card__indicator" aria-hidden="true" />
        </div>
        <strong>{value}</strong>
        <small>{detail}</small>
        </article>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();

    const displayName =
        user?.name ||
        user?.fullName ||
        user?.username ||
        user?.email?.split('@')[0] ||
        'User';

    const role = user?.role;

    const visibleActions = useMemo(
        () =>
        quickActions.filter((action) => {
            if (action.path === '/reports') {
            return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);
            }

            if (action.path === '/sales') {
            return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALESPERSON].includes(role);
        }

        return true;
        }),
    [role]
    );

    return (
        <div className="page-container">
        <section className="welcome-banner">
            <div>
            <p className="eyebrow">OVERVIEW</p>
            <h2>Welcome, {displayName}</h2>
            <p>{roleDescriptions[role] || 'Welcome to your business workspace.'}</p>
            </div>

            <div className="role-badge">
            {role?.replace('_', ' ') || 'USER'}
            </div>
        </section>

        <section className="section-heading">
            <div>
            <p className="eyebrow">BUSINESS SNAPSHOT</p>
            <h3>Quick statistics</h3>
            </div>
            <span className="muted-text">Ready for live API data</span>
        </section>

        <div className="stats-grid">
            <StatCard
            label="Sales"
            value="—"
            detail="Connect sales endpoint"
            tone="blue"
            />
            <StatCard
            label="Profit"
            value="—"
            detail="Connect profit endpoint"
            tone="green"
            />
            <StatCard
            label="Inventory"
            value="—"
            detail="Connect inventory endpoint"
            tone="purple"
            />
            <StatCard
            label="Outstanding"
            value="—"
            detail="Connect debt endpoint"
            tone="orange"
            />
        </div>

        <div className="dashboard-grid">
            <section className="dashboard-card">
            <div className="card-heading">
                <div>
                <p className="eyebrow">ACTIVITY</p>
                <h3>Recent activity</h3>
                </div>
                <span className="status-badge">API READY</span>
            </div>

            <div className="empty-state">
                <div className="empty-state__icon">↻</div>
                <h4>No activity loaded yet</h4>
                <p>
                This area is intentionally empty until the existing backend
                dashboard/activity endpoints are connected.
                </p>
            </div>
            </section>

            <section className="dashboard-card">
            <div className="card-heading">
                <div>
                <p className="eyebrow">SHORTCUTS</p>
                <h3>Quick actions</h3>
                </div>
            </div>

            <div className="quick-actions">
                {visibleActions.map((action) => (
                <Link
                    key={action.path}
                    to={action.path}
                    className={`quick-action quick-action--${action.tone}`}
                >
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                    <span className="quick-action__arrow" aria-hidden="true">→</span>
                </Link>
                ))}
            </div>
            </section>
        </div>
        </div>
    );
}
