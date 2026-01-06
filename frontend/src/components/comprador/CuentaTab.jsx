// src/pages/CuentaTab.jsx
import { useState } from "react";
import axios from "axios";
import MapaUbicacion from "../MapaUbicacion";

export default function CuentaTab(CompradorID) {
  const [ubicacion, setUbicacion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const guardarUbicacion = async () => {
    if (!ubicacion) return;
    
    setGuardando(true);
    setMensaje(null);
    
    try {
      await axios.put(`http://localhost:3001/api/usuarios/${CompradorID}/ubicacion`, {
        latitud: ubicacion.lat,
        longitud: ubicacion.lng
      });
      
      setMensaje({
        tipo: 'success',
        texto: '✅ Ubicación guardada correctamente'
      });
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMensaje(null);
      }, 3000);
      
    } catch (error) {
      console.error("Error guardando ubicación:", error);
      setMensaje({
        tipo: 'error',
        texto: '❌ Error al guardar la ubicación. Intenta nuevamente.'
      });
      
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => {
        setMensaje(null);
      }, 5000);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-4 h-full bg-gray-50">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mi Cuenta
          </h2>

        </div>

        {/* Sección de ubicación */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-green-500 mr-2">📍</span>
            Mi Ubicación
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Selecciona tu ubicación en el mapa. Puedes hacer clic para colocar un marcador 
              o arrastrarlo para ajustar la posición exacta.
            </p>
            
            {/* Mapa */}
            <MapaUbicacion onUbicacionSeleccionada={setUbicacion} />
          </div>

          {/* Información y acciones */}
          {ubicacion && (
            <div className="mt-6 space-y-4">
              
              {/* Información de coordenadas */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">
                  Coordenadas seleccionadas:
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Latitud:</span>
                    <p className="font-mono text-gray-800">{ubicacion.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Longitud:</span>
                    <p className="font-mono text-gray-800">{ubicacion.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>

              {/* Mensaje de estado */}
              {mensaje && (
                <div className={`p-4 rounded-lg border ${
                  mensaje.tipo === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {mensaje.texto}
                </div>
              )}

              {/* Botón de guardar */}
              <button
                onClick={guardarUbicacion}
                disabled={guardando}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  guardando
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {guardando ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Guardando ubicación...
                  </span>
                ) : (
                  '💾 Guardar Ubicación'
                )}
              </button>
            </div>
          )}

          {/* Mensaje de ayuda cuando no hay ubicación */}
          {!ubicacion && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-blue-500 text-xl mr-3 mt-0.5">💡</span>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    ¿Cómo seleccionar mi ubicación?
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Haz clic en el botón 📍 para usar tu ubicación actual</li>
                    <li>• O haz clic directamente en cualquier punto del mapa</li>
                    <li>• Puedes arrastrar el marcador para ajustar la posición</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}