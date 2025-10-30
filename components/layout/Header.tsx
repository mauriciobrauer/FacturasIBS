export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            <span className="hidden sm:inline">Sincronización de Facturas IBS</span>
            <span className="sm:hidden">Facturas IBS</span>
          </h1>
        </div>
      </div>
    </header>
  );
}
