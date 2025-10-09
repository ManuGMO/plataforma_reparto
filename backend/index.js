import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {sequelize} from './src/config/db.js';
import db from './src/models/indexModels.js';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Configuración inicial
dotenv.config();
const app = express();
const PORT = process.env.BACK_PORT;

// Sincronizar la base de datos
await db.sequelize.sync();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta básica
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando 🚀' });
});

// Inicialización del servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    app.listen(PORT, () => {
      console.log(`🚀Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

import productosRoutes from "./src/routes/vendedor/productosRoutes.js";
import pedidosRoutes from "./src/routes/vendedor/pedidosRoutes.js";
import ValorarRepartidores from "./src/routes/vendedor/repartidorRoutes.js";
import verFinanzas from "./src/routes/vendedor/finanzasRoutes.js";

import pedidoRoutes from "./src/routes/comprador/pedidosRoutes.js";
import productoRoutes from "./src/routes/comprador/productoRoutes.js";
import carritoRoutes from "./src/routes/comprador/carritoRoutes.js";

import notificacionesRoutes from "./src/routes/notificacionesRoutes.js";
import usuarioRoutes from "./src/routes/usuarioRoutes.js";

import repartidorRoutes from './src/routes/repartidor/repartidorRoutes.js';
import rutaRoutes from './src/routes/repartidor/rutaRoutes.js';

import comprobanteRoutes from "./src/routes/administrador/comprobanteRoutes.js";
import pagosVendedorRoutes from "./src/routes/administrador/pagosVendedorRoutes.js";
import pagosRepartidorRoutes from "./src/routes/administrador/pagosRepartidorRoutes.js";
import usuariosRoutes from "./src/routes/administrador/usuariosRoutes.js";
import dashboardRoutes from "./src/routes/administrador/dashboardRoutes.js";



app.use("/api/usuarios", usuarioRoutes);

// vendedor
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/productos", productosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/repartidores", ValorarRepartidores);
app.use("/api/finanzas", verFinanzas);

// Comprador
app.use("/api/pedidos/comprador", pedidoRoutes);
app.use("/api/productos/comprador", productoRoutes);
app.use("/api/carrito/comprador", carritoRoutes);


// Repartidor
app.use("/api/repartidor", repartidorRoutes);
app.use("/api/rutas", rutaRoutes);

//administrador
app.use("/api/admin/comprobantes", comprobanteRoutes);
app.use("/api/admin/pagos-vendedores", pagosVendedorRoutes);
app.use("/api/admin/pagos-repartidores", pagosRepartidorRoutes);
app.use("/api/admin/usuarios", usuariosRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);


// Notificacion
app.use("/api/notificaciones", notificacionesRoutes);



startServer();