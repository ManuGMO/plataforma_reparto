import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from 'axios';
import LocationModal from "../components/common/LocationModal";
import Header from "../components/comprador/Header";
import PerfilTab from "../components/comprador/PerfilTab";
import TabsComprador from "../components/comprador/TabsComprador";
import ProductosTabComprador from "../components/comprador/ProductosTabComprador";
import CarritoTab from "../components/comprador/CarritoTab";
import PedidosTabComprador from "../components/comprador/PedidosTabComprador";
import CuentaTab from "../components/comprador/CuentaTab";
import Notification from "../components/Notification";
import AppMobileContainer from "../components/common/AppMobileContainer";

export default function Comprador() {
  const [activeTab, setActiveTab] = useState("productos");
  const [notification, setNotification] = useState("");
  
  const { user, isAuthenticated, updateUser } = useAuth();
  // ID del comprador obtenido del usuario autenticado
  const ID_COMPRADOR = user?.id;
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const noLoc = user.latitud == null || user.longitud == null;
    if (noLoc) setShowLocationModal(true);
  }, [user]);

  // Verificar notificaciones periódicamente
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        if (!ID_COMPRADOR) return; // aún no hay usuario
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/notificaciones/usuario/${ID_COMPRADOR}/no-leidas`);
        const notificaciones = await response.json();
        
        if (notificaciones.length > 0) {
          const ultimaNotificacion = notificaciones[0];
          setNotification(ultimaNotificacion.mensaje);
          
          // Marcar como leída después de mostrarla
          setTimeout(async () => {
            await fetch(`http://localhost:3001/api/notificaciones/${ultimaNotificacion.id_notificacion}/leer`, { 
              method: 'PUT' 
            });
          }, 5000); // Esperar 5 segundos antes de marcar como leída
        }
      } catch (error) {
        console.error("Error al verificar notificaciones:", error);
      }
    };

    // Verificar inmediatamente
    checkNotifications();
    
    // Verificar cada 10 segundos
    const interval = setInterval(checkNotifications, 10000);
    
    return () => clearInterval(interval);
  }, [ID_COMPRADOR]);

  const header = <Header onOpenProfile={() => setActiveTab('perfil')} />
  const footer = (
    <div className="w-full bg-white border-t border-gray-200">
      <TabsComprador activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )

  return (
    <AppMobileContainer header={header} footer={footer}>
      {activeTab === "productos" && (
        <ProductosTabComprador setNotification={setNotification} CompradorID={ID_COMPRADOR} />
      )}
      {activeTab === "carrito" && <CarritoTab setNotification={setNotification} CompradorID={ID_COMPRADOR} />}
      {activeTab === "pedidos" && <PedidosTabComprador CompradorID={ID_COMPRADOR} />}
      {activeTab === "cuenta" && <CuentaTab CompradorID={ID_COMPRADOR} />}
      {activeTab === 'perfil' && <PerfilTab onSaved={(loc) => setNotification('Ubicación guardada')} onBack={() => setActiveTab('productos')} />}
      {showLocationModal && (
        <LocationModal
          initial={null}
          onClose={() => setShowLocationModal(false)}
          onSave={async (loc) => {
            try {
              await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/usuarios/${ID_COMPRADOR}/ubicacion`, { latitud: loc.lat, longitud: loc.lng });
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

      <Notification message={notification} onClose={() => setNotification("")} />
    </AppMobileContainer>
  )
}