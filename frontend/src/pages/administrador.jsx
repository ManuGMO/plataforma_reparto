// pages/administrador.jsx
import { useState } from "react";
import Sidebar from "../components/administrador/Sidebar";
import Dashboard from "../components/administrador/Dashboard";
import UsersManagement from "../components/administrador/UserManagement";
import SellersPayments from "../components/administrador/SellerPayments";
import DriversPayments from "../components/administrador/DriversPayments";
import Receipts from "../components/administrador/Receipts";
import Reports from "../components/administrador/Reports";
import Notification from "../components/Notification";

export default function Administrador() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [notification, setNotification] = useState('');


  const [driverPayments, setDriverPayments] = useState([

  ]);


  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 h-screen flex-shrink-0 bg-white shadow-lg border-r overflow-y-auto">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      </aside>
      
      <main className="flex-1 h-screen overflow-y-auto">
        {activeSection === 'dashboard' && <Dashboard />}
        {activeSection === 'users' && (
          <UsersManagement 
            setNotification={setNotification} 
          />
        )}
        {activeSection === 'sellers' && (
          <SellersPayments 
            setNotification={setNotification} 
          />
        )}
        {activeSection === 'drivers' && (
          <DriversPayments 
            payments={driverPayments} 
            setPayments={setDriverPayments} 
            setNotification={setNotification} 
          />
        )}
        {activeSection === 'receipts' && (
          <Receipts 
            setNotification={setNotification} 
          />
        )}

      </main>

      <Notification message={notification} onClose={() => setNotification('')} />
    </div>
  );
}