import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const initialToken = localStorage.getItem('authToken');
  if (initialToken) axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;

  const [token, setToken] = useState(() => initialToken);

  try {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    if (typeof window !== 'undefined' && window.fetch && !window._auth_fetch_patched) {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init = {}) => {
        try {
          const url = typeof input === 'string' ? input : input.url;
          const isApi = url && (url.startsWith(apiBase) || url.startsWith('/api') || url.includes('/api/'));
          if (isApi) {
            const auth = init.headers && (init.headers.Authorization || init.headers.authorization);
            if (!auth) {
              const stored = localStorage.getItem('authToken');
              if (stored) {
                init.headers = Object.assign({}, init.headers, { Authorization: `Bearer ${stored}` });
              }
            }
          }
        } catch (e) {
          // ignore
        }
        return originalFetch(input, init);
      };
      window._auth_fetch_patched = true;
    }
  } catch (e) {
    // ignore
  }
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('authUser');

    console.log("Initial Auth User from localStorage:", raw);

    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
      // Frontend envía el token en cada request protegida
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('authUser', JSON.stringify(user));
    else localStorage.removeItem('authUser');
  }, [user]);


  //   Funcion para el login
  const login = async ({ correo, contraseña }) => {
    const res = await axios.post('/api/auth/login', { correo, contraseña });
    console.log("LOGIN RESPONSE DATA:", res.data);
    // Set header immediately to ensure subsequent requests include it
    if (res.data?.token) axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };


  //  Funcion para el registro
  const register = async ({ nombre, correo, contraseña, userType }) => {
    const res = await axios.post('/api/auth/register', { nombre, correo, contraseña, userType });
    return res.data;
  };

  const logout = () => {
    // Inform backend to revoke token (best-effort)
    try {
      if (token) {
        // send Authorization header explicitly to ensure backend receives it
        void axios.post('/api/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      }
    } catch (err) {
      // ignore
    }
    setToken(null);
    setUser(null);
    navigate('/login');
  };


  // Funcion para seleccionar rol
  const selectRole = async (role) => {
    const res = await axios.post('/api/auth/select-role', { role });
    // reflect chosen role in local user state
    setUser((u) => (u ? { ...u, activeRole: role } : u));
    return res.data;
  };

  // Update user partial fields (e.g., latitud/longitud) and persist
  const updateUser = (patch) => {
    setUser((u) => {
      if (!u) return u;
      const updated = { ...u, ...patch };
      localStorage.setItem('authUser', JSON.stringify(updated));
      return updated;
    });
  };

  const value = { token, user, login, register, logout, selectRole, updateUser, isAuthenticated: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
