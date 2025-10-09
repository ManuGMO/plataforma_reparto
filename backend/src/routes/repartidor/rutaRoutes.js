import { Router } from "express";
import {
  getRutasPorRepartidor,
  crearRuta,
  actualizarRuta,
  eliminarRuta,
  getRutasActivas
} from "../../controllers/repartidor/rutaController.js";

const router = Router();


router.get("/:repartidorId", getRutasPorRepartidor);
router.post("/", crearRuta);
router.put("/:idRuta", actualizarRuta);
router.delete("/:idRuta", eliminarRuta);
router.get("/activas/:repartidorId/:dia/:hora", getRutasActivas);

export default router;