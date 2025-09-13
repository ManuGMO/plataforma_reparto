import { useState } from "react";
import axios from "axios";

export default function BlockModal({ repartidor, onClose, idUsuario, onBlockSuccess }) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    if (!motivo.trim()) {
      alert("Por favor, ingresa un motivo para el bloqueo.");
      return;
    }

    try {
      setLoading(true);
      
      console.log("Enviando bloqueo:", {
        id_repartidor: repartidor.id_usuario,
        id_bloqueador: idUsuario,
        motivo: motivo.trim()
      });

      // Arreglé la URL - quitando el :id del endpoint
      const response = await axios.post(`http://localhost:3001/api/repartidores/bloquear/${repartidor.id_usuario}`, {
        id_bloqueador: idUsuario,
        motivo: motivo.trim(),
      });

      console.log("Respuesta del bloqueo:", response.data);
      
      alert(`Se bloqueó exitosamente a ${repartidor.nombre}`);
      
      // Llamar callback para actualizar la lista con el motivo
      if (onBlockSuccess) {
        onBlockSuccess(repartidor.id_usuario, motivo.trim());
      } else {
        onClose();
      }
      
    } catch (error) {
      console.error("Error al bloquear repartidor:", error);
      
      let errorMessage = "Error al bloquear.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar modal con Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
      onClick={onClose} // Cerrar al hacer clic fuera
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-lg p-6 w-96 shadow-lg max-w-md mx-4"
        onClick={(e) => e.stopPropagation()} // Evitar cerrar al hacer clic dentro
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Bloquear a {repartidor?.nombre || "Usuario"}
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo del bloqueo:
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describe el motivo del bloqueo..."
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            rows={4}
            maxLength={500}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {motivo.length}/500 caracteres
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleBlock}
            disabled={loading || !motivo.trim()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Bloqueando...
              </>
            ) : (
              "Confirmar 🚫"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}