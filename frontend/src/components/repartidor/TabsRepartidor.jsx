export default function TabsRepartidor({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'pedidos', label: 'Pedidos', icon: '📋' },
    { id: 'entregas', label: 'Entregas', icon: '🚲' },
    { id: 'rutas', label: 'Rutas', icon: '🛣️' },
    { id: 'perfil', label: 'Perfil', icon: '👤' }
  ];

  return (
    <nav className="px-4  bg-white border-b">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 text-center text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-gray-500 bg-white"
              }`}
            >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}