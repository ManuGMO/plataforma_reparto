import React from 'react';

// AppMobileContainer: contenedor centralizado para layout móvil.
// Garantiza un ancho fijo en dispositivos móviles y mantiene header/main/footer
// con comportamiento de scroll consistente.
export default function AppMobileContainer({ header, footer, children, className = '' }) {
  // widthPx: ancho fijo sugerido (se usa como maxWidth, y width 100% para mantener responsividad)
  const widthPx = 410; // ancho razonable para dispositivo móvil (iPhone 12/13 ~ 390px)

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div
        className={`flex flex-col h-screen bg-white w-full overflow-hidden ${className}`}
        style={{ maxWidth: `${widthPx}px`, width: '100%', boxShadow: '0 0 0 rgba(0,0,0,0)' }}
      >
        {/* header slot */}
        {header}

        {/* main (scrollable) */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 min-h-full">{children}</div>
        </main>

        {/* footer slot (p. ej. tabs) */}
        {footer}
      </div>
    </div>
  );
}
