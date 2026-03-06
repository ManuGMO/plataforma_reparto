import { useEffect, useState } from "react";
import axios from "axios";
import BlockModal from "./BlockModal";
import ValoracionesModal from "./ValoracionesModal";

export default function RepartidoresTab({ idUsuario }) {
  const [repartidores, setRepartidores] = useState([]);
  const [selectedRepartidor, setSelectedRepartidor] = useState(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isValoracionesModalOpen, setIsValoracionesModalOpen] = useState(false);
  const [selectedRepartidorValoraciones, setSelectedRepartidorValoraciones] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  // Obtener repartidores desde backend
  useEffect(() => {
    const fetchRepartidores = async () => {
      try {
        setLoading(true);
        console.log("Obteniendo repartidores para vendedor ID:", idUsuario);

        const response = await axios.get(`${API_URL}/api/repartidores/${idUsuario}`);
        setRepartidores(response.data);
        console.log("Repartidores obtenidos:", response.data);

      } catch (error) {
        console.error("Error al obtener repartidores:", error);
        setRepartidores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRepartidores();
  }, [idUsuario]);

  // Modal de bloqueo
  const openBlockModal = (repartidor) => {
    console.log("Abriendo modal de bloqueo para repartidor:", repartidor);
    setSelectedRepartidor(repartidor);
    setIsBlockModalOpen(true);
  };

  const closeBlockModal = () => {
    console.log("Cerrando modal de bloqueo");
    setSelectedRepartidor(null);
    setIsBlockModalOpen(false);
  };

  // Modal de valoraciones
  const openValoracionesModal = (repartidor) => {
    console.log("Abriendo modal de valoraciones para repartidor:", repartidor);
    setSelectedRepartidorValoraciones(repartidor);
    setIsValoracionesModalOpen(true);
  };

  const closeValoracionesModal = () => {
    console.log("Cerrando modal de valoraciones");
    setSelectedRepartidorValoraciones(null);
    setIsValoracionesModalOpen(false);
  };

  // Callback para actualizar la lista después del bloqueo
  const handleBlockSuccess = (repartidorId, motivoBloqueo) => {
    console.log("Bloqueo exitoso, marcando como bloqueado:", repartidorId);
    setRepartidores(prev =>
      prev.map(r =>
        r.id_usuario === repartidorId
          ? { ...r, bloqueado: true, motivoBloqueo: motivoBloqueo }
          : r
      )
    );
    closeBlockModal();
  };

  // Función para desbloquear
  const handleUnblock = async (repartidor) => {
    if (!confirm(`¿Estás seguro de desbloquear a ${repartidor.nombre}?`)) {
      return;
    }

    try {
      await axios.post(`${API_URL}/api/repartidores/desbloquear/${repartidor.id_usuario}`, {
        id_bloqueador: idUsuario
      });

      // Actualizar estado local
      setRepartidores(prev =>
        prev.map(r =>
          r.id_usuario === repartidor.id_usuario
            ? { ...r, bloqueado: false, motivoBloqueo: null }
            : r
        )
      );

      alert(`Se desbloqueó exitosamente a ${repartidor.nombre}`);
    } catch (error) {
      console.error("Error al desbloquear:", error);
      alert("Error al desbloquear usuario");
    }
  };

  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400 text-sm">Sin calificar</span>;

    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Repartidores</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Cargando repartidores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Repartidores</h2>
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {repartidores.length} repartidores
        </div>
      </div>

      {repartidores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🚚</div>
          <p className="text-lg font-medium">No hay repartidores aún</p>
          <p className="text-sm">Los repartidores aparecerán aquí después de entregar tus pedidos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {repartidores.map((r) => (
            <div
              key={r.id_usuario}
              className={`border rounded-lg p-4 shadow-sm transition-all duration-200 ${r.bloqueado
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-gray-200 hover:shadow-md'
                }`}
            >
              {/* Información principal del repartidor */}
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => !r.bloqueado && openValoracionesModal(r)}
                title={!r.bloqueado ? "Click para ver valoraciones detalladas" : ""}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${r.bloqueado ? 'text-red-700' : 'text-gray-900'}`}>
                      {r.nombre}
                    </h3>
                    {r.bloqueado && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Bloqueado
                      </span>
                    )}
                    {!r.bloqueado && (
                      <span className="text-xs text-blue-600 hover:text-blue-800">
                        Ver valoraciones →
                      </span>
                    )}
                  </div>

                  {/* Estadísticas */}
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-4">
                      <p className={`text-sm ${r.bloqueado ? 'text-red-600' : 'text-gray-600'}`}>
                        📦 {r.totalPedidos} pedidos entregados
                      </p>
                      <div className="flex items-center">
                        {renderStars(r.promedioCalificacion)}
                      </div>
                    </div>
                  </div>

                  {/* Motivo de bloqueo */}
                  {r.bloqueado && r.motivoBloqueo && (
                    <p className="text-xs text-red-600 mt-2 italic">
                      Motivo: {r.motivoBloqueo}
                    </p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                  {r.bloqueado ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnblock(r);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      title="Desbloquear repartidor"
                    >
                      Desbloquear
                    </button>
                  ) : (
                    <>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openBlockModal(r);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        title="Bloquear repartidor"
                      >
                        Bloquear
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Bloqueo */}
      {isBlockModalOpen && selectedRepartidor && (
        <BlockModal
          repartidor={selectedRepartidor}
          onClose={closeBlockModal}
          idUsuario={idUsuario}
          onBlockSuccess={handleBlockSuccess}
        />
      )}

      {/* Modal de Valoraciones */}
      {isValoracionesModalOpen && selectedRepartidorValoraciones && (
        <ValoracionesModal
          isOpen={isValoracionesModalOpen}
          onClose={closeValoracionesModal}
          repartidor={selectedRepartidorValoraciones}
          idVendedor={idUsuario}
        />
      )}
    </div>
  );
}