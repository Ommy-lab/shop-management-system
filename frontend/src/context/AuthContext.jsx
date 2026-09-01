import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
    }

    export function AuthProvider({ children }) {
    const [token, setToken] = useState(getStoredToken);
    const [user, setUser] = useState(null);
    const [isInitializing, setIsInitializing] = useState(Boolean(getStoredToken()));
    const [authError, setAuthError] = useState('');

    // Restore the user from the backend whenever a JWT exists after a page refresh.
    const restoreSession = useCallback(async () => {
        const storedToken = getStoredToken();

    if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsInitializing(false);
        return;
        }

        setIsInitializing(true);

    try {
        const response = await authApi.me();
        setUser(response.data.user ?? response.data);
        setToken(storedToken);
    } catch {
        // Invalid/expired tokens are removed so protected routes cannot remain accessible.
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    } finally {
        setIsInitializing(false);
        }
    }, []);

    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    const login = useCallback(async (credentials) => {
        setAuthError('');

        try {
        const response = await authApi.login(credentials);
        const receivedToken = response.data.token;
        const receivedUser = response.data.user;

        if (!receivedToken || !receivedUser) {
            throw new Error('The login response did not contain a token and user.');
        }

        localStorage.setItem(TOKEN_KEY, receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);

        return receivedUser;
        } catch (error) {
        const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Unable to sign in. Please check your credentials.';

        setAuthError(message);
        throw error;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setAuthError('');
    }, []);

    const clearAuthError = useCallback(() => {
        setAuthError('');
    }, []);

    const value = useMemo(
        () => ({
        token,
        user,
        isAuthenticated: Boolean(token && user),
        isInitializing,
        authError,
        login,
        logout,
        clearAuthError,
        restoreSession,
    }),
    [
        token,
        user,
        isInitializing,
        authError,
        login,
        logout,
        clearAuthError,
        restoreSession,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside an AuthProvider');
    }

    return context;
}
