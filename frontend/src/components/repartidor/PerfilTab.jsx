import { useState } from 'react';

export default function PerfilTab({ repartidorId }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profile] = useState({
    name: "Repartidor",
    email: "Contacto",
    rating: 4.8,
    totalDeliveries: 0
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Mi Perfil</h2>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🚴</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-gray-600">{profile.email}</p>
            <p className="text-sm text-yellow-600">⭐ {profile.rating} ({profile.totalDeliveries} entregas)</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
      
        
    
      </div>
    </div>
  );
}