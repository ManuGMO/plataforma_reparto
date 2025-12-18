// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Vendedor from "./pages/vendedor";
import Comprador from "./pages/comprador";
import Repartidor from "./pages/repartidor";
import Administrador from "./pages/administrador";
import Login from "./components/login";
import Register from "./components/register";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useLocation } from "react-router-dom";
import React from "react";

function Home() {
  // Redirige según el rol del usuario autenticado
  const auth = useAuth();
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!auth?.isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    const mapping = { comprador: '/comprador', vendedor: '/vendedor', repartidor: '/repartidor', administrador: '/administrador' };
    const userRole = auth.user?.roles?.[0] || null;
    const dest = mapping[userRole] || '/';
    navigate(dest, { replace: true });
  }, [auth, navigate]);

  return <div />;
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
      await auth.login(creds);
      showNotification('Login exitoso');
      navigate(from, { replace: true });
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas de autenticación: aparecen antes de las rutas de aplicación */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Home />} />
          <Route path="/vendedor" element={<ProtectedRoute allowedRoles={["vendedor"]}><Vendedor /></ProtectedRoute>} />
          <Route path="/comprador" element={<ProtectedRoute allowedRoles={["comprador"]}><Comprador /></ProtectedRoute>} />
          <Route path="/repartidor" element={<ProtectedRoute allowedRoles={["repartidor"]}><Repartidor /></ProtectedRoute>} />
          <Route path="/administrador" element={<ProtectedRoute allowedRoles={["administrador"]}><Administrador /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
