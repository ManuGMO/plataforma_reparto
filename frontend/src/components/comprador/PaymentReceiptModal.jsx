import { useState, useRef } from "react";

const DATOS_BANCARIOS = {
  banco: "Banco Estado",
  cuenta: "12345678-9",
  rut: "12.345.678-9",
  titular: "Nombre Apellido",
  tipo_cuenta: "Cuenta Corriente"
};

export default function PaymentReceiptModal({
  isOpen,
  onClose,
  onUploadReceipt,
  pedidoData,
  procesando = false
}) {



  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Limpiar estado cuando se cierre el modal
  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDragActive(false);
    onClose();
  };

  // Validar archivo
  const isValidFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert('❌ Solo se permiten archivos JPG, PNG o WebP');
      return false;
    }

    if (file.size > maxSize) {
      alert('❌ El archivo no puede ser mayor a 5MB');
      return false;
    }

    return true;
  };

  // Manejar selección de archivo
  const handleFileSelect = (file) => {
    if (!isValidFile(file)) return;

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Manejar cambio en input file
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Manejar drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  // Remover archivo seleccionado
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enviar comprobante
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('❌ Debes seleccionar un comprobante de pago');
      return;
    }

    try {
      await onUploadReceipt(selectedFile);
      handleClose();
    } catch (error) {
      console.error('Error al subir comprobante:', error);
      alert('❌ Error al subir el comprobante. Inténtalo nuevamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <div className="px-4 py-4 flex items-center">
            <button
              onClick={handleClose}
              disabled={procesando}
              className="mr-3 text-2xl hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition-all disabled:opacity-50"
            >
              ←
            </button>
            <h1 className="text-lg font-bold">Subir Comprobante de Pago</h1>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-4">

            {/* Información del pedido */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 mb-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-blue-500 mr-2">📋</span>
                Detalles del pedido
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total a pagar:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ${pedidoData?.carritoData?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-medium text-gray-900">
                    💳 Transferencia bancaria
                  </span>
                </div>
              </div>
            </div>

            {/* Información bancaria */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-4 mb-6 border border-yellow-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-orange-500 mr-2">🏦</span>
                Datos para transferencia
              </h3>
              <div className="space-y-2 text-sm font-mono bg-white rounded-lg p-3 border text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-600">Banco:</span>
                  <span className="font-medium">{DATOS_BANCARIOS.banco}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de cuenta:</span>
                  <span className="font-medium">{DATOS_BANCARIOS.tipo_cuenta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cuenta:</span>
                  <span className="font-medium">{DATOS_BANCARIOS.cuenta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">RUT:</span>
                  <span className="font-medium">{DATOS_BANCARIOS.rut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Titular:</span>
                  <span className="font-medium">{DATOS_BANCARIOS.titular}</span>
                </div>
              </div>
              <p className="text-xs text-orange-600 mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                Realiza la transferencia por el monto exacto: ${pedidoData?.carritoData?.total || 0}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Área de subida de archivo */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-green-500 mr-2">📸</span>
                  Subir comprobante de pago
                </h3>

                {!selectedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragActive
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                      }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Sube tu comprobante de pago
                    </p>

                    <div className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-all inline-flex items-center">
                      <span className="mr-2">📁</span>
                      Seleccionar archivo
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Máximo 5MB
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={previewUrl}
                          alt="Preview del comprobante"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <span className="mr-1">✅</span>
                          Archivo válido
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Vista previa ampliada */}
              {previewUrl && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-blue-500 mr-2">👁️</span>
                    Vista previa
                  </h4>
                  <div className="bg-white rounded-lg p-2 border">
                    <img
                      src={previewUrl}
                      alt="Vista previa del comprobante"
                      className="w-full max-h-64 object-contain rounded"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Verifica que el comprobante sea legible y muestre el monto correcto
                  </p>
                </div>
              )}



              {/* Botones */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={procesando}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-4 rounded-xl font-medium text-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando || !selectedFile}
                  className={`flex-1 py-4 rounded-xl font-medium transition-all duration-200 ${procesando || !selectedFile
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                    }`}
                >
                  {procesando ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Subiendo...
                    </span>
                  ) : (
                    "Enviar Comprobante"
                  )}
                </button>
              </div>


            </form>
          </div>
        </div>
      </div>
    </div>
  );
}