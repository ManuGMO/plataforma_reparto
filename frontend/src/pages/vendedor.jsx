// src/pages/Vendedor.jsx
import { useState } from "react";
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

export default function Vendedor() {
  const [activeTab, setActiveTab] = useState("productos");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [notification, setNotification] = useState("");
  const [refreshProducts, setRefreshProducts] = useState(0);

  const ID_VENDEDOR = 1;

  const handleProductAdded = () => {
    setRefreshProducts(prev => prev + 1);
    setProductModalOpen(false); 
    setNotification("Producto agregado correctamente"); // ← Muestra notificación
  };

  const header = <Header />
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
      {activeTab === "repartidores" && <RepartidoresTab openBlockModal={() => setBlockModalOpen(true)} />}
      {activeTab === "finanzas" && <FinanzasTab />}

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
