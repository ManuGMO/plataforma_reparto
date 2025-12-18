import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  // Configurar baseURL para axios: preferir variable de entorno Vite, si no usar localhost:3001
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Frontend envía el token en cada request protegida
    } else {
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('authUser', JSON.stringify(user));
    else localStorage.removeItem('authUser');
  }, [user]);

  const login = async ({ correo, contraseña }) => {
    const res = await axios.post('/api/auth/login', { correo, contraseña });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async ({ nombre, correo, contraseña, userType }) => {
    const res = await axios.post('/api/auth/register', { nombre, correo, contraseña, userType });
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const value = { token, user, login, register, logout, isAuthenticated: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
