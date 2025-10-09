export default function Header() {
  return (
    <div className="p-6 border-b bg-white">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">⚙️</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">MercadoLocal</h1>
          <p className="text-sm text-gray-600">Panel Admin</p>
        </div>
      </div>
    </div>
  );
}
