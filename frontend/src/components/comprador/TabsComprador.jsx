export default function TabsComprador({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "productos", label: "Inicio", icon: "🏠" },
    { id: "pedidos", label: "Pedidos", icon: "📋" },
    { id: "carrito", label: "Carrito", icon: "🛒" },
    { id: "compras", label: "Compras", icon: "🛍️" },
  ];

  return (
    <nav className="bg-white border-b">
      <div className="max-w-md mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 stext-center text-sm font-medium border-b-2 ${activeTab === tab.id
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-gray-500 bg-white"
                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
