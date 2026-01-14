import { Sequelize } from 'sequelize';
import { sequelize } from '../config/db.js';
import UsuarioModel from './Usuario.js';
import RolModel from './Rol.js';
import Usuario_RolModel from './Usuario_Rol.js';
import EmpresaModel from './Empresa.js';
import TiendaModel from './Tienda.js';
import atiendeModel from './atiende.js';
import CategoriaModel from './Categoria.js';
import ProductoModel from './Producto.js';
import CarritoModel from './Carrito.js';
import Carrito_ProductoModel from './Carrito_Producto.js';
import PedidoModel from './Pedido.js';
import Producto_PedidoModel from './Producto_Pedido.js';
import pedido_vendedorModel from './pedido_vendedor.js';
import pedido_compradorModel from './pedido_comprador.js';
import pedido_repartidorModel from './pedido_repartidor.js';
import CalificacionModel from './Calificacion.js';
import Ruta_frecuenteModel from './Ruta_frecuente.js';
import BloqueoModel from './Bloqueo.js';
import ValoracionModel from './Valoracion.js';
import Boleta_HonorariosModel from './Boleta_Honorarios.js';
import LiquidacionModel from './Liquidacion.js';
import NotificacionModel from './Notificacion.js'; // AGREGAR ESTA LÍNEA

const sequelize_instance = sequelize;
const db = {};

// Inicializar todos los modelos
db.Usuario = UsuarioModel(sequelize_instance);
db.Rol = RolModel(sequelize_instance);
db.Usuario_Rol = Usuario_RolModel(sequelize_instance);
db.Empresa = EmpresaModel(sequelize_instance);
db.Tienda = TiendaModel(sequelize_instance);
db.atiende = atiendeModel(sequelize_instance);
db.Categoria = CategoriaModel(sequelize_instance);
db.Producto = ProductoModel(sequelize_instance);
db.Carrito = CarritoModel(sequelize_instance);
db.Carrito_Producto = Carrito_ProductoModel(sequelize_instance);
db.Pedido = PedidoModel(sequelize_instance);
db.Producto_Pedido = Producto_PedidoModel(sequelize_instance);
db.pedido_vendedor = pedido_vendedorModel(sequelize_instance);
db.pedido_comprador = pedido_compradorModel(sequelize_instance);
db.pedido_repartidor = pedido_repartidorModel(sequelize_instance);
db.Calificacion = CalificacionModel(sequelize_instance);
db.Ruta_frecuente = Ruta_frecuenteModel(sequelize_instance);
db.Bloqueo = BloqueoModel(sequelize_instance);
db.Valoracion = ValoracionModel(sequelize_instance);
// Intercambio de nombres: el modelo que antes era 'Liquidacion' será referenciado en el código como 'Boleta_Honorarios'
// y el que antes era 'Boleta_Honorarios' será referenciado como 'Liquidacion'. Esto mantiene las tablas y columnas
// pero cambia los identificadores usados en los controladores.
db.Boleta_Honorarios = Boleta_HonorariosModel(sequelize_instance);
db.Liquidacion = LiquidacionModel(sequelize_instance);
db.Notificacion = NotificacionModel(sequelize_instance); // AGREGAR ESTA LÍNEA

// Ejecutar asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize_instance;
db.Sequelize = Sequelize;

async function initDatabase() {
  try {
    await db.sequelize.sync({ alter: true });
    console.log("✅ Base de datos sincronizada con alter");

    await db.Rol.bulkCreate(
      [
        { id_rol: 1, nombreRol: 'comprador' },
        { id_rol: 2, nombreRol: 'vendedor' },
        { id_rol: 3, nombreRol: 'repartidor' },
        { id_rol: 4, nombreRol: 'admin' }
      ],
      {
        ignoreDuplicates: true
      }
    );

    console.log("✅ Roles inicializados");
  } catch (err) {
    console.error("❌ Error inicializando la base de datos:", err);
    process.exit(1);
  }
}

initDatabase();

export default db;