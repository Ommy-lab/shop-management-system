import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  return <ThemeProvider><ToastProvider><AuthProvider><AppRoutes /></AuthProvider></ToastProvider></ThemeProvider>;
}
