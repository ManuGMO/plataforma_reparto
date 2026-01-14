import { useState, useEffect } from 'react';
import { getStatusColor, getStatusText, getStatusIcon } from "./PedidoModal";
import PedidoModal from "./PedidoModal";

export default function ComprasTab({ CompradorID }) {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPedido, setSelectedPedido] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchCompras = async () => {
            try {
                setLoading(true);
                // Usamos el mismo endpoint que Pedidos pero filtramos en el cliente
                // Idealmente el backend tendría un filtro, pero esto funciona por ahora
                const response = await fetch(`http://localhost:3001/api/pedidos/comprador/${CompradorID}`);
                if (!response.ok) throw new Error('Error al cargar historial');

                const data = await response.json();
                // Filtrar solo entregados
                const entregados = data.filter(p => p.estado === 'entregado');
                // Ordenar por fecha, más reciente primero (asumiendo que id o fecha sirve)
                entregados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

                setCompras(entregados);
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        };

        if (CompradorID) fetchCompras();
    }, [CompradorID]);

    const openModal = (pedido) => {
        setSelectedPedido(pedido);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedPedido(null);
    };

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse mb-6"></div>
                {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-xl h-24 shadow-sm border border-gray-100 animate-pulse"></div>
                ))}
            </div>
        )
    }

    return (
        <div className="p-4 bg-gray-50 min-h-full pb-24">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Mis Compras</h2>
                <p className="text-sm text-gray-500">Historial de pedidos entregados</p>
            </header>

            {compras.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛍️</div>
                    <h3 className="text-lg font-medium text-gray-900">Aún no tienes compras finalizadas</h3>
                    <p className="text-gray-500 mt-2">Tus pedidos entregados aparecerán aquí.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {compras.map((pedido) => (
                        <div
                            key={pedido.id}
                            onClick={() => openModal(pedido)}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                                        <span className="text-xl">✓</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            Pedido #{pedido.id}
                                        </h3>
                                        <p className="text-xs text-gray-500">{pedido.fecha}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                    ${pedido.total}
                                </span>
                            </div>

                            <div className="pl-12">
                                <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {pedido.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                                    <span>Entregado en: {pedido.direccion || 'Dirección registrada'}</span>
                                    <span className="flex items-center text-blue-500 font-medium">
                                        Ver detalles →
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <PedidoModal
                pedido={selectedPedido}
                showModal={showModal}
                onClose={closeModal}
            />
        </div>
    );
}
