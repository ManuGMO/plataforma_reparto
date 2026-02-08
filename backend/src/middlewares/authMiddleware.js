import jwt from 'jsonwebtoken';
import db from '../models/indexModels.js';
import tokenBlacklist from '../utils/tokenBlacklist.js';

const { Usuario } = db;

export const authenticate = async (req, res, next) => {
  try {


    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2) return res.status(401).json({ message: 'Token error' });

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ message: 'Token malformado' });

    // Check if token has been revoked (logout)
    if (tokenBlacklist.has(token)) return res.status(401).json({ message: 'Token revocado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await Usuario.findOne({
      where: { id_usuario: decoded.id },
      include: [
        {
          model: db.Rol,
          through: { model: db.Usuario_Rol, attributes: [] },
          attributes: ['nombreRol']
        }
      ]
    });
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

    if (user.estado === 'bloqueado') {
      return res.status(403).json({ message: 'Usuario bloqueado' });
    }

    const roles = user.Rols ? user.Rols.map(r => r.nombreRol) : [];

    req.user = { id: user.id_usuario, nombre: user.nombre, correo: user.correo, roles };
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Token inválido' });
  }
};
