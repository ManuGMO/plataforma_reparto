import { useState, useEffect } from "react";
import Header from "./Header";

export default function Sidebar({ activeSection, setActiveSection }) {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'users', icon: '👥', label: 'Gestión de Usuarios' },
    { id: 'sellers', icon: '🏪', label: 'Pagos Vendedores' },
    { id: 'drivers', icon: '🚲', label: 'Pagos Repartidores' },
    { id: 'earnings', icon: '💰', label: 'Ganancias Semanales' },
    { id: 'receipts', icon: '🧾', label: 'Comprobantes' }
  ];
  
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const v = localStorage.getItem('sidebarCollapsed');
      return v ? JSON.parse(v) : false;
    } catch (e) { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed)); } catch (e) {}
  }, [collapsed]);

  return (
    <aside className={`relative bg-white shadow-lg border-r flex flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between px-2 py-2 border-b">
        <div className="flex items-center">
          <Header collapsed={collapsed} />
        </div>
      </div>
      {/* Toggle button: positioned to the right edge of the sidebar (outside) and white background */}
      <button
        aria-label={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        onClick={(e) => { e.stopPropagation(); setCollapsed(prev => !prev); }}
        className="absolute top-4 -right-3 z-30 w-8 h-8 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
          {collapsed ? (
            // chevron-right SVG (expandir)
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="black" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
        ) : (
          // Panel collapse left SVG (contraer)
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-gray-700">
            <path d="M9 13L9 10H16V6L9 6L9 3L8 3L3 8L8 13H9Z" />
            <path d="M2 14L2 2L0 2L5.24537e-07 14H2Z" />
          </svg>
        )}
      </button>

      <nav className={`flex-1 ${collapsed ? 'px-1' : 'p-4'}`}>
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left ${collapsed ? 'px-2 py-3' : 'px-4 py-3'} rounded-lg flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} transition-all bg-white text-black ${
                  activeSection === item.id
                    ? 'border-r-3 border-blue-600 bg-blue-100'
                    : 'hover:bg-gray-100 hover:translate-x-1'
                }`}
              >
                <span className="text-lg text-black">{item.icon}</span>
                {!collapsed && <span className="font-medium text-black">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className={`p-4 border-t bg-white ${collapsed ? 'flex items-center justify-center' : ''}`}>
        <div className={`flex items-center space-x-3 ${collapsed ? 'flex-col' : ''}`}>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm">👤</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium text-gray-900">Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}