export const requireRole = (roleName) => {

  return (req, res, next) => {
    const roles = req.user?.roles || [];
    const normalizedRequired = String(roleName || '').toLowerCase().trim();
    const normalizedRoles = roles.map(r => String(r || '').toLowerCase().trim());
    if (!normalizedRoles.includes(normalizedRequired)) {
      return res.status(403).json({ message: 'Acceso denegado: rol insuficiente' });
    }
    next();
  };
};
