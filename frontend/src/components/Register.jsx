import { useState } from "react";

export default function Register({ onGoLogin, showNotification, onRegister }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    userType: "",
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.userType) {
      showNotification("Selecciona un tipo de usuario", "error");
      return;
    }

    if (form.password !== form.confirm) {
      showNotification("Las contraseñas no coinciden", "error");
      return;
    }

    if (onRegister) {
      setLoading(true);
      setError(null);
      onRegister({ nombre: form.name, correo: form.email, telefono: form.phone, contraseña: form.password, userType: form.userType })
        .then(() => {
          showNotification("Cuenta creada con éxito");
          onGoLogin();
        })
        .catch((err) => {
          const msg = err?.response?.data?.message || err?.message || "Error al crear cuenta";
          setError(msg);
          showNotification(msg, "error");
        })
        .finally(() => setLoading(false));
    } else {
      console.log(form);
      showNotification("Cuenta creada con éxito");
      onGoLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="bg-gradient-to-b from-blue-500 to-purple-600 h-[40vh] min-h-[300px] flex flex-col items-center justify-center text-white p-6 pb-20 rounded-b-[3rem] relative">
        <button
          onClick={onGoLogin}
          className="absolute top-6 left-6 text-white/80 hover:text-white flex items-center gap-2 transition-colors font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver
        </button>
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl relative z-10">
          <span className="text-3xl select-none">👤</span>
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Crear Cuenta</h1>
        <p className="text-blue-100 text-lg font-light text-center">Únete a MercadoLocal hoy mismo</p>
      </div>

      <main className="-mt-16 px-4 w-full max-w-md mx-auto z-10 pb-8 text-gray-700">
        <div className="bg-white rounded-3xl shadow-2xl p-8">

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-medium">Nombre</label>
              <input
                name="name"
                placeholder="Juan Pérez"
                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-medium">Correo electrónico</label>
              <input
                name="email"
                type="email"
                placeholder="tu@email.com"
                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-medium">Teléfono</label>
              <input
                name="phone"
                type="tel"
                placeholder="+56987654321"
                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-medium">Contraseña</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl p-3.5 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
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

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-medium">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  name="confirm"
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl p-3.5 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPass ? (
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

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-medium">Tipo de Usuario</label>
              <div className="relative">
                <select
                  name="userType"
                  className="w-full border border-gray-200 text-gray-700 rounded-xl p-3.5 appearance-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                  onChange={handleChange}
                  defaultValue=""
                >
                  <option value="" disabled>Selecciona tu rol</option>
                  <option value="buyer">Comprador</option>
                  <option value="seller">Vendedor</option>
                  <option value="driver">Repartidor</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] mt-4">
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          {error && <p className="mt-4 text-center text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">{error}</p>}

          <div className="mt-8 text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={onGoLogin}
                className="text-blue-600 bg-gray-200 font-bold hover:underline ml-1"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
