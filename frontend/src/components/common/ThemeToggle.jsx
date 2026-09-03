import { useTheme } from '../../context/ThemeContext';
export default function ThemeToggle() { const { theme, toggleTheme } = useTheme(); return <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? '☾' : '☀'}</button>; }
