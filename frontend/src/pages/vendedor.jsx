// src/pages/Vendedor.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from 'axios';
import LocationModal from "../components/common/LocationModal";
import Header from "../components/vendedor/Header";
import Tabs from "../components/vendedor/Tabs";
import ProductosTab from "../components/vendedor/ProductosTab";
import PedidosTab from "../components/vendedor/PedidosTab";
import RepartidoresTab from "../components/vendedor/RepartidoresTab";
import FinanzasTab from "../components/vendedor/FinanzasTab";
import ProductModal from "../components/vendedor/ProductModal";
import BlockModal from "../components/vendedor/BlockModal";
import Notification from "../components/Notification";
import AppMobileContainer from "../components/common/AppMobileContainer";
import PerfilTab from "../components/vendedor/PerfilTab";

export default function Vendedor() {
  const [activeTab, setActiveTab] = useState("productos");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [notification, setNotification] = useState("");
  const [refreshProducts, setRefreshProducts] = useState(0);

  const { user, updateUser } = useAuth();
  const ID_VENDEDOR = user?.id;
  const [showLocationModal, setShowLocationModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!user) return;
    const noLoc = user.latitud == null || user.longitud == null;
    if (noLoc) setShowLocationModal(true);
  }, [user]);

  // Polling de notificaciones
  useEffect(() => {
    if (!ID_VENDEDOR) return;

    const checkNotifications = async () => {
      try {
        // Filtramos por rol=vendedor para evitar ver notificaciones de otros roles (ej: si soy también comprador)
        const res = await axios.get(`${API_URL}/api/notificaciones/usuario/${ID_VENDEDOR}/no-leidas?rol=vendedor`);
        const notificaciones = res.data;

        if (notificaciones && notificaciones.length > 0) {
          // Mostrar la más reciente
          const ultima = notificaciones[0];
          setNotification(ultima.mensaje); // Usa el componente Notification existente

          // Marcar como leídas para que no salgan de nuevo en el próximo poll
          // (Idealmente se hace una por una o un endpoint bulk, aquí usamos un truco simple mark-all o loop)
          await Promise.all(notificaciones.map(n =>
            axios.put(`${API_URL}/api/notificaciones/${n.id_notificacion}/leer`)
          ));

          // Si la notificación es sobre un nuevo pedido, refrescar la lista de pedidos
          if (ultima.tipo === 'pedido_nuevo' && activeTab === 'pedidos') {
            // Forzamos update a PedidosTab pasando una prop nueva o usando contexto, pero
            // como PedidosTab tiene su propio useEffect, tal vez necesitemos un trigger.
            // Por ahora, confiamos en que el usuario recargue o el componente lo maneje.
            // Una mejora seria pasar una prop 'lastUpdate' a PedidosTab.
          }
        }
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    // Revisar inmediatamente y luego cada 15 segundos
    checkNotifications();
    const intervalId = setInterval(checkNotifications, 15000);

    return () => clearInterval(intervalId);
  }, [ID_VENDEDOR, activeTab]);

  const handleProductAdded = () => {
    setRefreshProducts(prev => prev + 1);
    setProductModalOpen(false);
    setNotification("Producto agregado correctamente"); // ← Muestra notificación
  };

  const header = <Header onOpenProfile={() => setActiveTab('perfil')} />
  const footer = (
    <div className="w-full bg-white border-t border-gray-200">
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )

  return (
    <AppMobileContainer header={header} footer={footer}>
      {activeTab === "productos" && <ProductosTab idUsuario={ID_VENDEDOR} openModal={() => setProductModalOpen(true)} refreshTrigger={refreshProducts} />}
      {/* por ahora usamos vendorId=1 como id del vendedor en este entorno local */}
      {activeTab === "pedidos" && <PedidosTab setNotification={setNotification} vendorId={ID_VENDEDOR} />}
      {activeTab === "repartidores" && <RepartidoresTab idUsuario={ID_VENDEDOR} openBlockModal={() => setBlockModalOpen(true)} />}
      {activeTab === "finanzas" && <FinanzasTab idUsuario={ID_VENDEDOR} />}
      {activeTab === "perfil" && <PerfilTab onSaved={(loc) => setNotification('Ubicación guardada')} onBack={() => setActiveTab('productos')} />}
      {showLocationModal && (
        <LocationModal
          initial={null}
          onClose={() => setShowLocationModal(false)}
          onSave={async (loc) => {
            try {
              await axios.put(`${API_URL}/api/usuarios/${ID_VENDEDOR}/ubicacion`, { latitud: loc.lat, longitud: loc.lng });
              updateUser({ latitud: loc.lat, longitud: loc.lng });
              setShowLocationModal(false);
              setNotification('Ubicación guardada');
            } catch (err) {
              console.error('Error saving location from modal', err);
              alert('Error al guardar ubicación');
            }
          }}
        />
      )}

      <ProductModal
        idUsuario={ID_VENDEDOR}
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onProductAdded={handleProductAdded}
      />

      <Notification
        message={notification}
        onClose={() => setNotification("")}
      />
    </AppMobileContainer>
  )
}
