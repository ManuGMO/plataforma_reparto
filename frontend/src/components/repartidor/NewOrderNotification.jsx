export default function NewOrderNotification({ notification, onView, onDismiss }) {
  if (!notification) return null;

  return (
    <div className="fixed top-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">🚨 Nuevo pedido disponible</p>
          <p className="text-sm text-blue-100">
            {notification.pay} • {notification.distance} • {notification.restaurant}
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={onView}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Ver
          </button>
          <button 
            onClick={onDismiss}
            className="text-blue-100 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}