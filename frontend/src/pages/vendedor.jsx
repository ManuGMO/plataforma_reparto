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

  useEffect(() => {
    if (!user) return;
    const noLoc = user.latitud == null || user.longitud == null;
    if (noLoc) setShowLocationModal(true);
  }, [user]);

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
      {activeTab === "productos" && <ProductosTab openModal={() => setProductModalOpen(true)} refreshTrigger={refreshProducts}/>}
  {/* por ahora usamos vendorId=1 como id del vendedor en este entorno local */}
  {activeTab === "pedidos" && <PedidosTab setNotification={setNotification} vendorId={ID_VENDEDOR} />}
      {activeTab === "repartidores" && <RepartidoresTab idUsuario={ID_VENDEDOR} openBlockModal={() => setBlockModalOpen(true) } />}
      {activeTab === "finanzas" && <FinanzasTab idUsuario={ID_VENDEDOR} />}
      {activeTab === "perfil" && <PerfilTab onSaved={(loc) => setNotification('Ubicación guardada')} onBack={() => setActiveTab('productos')} />}
      {showLocationModal && (
        <LocationModal
          initial={null}
          onClose={() => setShowLocationModal(false)}
          onSave={async (loc) => {
            try {
              await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/usuarios/${ID_VENDEDOR}/ubicacion`, { latitud: loc.lat, longitud: loc.lng });
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
