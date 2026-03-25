import { useState, useEffect } from 'react';
import axios from 'axios';
import AgregarRutaModal from './AgregarRutaModal';
import RutaPreviewModal from './RutaPreviewModal';

export default function RutasHorariosTab({ repartidorId }) {
  const [rutas, setRutas] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [rutaEditar, setRutaEditar] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRuta, setPreviewRuta] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Cargar rutas al montar el componente
  useEffect(() => {
    cargarRutas();
  }, [repartidorId]);

  const cargarRutas = async () => {
    try {
      setCargando(true);
      const response = await axios.get(`${API_URL}/api/rutas/${repartidorId}`);
      setRutas(response.data);
    } catch (error) {
      console.error('Error cargando rutas:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleAgregarRuta = () => {
    setRutaEditar(null);
    setShowAddModal(true);
  };

  const handleEditarRuta = (ruta) => {
    setRutaEditar(ruta);
    setShowAddModal(true);
  };

  const handleEliminarRuta = async (idRuta) => {
    if (!confirm('¿Estás seguro de eliminar esta ruta?')) return;

    try {
      await axios.delete(`${API_URL}/api/rutas/${idRuta}`);
      cargarRutas(); // Recargar lista
    } catch (error) {
      console.error('Error eliminando ruta:', error);
      alert('Error al eliminar la ruta');
    }
  };

  const handleGuardarRuta = async (datosRuta) => {
    try {
      if (rutaEditar) {
        // Actualizar ruta existente
        await axios.put(`${API_URL}/api/rutas/${rutaEditar.id_ruta}`, datosRuta);
      } else {
        // Crear nueva ruta
        await axios.post(`${API_URL}/api/rutas`, {
          ...datosRuta,
          id_usuario: repartidorId
        });
      }
      setShowAddModal(false);
      cargarRutas(); // Recargar lista
    } catch (error) {
      console.error('Error guardando ruta:', error);
      throw error;
    }
  };

  // Agrupar rutas por día
  const rutasPorDia = rutas.reduce((acc, ruta) => {
    const dia = ruta.dia;
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(ruta);
    return acc;
  }, {});

  const diasOrdenados = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const diasNombres = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Rutas y Horarios
              </h2>
              <p className="text-gray-600">
                Configura tus rutas frecuentes y horarios de disponibilidad
              </p>
            </div>
            <button
              onClick={handleAgregarRuta}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md"
            >
              + Agregar Ruta
            </button>
          </div>
        </div>

        {/* Lista de rutas */}
        {rutas.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🛣️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No tienes rutas configuradas
            </h3>
            <p className="text-gray-500 mb-6">
              Agrega tus rutas frecuentes para optimizar tus entregas
            </p>
            <button
              onClick={handleAgregarRuta}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Crear primera ruta
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {diasOrdenados.map(dia => {
              const rutasDia = rutasPorDia[dia] || [];
              if (rutasDia.length === 0) return null;

              return (
                <div key={dia} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header del día */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <span className="mr-2">📅</span>
                      {diasNombres[dia]}
                      <span className="ml-auto text-sm font-normal bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        {rutasDia.length} {rutasDia.length === 1 ? 'ruta' : 'rutas'}
                      </span>
                    </h3>
                  </div>

                  {/* Rutas del día */}
                  <div className="divide-y divide-gray-200">
                    {rutasDia.map(ruta => (
                      <div key={ruta.id_ruta} onClick={() => { setPreviewRuta(ruta); setShowPreview(true); }} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Nombre de la ruta */}
                            {ruta.nombre_ruta && (
                              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                                {ruta.nombre_ruta}
                              </h4>
                            )}

                            {/* Horario de disponibilidad */}
                            <div className="flex items-center mb-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <span className="text-blue-600 mr-3 text-xl">⏰</span>
                              <div>
                                <p className="text-xs text-blue-700 font-medium mb-1">
                                  Horario de Disponibilidad
                                </p>
                                <p className="text-lg font-bold text-blue-900">
                                  {ruta.hora_inicio.substring(0, 5)} - {ruta.hora_fin.substring(0, 5)}
                                </p>
                              </div>
                            </div>

                            {/* Ruta: Origen → Destino */}
                            <div className="space-y-3">
                              <div className="flex items-start">
                                <span className="text-green-500 text-xl mr-3 mt-0.5">📍</span>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium uppercase">Origen</p>
                                  <p className="text-gray-900 font-medium">{ruta.origen}</p>
                                  <p className="text-xs text-gray-500 font-mono mt-1">
                                    {parseFloat(ruta.origen_lat).toFixed(5)}, {parseFloat(ruta.origen_lng).toFixed(5)}
                                  </p>
                                </div>
                              </div>

                              <div className="ml-6 border-l-2 border-dashed border-blue-300 h-8 flex items-center">
                                <span className="ml-4 text-blue-500 text-sm">🚗 Ruta habitual</span>
                              </div>

                              <div className="flex items-start">
                                <span className="text-red-500 text-xl mr-3 mt-0.5">📍</span>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium uppercase">Destino</p>
                                  <p className="text-gray-900 font-medium">{ruta.destino}</p>
                                  <p className="text-xs text-gray-500 font-mono mt-1">
                                    {parseFloat(ruta.destino_lat).toFixed(5)}, {parseFloat(ruta.destino_lng).toFixed(5)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditarRuta(ruta); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEliminarRuta(ruta.id_ruta); }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-500 text-xl mr-3 mt-0.5">💡</span>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                ¿Para qué sirven las rutas frecuentes?
              </h4>
              <p className="text-sm text-blue-800">
                Define tus rutas habituales y horarios para que el sistema te asigne pedidos
                que coincidan con tu recorrido diario, optimizando tu tiempo y ganancias.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de agregar/editar ruta */}
      {showAddModal && (
        <AgregarRutaModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setRutaEditar(null);
          }}
          onGuardar={handleGuardarRuta}
          rutaEditar={rutaEditar}
        />
      )}
      {showPreview && (
        <RutaPreviewModal
          isOpen={showPreview}
          onClose={() => { setShowPreview(false); setPreviewRuta(null); }}
          ruta={previewRuta}
        />
      )}
    </div>
  );
}