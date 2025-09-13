import { useState, useEffect } from "react";
import Header from "../components/comprador/Header";
import TabsComprador from "../components/comprador/TabsComprador";
import ProductosTabComprador from "../components/comprador/ProductosTabComprador";
import CarritoTab from "../components/comprador/CarritoTab";
import PedidosTabComprador from "../components/comprador/PedidosTabComprador";
import CuentaTab from "../components/comprador/CuentaTab";
import Notification from "../components/Notification";

export default function Comprador() {
  const [activeTab, setActiveTab] = useState("productos");
  const [notification, setNotification] = useState("");
  
  // ID del comprador (actualmente hardcodeado)
  const ID_COMPRADOR = 2;

  // Verificar notificaciones periódicamente
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/notificaciones/usuario/${ID_COMPRADOR}/no-leidas`);
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-md mx-auto bg-gray-50 min-h-full">
          {activeTab === "productos" && (
            <ProductosTabComprador setNotification={setNotification} />
          )}
          {activeTab === "carrito" && <CarritoTab setNotification={setNotification} />}
          {activeTab === "pedidos" && <PedidosTabComprador />}
          {activeTab === "cuenta" && <CuentaTab />}
        </div>
      </main>
     
      <div className="w-full bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <TabsComprador activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
     
      <Notification message={notification} onClose={() => setNotification("")} />
    </div>
  );
}