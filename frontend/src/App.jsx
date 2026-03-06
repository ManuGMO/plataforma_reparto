// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Vendedor from "./pages/vendedor";
import Comprador from "./pages/comprador";
import Repartidor from "./pages/repartidor";
import Administrador from "./pages/administrador";
import Login from "./components/Login";
import Register from "./components/Register";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useLocation } from "react-router-dom";
import React from "react";

function Home() {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (loading) return; // ⬅️ MUY IMPORTANTE

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    const mapping = {
      comprador: '/comprador',
      vendedor: '/vendedor',
      repartidor: '/repartidor',
      admin: '/administrador',
    };

    const role = user?.roles?.[0];
    const dest = mapping[role];

    if (dest) {
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, loading, user?.roles?.[0], navigate]);

  return null;
}

function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const showNotification = (msg, type = "info") => console.log("notif:", msg, type);
  const onGoRegister = () => navigate("/register");

  const onLogin = async (creds) => {
    try {
      const res = await auth.login(creds);
      showNotification('Login exitoso');
      return res;
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Error de autenticación', 'error');
    }
  };

  return <Login onGoRegister={onGoRegister} showNotification={showNotification} onLogin={onLogin} />;
}

function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const showNotification = (msg, type = "info") => console.log("notif:", msg, type);
  const onGoLogin = () => navigate("/login");

  const onRegister = async (data) => {
    try {
      await auth.register(data);

      await auth.login({ correo: data.correo, contraseña: data.contraseña });

      const mapping = { comprador: '/comprador', vendedor: '/vendedor', repartidor: '/repartidor', admin: '/administrador' };
      const userRole = auth.user?.roles?.[0] || null;
      const dest = mapping[userRole] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      throw err;
    }
  };

  return <Register onGoLogin={onGoLogin} showNotification={showNotification} onRegister={onRegister} />;
}

const BlockedScreen = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center border-l-4 border-red-500">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🚫</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cuenta Bloqueada</h2>
        <p className="text-gray-600 mb-6">
          Tu cuenta ha sido restringida por un administrador. No puedes acceder a la plataforma.
        </p>

        {user?.bloqueo && (
          <div className="bg-red-50 rounded-lg p-4 mb-8 text-left">
            <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide mb-1">Motivo:</h3>
            <p className="text-red-700 italic">"{user.bloqueo.motivo}"</p>

          </div>
        )}

        <button
          onClick={logout}
          className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { user } = useAuth();

  if (user?.estado === 'bloqueado') {
    return <BlockedScreen />;
  }

  return (
    <Routes>
      {/* Rutas públicas de autenticación: aparecen antes de las rutas de aplicación */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Home />} />
      <Route path="/vendedor" element={<ProtectedRoute allowedRoles={["vendedor"]}><Vendedor /></ProtectedRoute>} />
      <Route path="/comprador" element={<ProtectedRoute allowedRoles={["comprador"]}><Comprador /></ProtectedRoute>} />
      <Route path="/repartidor" element={<ProtectedRoute allowedRoles={["repartidor"]}><Repartidor /></ProtectedRoute>} />
      <Route path="/administrador" element={<ProtectedRoute allowedRoles={["admin"]}><Administrador /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
