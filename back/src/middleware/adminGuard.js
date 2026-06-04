module.exports = function adminGuard(req, res, next) {
  const rol = req.session?.user?.rol;
  if (!rol || rol.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
};
