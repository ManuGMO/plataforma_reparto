export const requireRole = (rolesAllowed) => {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    const normalizedRoles = roles.map(r => String(r || '').toLowerCase().trim());
    
    const allowed = Array.isArray(rolesAllowed) ? rolesAllowed : [rolesAllowed];
    const normalizedAllowed = allowed.map(r => String(r || '').toLowerCase().trim());

    const hasRole = normalizedRoles.some(r => normalizedAllowed.includes(r));

    if (!hasRole) {
      return res.status(403).json({ message: 'Acceso denegado: rol insuficiente' });
    }
    next();
  };
};
