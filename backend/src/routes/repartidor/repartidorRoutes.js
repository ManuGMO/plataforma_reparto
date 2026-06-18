// routes/repartidorRoutes.js
import express from 'express';
import { 
  getPedidosDisponibles, 
  aceptarPedido, 
  getEntregasRepartidor,
  getEstadisticasRepartidor,
  obtenerPedidosDisponibles,
  confirmarEntrega,
  confirmarRecogida, 
  getPedidosActivos,
  cancelarPedido,
  actualizarUbicacionRepartidor
} from '../../controllers/repartidor/repartidorController.js';



const router = express.Router();

// Obtener pedidos disponibles para un repartidor
router.get('/pedidos/disponibles', obtenerPedidosDisponibles);

router.get('/pedidos/disponibles/:repartidorId', getPedidosDisponibles);

// Obtener pedidos activos de un repartidor
router.get('/:repartidorId/pedidos-activos', getPedidosActivos);

// Aceptar un pedido como repartidor
//router.put('/pedidos/:pedidoId/aceptar-repartidor', aceptarPedido);

// Aceptar pedido para reparto
router.post('/:pedidoId/aceptar', aceptarPedido);

// Confirmar recogida del pedido
router.patch('/:pedidoId/recoger', confirmarRecogida);

// Confirmar entrega del pedido
router.patch('/:pedidoId/entregar', confirmarEntrega);

// Actualizar ubicación en tiempo real del repartidor
router.patch('/:pedidoId/ubicacion-repartidor', actualizarUbicacionRepartidor);

// Cancelar pedido por parte del repartidor
router.put('/pedidos/:pedidoId/cancelar-repartidor', cancelarPedido);

// Obtener entregas de un repartidor con filtros
router.get('/:repartidorId/entregas', getEntregasRepartidor);

// Obtener estadísticas del repartidor
router.get('/:repartidorId/estadisticas/:periodo', getEstadisticasRepartidor);

export default router;