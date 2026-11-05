const autorizarRol = (...rolesPermitidos) => (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({ mensaje: 'No tiene permisos para esta operación' });
    }
    next();
};

export default autorizarRol;
