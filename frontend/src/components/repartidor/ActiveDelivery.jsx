import { useState } from 'react';

export default function ActiveDelivery({ order, onComplete, setNotification }) {
  const [currentStep, setCurrentStep] = useState(2); // 1: Aceptado, 2: Recoger, 3: Entregar

  if (!order) return null;

  const vendorName = order.Vendedor?.[0]?.nombre || 'Restaurante';
  const customerName = order.Comprador?.[0]?.nombre || 'Cliente';

  const steps = [
    { id: 1, label: 'Aceptado', icon: '✓' },
    { id: 2, label: 'Recoger', icon: '2' },
    { id: 3, label: 'Entregar', icon: '3' }
  ];

  const getCurrentAction = () => {
    switch (currentStep) {
      case 2:
        return {
          text: `Dirígete a recoger el pedido en ${vendorName}`,
          address: 'Av. Principal 123',
          button: '📦 Confirmar Recogida'
        };
      case 3:
        return {
          text: `Entregar pedido a ${customerName}`,
          address: order.direccion || 'Dirección del cliente',
          button: '✅ Confirmar Entrega'
        };
      default:
        return {
          text: 'Entrega completada',
          address: '',
          button: 'Finalizar'
        };
    }
  };

  const handleCompleteStep = async () => {
    if (currentStep === 2) {
      // Confirmar recogida
      try {
        await fetch(`http://localhost:3001/api/pedidos/${order.id_pedido}/estado`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'en_reparto' })
        });
        setCurrentStep(3);
        setNotification('Pedido recogido. Dirígete a la entrega');
      } catch (error) {
        console.error('Error al actualizar estado:', error);
        setNotification('Error al confirmar recogida');
      }
    } else if (currentStep === 3) {
      // Confirmar entrega
      try {
        await fetch(`http://localhost:3001/api/pedidos/${order.id_pedido}/estado`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'entregado' })
        });
        onComplete();
      } catch (error) {
        console.error('Error al completar entrega:', error);
        setNotification('Error al confirmar entrega');
      }
    }
  };

  const contactSeller = () => {
    setNotification('Función de llamada no implementada');
  };

  const contactCustomer = () => {
    setNotification('Función de llamada no implementada');
  };

  const reportProblem = () => {
    setNotification('Función de reporte no implementada');
  };

  const currentAction = getCurrentAction();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Entrega en Progreso</h1>
              <p className="text-green-100 text-sm">Pedido #{order.id_pedido}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${order.total}</p>
              <p className="text-green-100 text-sm">2.3 km</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="p-4 space-y-6">
        {/* Progress Steps */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id}>
                <div className="step-item flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.id <= currentStep 
                        ? step.id === 1 
                          ? 'bg-green-600 text-white' 
                          : step.id === currentStep 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step.id <= currentStep && step.id !== currentStep ? '✓' : step.icon}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step.id < currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`} style={{width: '50px'}}></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Current Action */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Siguiente paso:</h3>
          <p className="text-blue-800">{currentAction.text}</p>
          {currentAction.address && (
            <p className="text-sm text-blue-600 mt-1">📍 {currentAction.address}</p>
          )}
        </div>
        
        {/* Contact Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={contactSeller}
            className="bg-white border border-gray-300 rounded-lg p-3 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
          >
            <span>📞</span>
            <span className="font-medium">Llamar Vendedor</span>
          </button>
          <button 
            onClick={contactCustomer}
            className="bg-white border border-gray-300 rounded-lg p-3 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
          >
            <span>📞</span>
            <span className="font-medium">Llamar Cliente</span>
          </button>
        </div>
        
        {/* Action Button */}
        <button 
          onClick={handleCompleteStep}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
        >
          {currentAction.button}
        </button>
        
        {/* Emergency Button */}
        <button 
          onClick={reportProblem}
          className="w-full bg-red-100 text-red-700 py-3 rounded-lg font-medium border border-red-200 hover:bg-red-200 transition-colors"
        >
          ⚠️ Reportar Problema
        </button>
      </div>
    </div>
  );
}