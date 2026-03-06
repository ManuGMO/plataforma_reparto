import { useState, useEffect } from "react";
import axios from "axios";
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
  const ID_REPARTIDOR = user?.id_usuario || user?.id;

  const API_URL = import.meta.env.VITE_API_URL;

  // Polling de notificaciones
  useEffect(() => {
    if (!ID_REPARTIDOR) return;

    const checkNotifications = async () => {
      try {
        // Consultar notificaciones filtrando por rol=repartidor
        const res = await axios.get(`${API_URL}/api/notificaciones/usuario/${ID_REPARTIDOR}/no-leidas?rol=repartidor`);
        const notificaciones = res.data;

        if (notificaciones && notificaciones.length > 0) {
          const ultima = notificaciones[0];
          console.log("🔔 Nueva notificación repartidor:", ultima.titulo);

          // Mostrar notificación
          setNotification(ultima.mensaje);

          // Si es un pedido nuevo, tal vez queramos usar el componente especial NewOrderNotification
          // Por ahora, usaremos la notificación genérica y marcaremos como leída

          await Promise.all(notificaciones.map(n =>
            axios.put(`${API_URL}/api/notificaciones/${n.id_notificacion}/leer`)
          ));
        }
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    checkNotifications();
    const intervalId = setInterval(checkNotifications, 15000); // Cada 15s

    return () => clearInterval(intervalId);
  }, [ID_REPARTIDOR]);

  useEffect(() => {
    const loadTodayStats = async () => {
      try {
        if (!ID_REPARTIDOR) return;
        const response = await fetch(`${API_URL}/api/repartidor/${ID_REPARTIDOR}/estadisticas/hoy`);
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
      <Notification
        message={notification}
        onClose={() => setNotification("")}
      />
    </AppMobileContainer>
  )
}
