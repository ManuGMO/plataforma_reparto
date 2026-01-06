import { useState } from "react";
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Login({ onGoRegister, showNotification, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      showNotification("Completa todos los campos", "error");
      return;
    }

    setError(null);
    setLoading(true);
    showNotification("Iniciando sesión...");
    const doLogin = async () => {
      try {
        let res = null;
        if (onLogin) res = await onLogin({ correo: email, contraseña: password });

        // Si el login devolvió múltiples roles, abrir modal para elegir
        const roles = res?.user?.roles || [];
        if (roles.length > 1) {
          setRoleOptions(roles);
          setRoleModalOpen(true);
        } else {
          // navegar según rol único
          const mapping = { comprador: '/comprador', vendedor: '/vendedor', repartidor: '/repartidor', admin: '/administrador' };
          const userRole = roles[0] || null;
          const dest = mapping[userRole] || '/';
          navigate(dest, { replace: true });
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Error al iniciar sesión';
        setError(msg);
        showNotification(msg, 'error');
      } finally {
        setLoading(false);
      }
    };
    doLogin();
  };

  const auth = useAuth();
  const navigate = useNavigate();
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);

  const chooseRole = async (role) => {
    try {
      await auth.selectRole(role);
      const mapping = { comprador: '/comprador', vendedor: '/vendedor', repartidor: '/repartidor', admin: '/administrador' };
      const dest = mapping[role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Error seleccionando rol', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="bg-gradient-to-b from-blue-500 to-purple-600 h-[40vh] min-h-[300px] flex flex-col items-center justify-center text-white p-6 pb-20 rounded-b-[3rem]">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl relative z-10">
          <span className="text-4xl select-none">🛒</span>
        </div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">MercadoLocal</h1>
      </div>

      <main className="-mt-16 px-4 w-full max-w-md mx-auto z-10 pb-8 text-gray-700">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Iniciar Sesión</h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-medium">Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-medium">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl p-3.5 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 bg-gray-200 hover:text-gray-600 transition-colors"
                >
                  {showPass ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>


            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] mt-4">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Modal para seleccionar el Rol */}
          {roleModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">¿Con qué rol quieres entrar?</h3>
                <p className="text-sm text-gray-500 mb-4">Selecciona una opción para acceder a la interfaz correspondiente.</p>
                <div className="space-y-3">
                  {roleOptions.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRoleModalOpen(false); chooseRole(r); }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                    onClick={() => setRoleModalOpen(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-center text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">{error}</p>}

          <div className="mt-8 text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600">
              ¿No tienes cuenta?{" "}
              <button
                onClick={onGoRegister}
                className="text-blue-600 font-bold bg-gray-100 hover:underline ml-1"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
