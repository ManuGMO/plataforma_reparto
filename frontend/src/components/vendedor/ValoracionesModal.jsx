import { useState, useEffect } from "react";
import axios from "axios";

export default function ValoracionesModal({ 
  isOpen, 
  onClose, 
  repartidor, 
  idVendedor 
}) {
  const [valoraciones, setValoraciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && repartidor) {
      fetchValoraciones();
    }
  }, [isOpen, repartidor, idVendedor]);

  const fetchValoraciones = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3001/api/repartidores/valoraciones/${repartidor.id_usuario}/vendedor/${idVendedor}`
      );
      setValoraciones(response.data.valoraciones);
      setEstadisticas(response.data.estadisticas);
      console.log("Datos del modal: ", response.data);

    } catch (error) {
      console.error("Error cargando valoraciones:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span 
        key={i} 
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const getCalificacionColor = (calificacion) => {
    if (calificacion >= 4.5) return 'text-green-600';
    if (calificacion >= 3.5) return 'text-yellow-600';
    if (calificacion >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Valoraciones de {repartidor.nombre}
              </h2>
              <p className="text-sm text-gray-600">
                Pedidos trabajados juntos: {estadisticas?.pedidosCompartidos || 0}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Cargando valoraciones...</p>
            </div>
          ) : (
            <>
              {/* Estadísticas */}
              {estadisticas && estadisticas.totalValoraciones > 0 && (
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Resumen de Valoraciones</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Promedio */}
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getCalificacionColor(estadisticas.promedioCalificacion)}`}>
                        {estadisticas.promedioCalificacion}
                      </div>
                      <div className="flex justify-center mb-1">
                        {renderStars(Math.round(estadisticas.promedioCalificacion))}
                      </div>
                      <p className="text-sm text-gray-600">
                        {estadisticas.totalValoraciones} valoraciones
                      </p>
                    </div>
                    
                    {/* Distribución */}
                    <div className="space-y-1">
                      {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="flex items-center text-sm">
                          <span className="w-3 text-center">{rating}</span>
                          <span className="text-yellow-400 mx-1">★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ 
                                width: `${estadisticas.totalValoraciones > 0 
                                  ? (estadisticas.distribucionCalificaciones[rating] / estadisticas.totalValoraciones) * 100 
                                  : 0}%` 
                              }}
                            />
                          </div>
                          <span className="w-8 text-right">
                            {estadisticas.distribucionCalificaciones[rating]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de valoraciones */}
              {valoraciones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-lg font-medium">Sin valoraciones disponibles</p>
                  <p className="text-sm">
                    Este repartidor aún no tiene valoraciones de clientes en pedidos compartidos contigo.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Valoraciones Recientes ({valoraciones.length})
                  </h3>
                  
                  {valoraciones.map((valoracion) => (
                    <div 
                      key={valoracion.id_valoracion}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* Header de la valoración */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {renderStars(valoracion.calificacion)}
                            </div>
                            <span className="text-sm text-gray-600">
                              por {valoracion.nombreComprador}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Fecha: {new Date(valoracion.fecha).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Comentario */}
                      {valoracion.comentario && (
                        <div className="mt-3">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            "{valoracion.comentario}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}