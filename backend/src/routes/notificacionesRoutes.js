// routes/notificaciones.js
import express from 'express';
import { 
  obtenerNotificacionesUsuario, 
  obtenerNotificacionesNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas
} from '../controllers/notificacionController.js';

const router = express.Router();

router.get('/usuario/:id_usuario', obtenerNotificacionesUsuario);
router.get('/usuario/:id_usuario/no-leidas', obtenerNotificacionesNoLeidas);
router.put('/:id_notificacion/leer', marcarComoLeida);
router.put('/usuario/:id_usuario/leer-todas', marcarTodasComoLeidas);

export default router;