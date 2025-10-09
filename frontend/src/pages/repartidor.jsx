import { useState, useEffect } from "react";
import Header from "../components/repartidor/Header";
import TabsRepartidor from "../components/repartidor/TabsRepartidor";
import PedidosTabRepartidor from "../components/repartidor/PedidosTabRepartidor";
import EntregasTab from "../components/repartidor/EntregasTab";
import RutasHorariosTab from "../components/repartidor/RutasHorariosTab";
import PerfilTab from "../components/repartidor/PerfilTab";
import OrderDetail from "../components/repartidor/OrderDetail";
import ActiveDelivery from "../components/repartidor/ActiveDelivery";
import Notification from "../components/Notification";
import NewOrderNotification from "../components/repartidor/NewOrderNotification";

export default function Repartidor() {
  const [activeTab, setActiveTab] = useState("pedidos");
  const [currentScreen, setCurrentScreen] = useState("main"); // main, orderDetail, activeDelivery
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState(null);
  const [notification, setNotification] = useState("");
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [todayStats, setTodayStats] = useState({ earnings: 0, deliveries: 0, rating: 4.8 });

  const ID_REPARTIDOR = 3;

  useEffect(() => {
    const loadTodayStats = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/repartidor/${ID_REPARTIDOR}/estadisticas/hoy`);
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

  const renderScreen = () => {
    switch (currentScreen) {
      case "orderDetail":
        return <OrderDetail order={selectedOrder} onBack={handleBackToMain} onAccept={handleAcceptOrder} />;
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
          <div className="flex flex-col h-screen bg-gray-50">
            <Header isOnline={isOnline} onToggleAvailability={toggleAvailability} todayStats={todayStats} />
            <main className="flex-1 overflow-y-auto w-full">
              <div className="max-w-md mx-auto bg-gray-50 min-h-full">
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
            </main>
            <div className="w-full bg-white border-t border-gray-200">
              <div className="max-w-md mx-auto">
                <TabsRepartidor activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderScreen()}

    </>
  );
}
