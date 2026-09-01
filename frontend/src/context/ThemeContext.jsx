import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const THEME_KEY = 'shop_theme';

function getInitialTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    const value = useMemo(
        () => ({
        theme,
        setTheme,
        toggleTheme,
        }),
        [theme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
    }

    export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used inside a ThemeProvider');
    }

    return context;
}
