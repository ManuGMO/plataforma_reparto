import { useState, useEffect } from "react";

export default function Notification({ message, onClose, type = "success", duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsClosing(false);
      
      // Auto-cerrar después del duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [message, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // Tiempo para la animación de salida
  };

  if (!message || !isVisible) return null;

  // Configurar estilos según el tipo de notificación
  const getNotificationStyles = () => {
    const baseStyles = "fixed top-5 right-5 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm transition-all duration-300";
    
    const typeStyles = {
      success: "bg-green-600 text-white",
      error: "bg-red-600 text-white", 
      warning: "bg-yellow-500 text-white",
      info: "bg-blue-600 text-white",
      pedido: "bg-purple-600 text-white" // Para notificaciones de pedidos
    };

    const animationStyles = isClosing 
      ? "transform translate-x-full opacity-0" 
      : "transform translate-x-0 opacity-100";

    return `${baseStyles} ${typeStyles[type]} ${animationStyles}`;
  };

  const getIcon = () => {
    const icons = {
      success: "✓",
      error: "✕", 
      warning: "⚠",
      info: "ℹ",
      pedido: "🔔"
    };
    return icons[type];
  };

  return (
    <div className={getNotificationStyles()}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <span className="text-lg mr-2">{getIcon()}</span>
          <span className="flex-1">{message}</span>
        </div>
        <button 
          onClick={handleClose}
          className="ml-3 text-white hover:text-gray-200 transition-colors flex-shrink-0"
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Componente adicional para mostrar múltiples notificaciones si es necesario
export function NotificationManager({ notifications, onRemove }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <Notification
          key={notification.id || index}
          message={notification.message}
          type={notification.type || "info"}
          onClose={() => onRemove(notification.id || index)}
          duration={notification.duration || 5000}
        />
      ))}
    </div>
  );
}