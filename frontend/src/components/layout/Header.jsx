import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const titles = { dashboard: 'Business overview', products: 'Products', suppliers: 'Suppliers', trucks: 'Trucks', purchases: 'Purchases', inventory: 'Inventory', 'truck-loads': 'Truck operations', customers: 'Customers', sales: 'Sales', payments: 'Payments', debts: 'Customer debts', expenses: 'Expenses', reconciliation: 'Reconciliation', reports: 'Reports', users: 'User management' };
export default function Header({ onMenu }) {
  const { user, logout } = useAuth(); const [open, setOpen] = useState(false); const section = useLocation().pathname.split('/').filter(Boolean)[0] || 'dashboard';
  return <header className="topbar"><div className="topbar__title"><button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">☰</button><div><span>Shop Management System</span><strong>{titles[section] || 'Workspace'}</strong></div></div><div className="topbar__actions"><button className="icon-btn notification-btn" aria-label="Notifications">♢</button><ThemeToggle/><div className="user-menu"><button className="user-menu__button" onClick={() => setOpen((v) => !v)} aria-expanded={open}><span className="avatar">{user?.name?.[0] || 'U'}</span><span><strong>{user?.name || user?.email}</strong><small>{user?.role?.replaceAll('_', ' ')}</small></span><b>⌄</b></button>{open && <div className="user-menu__popup"><p>{user?.email}</p><button onClick={logout}>↪ Sign out</button></div>}</div></div></header>;
}
