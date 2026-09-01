import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Close the mobile drawer whenever the route changes.
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleEscape = (event) => {
        if (event.key === 'Escape') {
            setSidebarOpen(false);
        }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <div className="app-shell">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="app-main">
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <main className="main-content">
            <Outlet />
            </main>

            <Footer />
        </div>
        </div>
    );
}
