import db from '../models/indexModels.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Usuario, Rol, Usuario_Rol } = db;

export const register = async (req, res) => {
  try {
    const { nombre, correo, contraseña, userType } = req.body;
    if (!nombre || !correo || !contraseña) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const existing = await Usuario.findOne({ where: { correo } });

    // Mapear valores de frontend a nombres de rol en BD
    const mapping = {
      buyer: 'comprador',
      seller: 'vendedor',
      driver: 'repartidor'
    };
    const nombreRol = mapping[userType] || userType;
    const rol = userType ? await Rol.findOne({ where: { nombreRol } }) : null;
    if (existing) {
      // Si el usuario ya existe, sólo asignar nuevo rol si no lo tiene
      if (!userType) {
        return res.status(200).json({ message: 'Usuario ya existe', user: { id: existing.id_usuario, nombre: existing.nombre, correo: existing.correo } });
      }

      // Verificar si ya tiene ese rol
      const existingAssoc = await Usuario_Rol.findOne({ where: { id_usuario: existing.id_usuario, id_rol: rol ? rol.id_rol : null } });
      if (existingAssoc) {
        return res.status(409).json({ message: 'Correo y rol ya registrados' });
      }

      // Verificar contraseña para autorizar añadir rol
      const match = await bcrypt.compare(contraseña, existing.contraseña);
      if (!match) {
        return res.status(401).json({ message: 'Contraseña incorrecta para asignar rol' });
      }

      if (rol) {
        await Usuario_Rol.create({ id_usuario: existing.id_usuario, id_rol: rol.id_rol });
        return res.status(200).json({ message: 'Rol asignado al usuario existente', user: { id: existing.id_usuario, nombre: existing.nombre, correo: existing.correo } });
      } else {
        return res.status(400).json({ message: 'Rol inválido' });
      }
    }

    // Crear nuevo usuario si no existe
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contraseña, salt);

    const user = await Usuario.create({ nombre, correo, contraseña: hash });

    // Asignar rol si se envía userType y existe en BD
    if (userType && rol) {
      await Usuario_Rol.create({ id_usuario: user.id_usuario, id_rol: rol.id_rol });
    }

    // No retornar contraseña
    const payload = { id: user.id_usuario, nombre: user.nombre, correo: user.correo };
    return res.status(201).json({ message: 'Usuario creado', user: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;
    if (!correo || !contraseña) return res.status(400).json({ message: 'Faltan credenciales' });

    const user = await Usuario.findOne({
      where: { correo },
      include: [
        {
          model: Rol,
          through: { model: Usuario_Rol, attributes: [] },
          attributes: ['id_rol', 'nombreRol']
        }
      ]
    });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const match = await bcrypt.compare(contraseña, user.contraseña);
    if (!match) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id_usuario, nombre: user.nombre, correo: user.correo }, process.env.JWT_SECRET || 'secret', { expiresIn: '4h' });

    const roles = user.Rols ? user.Rols.map(r => r.nombreRol) : [];

    return res.json({ token, user: { id: user.id_usuario, nombre: user.nombre, correo: user.correo, roles } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};
