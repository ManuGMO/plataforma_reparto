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

export default function Vendedor() {
  const [activeTab, setActiveTab] = useState("productos");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [notification, setNotification] = useState("");
  const [refreshProducts, setRefreshProducts] = useState(0);

  const handleProductAdded = () => {
    setRefreshProducts(prev => prev + 1);
    setProductModalOpen(false); 
    setNotification("Producto agregado correctamente"); // ← Muestra notificación
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-md mx-auto bg-white min-h-full">
          {activeTab === "productos" && <ProductosTab openModal={() => setProductModalOpen(true)} refreshTrigger={refreshProducts}/>}
          {activeTab === "pedidos" && <PedidosTab setNotification={setNotification} />}
          {activeTab === "repartidores" && <RepartidoresTab openBlockModal={() => setBlockModalOpen(true)} />}
          {activeTab === "finanzas" && <FinanzasTab />}
        </div>
      </main>

      <div className="w-full bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onProductAdded={handleProductAdded}
      />
      
      <Notification 
        message={notification} 
        onClose={() => setNotification("")} 
      />
    </div>
  );
}
