export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="w-full px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">🛒</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Comprador</h1>
              <p className="text-xs text-gray-500">📍 Ubicación</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
      </div>
    </header>
  );
}