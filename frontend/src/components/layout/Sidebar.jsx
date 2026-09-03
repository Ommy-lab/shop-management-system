import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/roles';

const all = [
  { to: '/dashboard', icon: '⌂', label: 'Dashboard', roles: Object.values(ROLES) },
  { section: 'Management', roles: [ROLES.SUPER_ADMIN] },
  { to: '/admin/users', icon: '👥', label: 'Users', roles: [ROLES.SUPER_ADMIN] },
  { section: 'Supply & stock', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STOREKEEPER] },
  { to: '/products', icon: '▣', label: 'Products', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { to: '/suppliers', icon: '⌂', label: 'Suppliers', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { to: '/trucks', icon: '▰', label: 'Trucks', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { to: '/purchases', icon: '🛒', label: 'Purchases', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { to: '/inventory', icon: '▦', label: 'Store inventory', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STOREKEEPER] },
  { to: '/inventory/low-stock', icon: '⚠', label: 'Low stock', roles: [ROLES.STOREKEEPER] },
  { to: '/inventory/movements', icon: '↔', label: 'Stock movements', roles: [ROLES.STOREKEEPER] },
  { to: '/truck-loads', icon: '⇧', label: 'Load truck', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STOREKEEPER] },
  { to: '/truck-inventory', icon: '▤', label: 'Truck inventory', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STOREKEEPER] },
  { section: 'My sales route', roles: [ROLES.SALESPERSON] },
  { to: '/truck-inventory', icon: '▤', label: 'My inventory', roles: [ROLES.SALESPERSON] },
  { to: '/customers', icon: '👥', label: 'Customers', roles: [ROLES.SALESPERSON] },
  { to: '/sales', icon: '🛒', label: 'Sales', roles: [ROLES.SALESPERSON] },
  { to: '/payments', icon: '▣', label: 'Payments', roles: [ROLES.SALESPERSON] },
  { to: '/debts', icon: '◎', label: 'Debts', roles: [ROLES.SALESPERSON] },
  { to: '/expenses', icon: '↘', label: 'Expenses', roles: [ROLES.SALESPERSON] },
  { to: '/truck-stock-events', icon: '↩', label: 'Stock events', roles: [ROLES.SALESPERSON, ROLES.STOREKEEPER] },
  { section: 'Control & insights', roles: Object.values(ROLES) },
  { to: '/reconciliation', icon: '✓', label: 'Reconciliation', roles: [ROLES.SALESPERSON] },
  { to: '/reconciliation/admin', icon: '✓', label: 'Reconciliations', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { to: '/reports', icon: '↗', label: 'Reports', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { to: '/profit-loss', icon: '◫', label: 'Profit & loss', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth(); const items = all.filter((item) => item.roles.includes(user?.role));
  return <><aside className={`sidebar ${open ? 'sidebar--open' : ''}`}><div className="brand"><span>S</span><div><strong>ShopFlow</strong><small>Business control</small></div><button onClick={onClose} className="icon-btn sidebar__close">×</button></div><nav>{items.map((item, index) => item.section ? <p className="nav-section" key={`${item.section}-${index}`}>{item.section}</p> : <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => isActive ? 'active' : ''}><span>{item.icon}</span>{item.label}</NavLink>)}</nav><div className="sidebar__workflow"><small>Business workflow</small><strong>Stock → Truck → Sale</strong><span>Reconcile every day</span></div></aside>{open && <button className="sidebar-scrim" aria-label="Close menu" onClick={onClose}/>}</>;
}
