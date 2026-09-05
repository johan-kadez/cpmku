import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import FirebaseSetup from './components/common/FirebaseSetup';
import { firebaseConfigured } from './services/firebase';

export default function App() {
  if (!firebaseConfigured) return <FirebaseSetup />;
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
