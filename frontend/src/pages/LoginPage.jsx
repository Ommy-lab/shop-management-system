import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../utils/roles';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, authError, clearAuthError } = useAuth();

    const [form, setForm] = useState({
    email: '',
    password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
        navigate(getDashboardPath(), { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
        ...current,
        [name]: value,
        }));

        if (authError) {
        clearAuthError();
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
        const user = await login(form);

        // Return users to the page they originally tried to access when possible.
        const requestedPath = location.state?.from?.pathname;
        navigate(requestedPath || getDashboardPath(user.role), { replace: true });
        } catch {
        // The AuthContext stores a user-friendly authentication error.
        } finally {
        setIsSubmitting(false);
        }
    };

    return (
        <main className="login-page">
        <section className="login-panel login-panel--brand">
            <div className="login-brand">
            <div className="brand-mark brand-mark--large">S</div>
            <div>
                <span>SHOP MANAGEMENT</span>
                <strong>Business Console</strong>
            </div>
            </div>

            <div className="login-intro">
            <p className="eyebrow">MANAGEMENT PLATFORM</p>
            <h1>Run your shop with clarity.</h1>
            <p>
                A centralized workspace for products, inventory, sales, customers,
                payments and business operations.
            </p>
            </div>

            <div className="login-feature-list">
            <div>✓ Role-based access</div>
            <div>✓ Secure JWT authentication</div>
            <div>✓ Responsive business workspace</div>
            </div>
        </section>

        <section className="login-panel login-panel--form">
            <div className="login-card">
            <div className="login-card__heading">
                <p className="eyebrow">WELCOME BACK</p>
                <h2>Sign in to your account</h2>
                <p>Enter your credentials to continue.</p>
            </div>

            {authError && (
                <div className="alert alert--danger" role="alert">
                {authError}
                </div>
            )}

            <form className="form-stack" onSubmit={handleSubmit}>
                <label className="form-field">
                <span>Email address</span>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    autoComplete="email"
                    required
                />
                </label>

                <label className="form-field">
                <span>Password</span>
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                />
                </label>

                <button
                className="button button--primary button--full"
                type="submit"
                disabled={isSubmitting}
                >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
            </div>

            <p className="login-footer-note">
            Shop Management System · Secure business access
            </p>
        </section>
        </main>
    );
}
