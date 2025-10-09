export default function Reports() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
        <p className="text-gray-600">Análisis y estadísticas de la plataforma</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por Mes</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {[60, 80, 45, 90, 70, 85].map((height, idx) => (
              <div
                key={idx}
                className="bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${height}%`, width: '12%' }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Ene</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Abr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento de Usuarios</h3>
          <div className="space-y-4">
            {[
              { label: 'Compradores', value: 847, width: 75, color: 'bg-blue-600' },
              { label: 'Vendedores', value: 234, width: 45, color: 'bg-green-600' },
              { label: 'Repartidores', value: 166, width: 30, color: 'bg-purple-600' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.label}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${item.width}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}