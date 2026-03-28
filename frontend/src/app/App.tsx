import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DevModeProvider } from './contexts/DevModeContext';
import { DevModeToggle } from './components/dev/DevModeToggle';
import { DevModeHeader } from './components/dev/DevModeHeader';
import { ErrorBoundary } from './components/ErrorBoundary';
import '../styles/fonts.css';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DevModeProvider>
            {import.meta.env.DEV ? <DevModeHeader /> : null}
            <RouterProvider router={router} />
            {import.meta.env.DEV ? <DevModeToggle /> : null}
          </DevModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
