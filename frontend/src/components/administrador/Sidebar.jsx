import { useState } from "react";
import Header from "./Header";

export default function Sidebar({ activeSection, setActiveSection }) {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'users', icon: '👥', label: 'Gestión de Usuarios' },
    { id: 'sellers', icon: '🏪', label: 'Pagos Vendedores' },
    { id: 'drivers', icon: '🚚', label: 'Pagos Repartidores' },
    { id: 'receipts', icon: '🧾', label: 'Comprobantes' }
  ];

  return (
    <aside className="w-64 bg-white shadow-lg border-r flex flex-col">
      <Header />
      
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-all bg-white text-black ${
                  activeSection === item.id
                    ? 'border-r-3 border-blue-600 bg-blue-100'
                    : 'hover:bg-gray-100 hover:translate-x-1'
                }`}
              >
                <span className="text-lg text-black">{item.icon}</span>
                <span className="font-medium text-black">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm">👤</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}