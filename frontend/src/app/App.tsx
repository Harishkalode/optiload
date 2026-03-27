import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DevModeProvider } from './contexts/DevModeContext';
import { DevModeToggle } from './components/dev/DevModeToggle';
import '../styles/fonts.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DevModeProvider>
          <RouterProvider router={router} />
          <DevModeToggle />
        </DevModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}