export default function HorarioTab({ repartidorId }) {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Mi Horario</h2>
        <p className="text-gray-600 text-sm">Define cuándo estás disponible para recibir pedidos</p>
      </div>
      
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏰</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin horarios configurados</h3>
        <p className="text-gray-500 text-sm">Agrega tu disponibilidad para optimizar las entregas</p>
      </div>
      
      <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
        + Agregar Horario
      </button>
    </div>
  );
}