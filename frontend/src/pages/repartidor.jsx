import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/repartidor/Header";
import TabsRepartidor from "../components/repartidor/TabsRepartidor";
import PedidosTabRepartidor from "../components/repartidor/PedidosTabRepartidor";
import EntregasTab from "../components/repartidor/EntregasTab";
import RutasHorariosTab from "../components/repartidor/RutasHorariosTab";
import PerfilTab from "../components/repartidor/PerfilTab";
import ActiveDelivery from "../components/repartidor/ActiveDelivery";
import Notification from "../components/Notification";
import NewOrderNotification from "../components/repartidor/NewOrderNotification";
import AppMobileContainer from "../components/common/AppMobileContainer";

export default function Repartidor() {
  const [activeTab, setActiveTab] = useState("pedidos");
  const [currentScreen, setCurrentScreen] = useState("main"); // main, orderDetail, activeDelivery
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState(null);
  const [notification, setNotification] = useState("");
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [todayStats, setTodayStats] = useState({ earnings: 0, deliveries: 0, rating: 4.8 });

  const { user } = useAuth();
  const ID_REPARTIDOR = user?.id;

  useEffect(() => {
    const loadTodayStats = async () => {
      try {
        if (!ID_REPARTIDOR) return;
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/repartidor/${ID_REPARTIDOR}/estadisticas/hoy`);
        const stats = await response.json();
        setTodayStats(stats);
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      }
    };
    loadTodayStats();
  }, [ID_REPARTIDOR]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setCurrentScreen("orderDetail");
  };

  const handleAcceptOrder = (order) => {
    setActiveDeliveryOrder(order);
    setCurrentScreen("activeDelivery");
    setNotification("Pedido aceptado exitosamente");
    setNewOrderNotification(null);
  };

  const handleBackToMain = () => {
    setCurrentScreen("main");
    setSelectedOrder(null);
  };

  const toggleAvailability = () => {
    setIsOnline(!isOnline);
    setNotification(isOnline ? "Te has puesto fuera de línea" : "Ya estás disponible para recibir pedidos");
  };

  const handleViewNewOrder = (order) => {
    handleViewOrder(order);
  };

  const mainContent = () => {
    switch (currentScreen) {
      case "orderDetail":
        // Delegar la vista de detalle al propio PedidosTabRepartidor (ya maneja detalle internamente)
        return (
          <div className="p-4">
            {activeTab === "pedidos" && (
              <PedidosTabRepartidor
                onViewOrder={handleViewOrder}
                repartidorId={ID_REPARTIDOR}
                isOnline={isOnline}
                setNewOrderNotification={setNewOrderNotification}
              />
            )}
          </div>
        );
      case "activeDelivery":
        return (
          <ActiveDelivery
            order={activeDeliveryOrder}
            onComplete={() => {
              setCurrentScreen("main");
              setActiveDeliveryOrder(null);
              setNotification("Entrega completada exitosamente");
              setTodayStats((prev) => ({
                ...prev,
                deliveries: prev.deliveries + 1,
                earnings: prev.earnings + parseInt(activeDeliveryOrder?.total || 0)
              }));
            }}
            setNotification={setNotification}
          />
        );
      default:
        return (
          <div >
            {activeTab === "pedidos" && (
              <PedidosTabRepartidor
                onViewOrder={handleViewOrder}
                repartidorId={ID_REPARTIDOR}
                isOnline={isOnline}
                setNewOrderNotification={setNewOrderNotification}
              />
            )}
            {activeTab === "entregas" && <EntregasTab repartidorId={ID_REPARTIDOR} />}
            {activeTab === "rutas" && <RutasHorariosTab repartidorId={ID_REPARTIDOR} />}
            {activeTab === "perfil" && <PerfilTab repartidorId={ID_REPARTIDOR} />}
          </div>
        );
    }
  };

  const header = <Header isOnline={isOnline} onToggleAvailability={toggleAvailability} todayStats={todayStats} />
  const footer = (
    <div className="w-full bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto">
        <TabsRepartidor activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  )

  return (
    <AppMobileContainer header={header} footer={footer}>
      {mainContent()}
    </AppMobileContainer>
  )
}
