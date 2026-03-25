import { useState, useEffect } from "react";
import axios from "axios";

export default function UserRatingsModal({
    user,
    onClose,
    onBlock,
    onUnblock
}) {
    const [valoraciones, setValoraciones] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (user) {
            fetchValoraciones();
        }
    }, [user]);

    const fetchValoraciones = async () => {
        try {
            setLoading(true);
            // We assume this endpoint will exist or will return useful data if we implement it.
            const response = await axios.get(
                `${API_URL}/api/admin/usuarios/${user.id_usuario}/valoraciones`
            );
            setValoraciones(response.data.valoraciones || []);
            setEstadisticas(response.data.estadisticas || null);
        } catch (error) {
            console.error("Error cargando valoraciones:", error);
            // Set to empty array if endpoint fails for now so we can at least render the modal
            setValoraciones([]);
        } finally {
            setLoading(false);
        }
    };

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

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Valoraciones de {user.nombre}
                        </h2>
                        <p className="text-sm text-gray-600">
                            {user.correo}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
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
                                    </div>
                                </div>
                            )}

                            {/* Lista de valoraciones */}
                            {valoraciones.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-4">📊</div>
                                    <p className="text-lg font-medium">Sin valoraciones disponibles</p>
                                    <p className="text-sm">
                                        Este usuario aún no tiene valoraciones.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Valoraciones Recientes ({valoraciones.length})
                                    </h3>

                                    {valoraciones.map((valoracion) => (
                                        <div
                                            key={valoracion.id_valoracion || Math.random()}
                                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex">
                                                            {renderStars(valoracion.calificacion)}
                                                        </div>
                                                        {valoracion.nombreEvaluador && (
                                                            <span className="text-sm text-gray-600">
                                                                por {valoracion.nombreEvaluador}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {valoracion.fecha && (
                                                        <p className="text-xs text-gray-500">
                                                            Fecha: {new Date(valoracion.fecha).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
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
                <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center w-full">
                    <div>
                        {user.estado === 'activo' ? (
                            <button
                                onClick={() => onBlock(user)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Bloquear usuario
                            </button>
                        ) : (
                            <button
                                onClick={() => onUnblock(user.id_usuario)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Desbloquear usuario
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Cerrar modal
                    </button>
                </div>
            </div>
        </div>
    );
}
