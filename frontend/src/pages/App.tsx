import { useAuth, AuthProvider } from '../contexts/AuthContext/AuthContext';
import LoginPage from './Login';
import AccountsPage from './Accounts/Accounts';

function AppContent() {
  const { loading, error, connected } = useAuth();

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!connected) {
    return <LoginPage />;
  }

  return <AccountsPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
