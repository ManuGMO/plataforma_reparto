// pages/administrador.jsx
import { useState } from "react";
import Sidebar from "../components/administrador/Sidebar";
import Dashboard from "../components/administrador/Dashboard";
import UsersManagement from "../components/administrador/UserManagement";
import SellersPayments from "../components/administrador/SellerPayments";
import DriversPayments from "../components/administrador/DriversPayments";
import WeeklyEarnings from "../components/administrador/WeeklyEarnings";
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
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
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
        {activeSection === 'earnings' && (
          <WeeklyEarnings setNotification={setNotification} />
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