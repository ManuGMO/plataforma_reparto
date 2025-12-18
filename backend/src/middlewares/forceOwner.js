// Middleware para forzar que las rutas que manejan recursos propios usen el id del usuario autenticado
export const forceOwner = (options = {}) => {
  const paramNames = options.paramNames || ['id', 'id_usuario', 'idVendedor', 'idRepartidor', 'repartidorId'];
  return (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next();
      paramNames.forEach(p => {
        if (req.params && req.params[p] !== undefined) {

          req.params[p] = String(userId);
        }
      });
      next();
    } catch (err) {
      next(err);
    }
  };
};
