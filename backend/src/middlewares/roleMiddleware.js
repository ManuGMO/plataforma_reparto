export const requireRole = (roleName) => {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!roles.includes(roleName)) {
      return res.status(403).json({ message: 'Acceso denegado: rol insuficiente' });
    }
    next();
  };
};
