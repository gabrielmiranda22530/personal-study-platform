import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard'; // Importando nossa tela nova!
import Login from './pages/Login';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver logado, vai pra tela de Login
  if (!user) {
    return <Login />;
  }

  // Se estiver logado, vai pro Dashboard bonitão!
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}