import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function DashboardLayout() { const [menuOpen, setMenuOpen] = useState(false); return <div className="app-shell"><Sidebar open={menuOpen} onClose={() => setMenuOpen(false)}/><div className="app-shell__body"><Header onMenu={() => setMenuOpen(true)}/><main className="content"><Outlet/></main><Footer/></div></div>; }
