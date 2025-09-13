export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Usuario</h1>
            <p className="text-xs text-gray-500">Panel Vendedor</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
        </div>
      </div>
    </header>
  );
}
