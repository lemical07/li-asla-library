import usuarioRepositorio from '../repositorios/usuario.repositorio.js';
import { verificarToken } from './jwt.js';

const autorizarUsuario = async (req, res, next) => {
    try {
        const autorizacion = req.get('authorization') || '';
        const partes = autorizacion.split(/\s+/);
        const [esquema, token] = partes;
        if (partes.length !== 2 || esquema !== 'Bearer' || !token) {
            return res.status(401).json({ mensaje: 'Autenticación requerida' });
        }

        const carga = verificarToken(token);
        if (!carga) {
            return res.status(401).json({ mensaje: 'Token inválido o expirado' });
        }

        const usuario = await usuarioRepositorio.obtenerPorId(carga.sub);
        if (!usuario || !usuario.activo) {
            return res.status(401).json({ mensaje: 'La cuenta no está disponible' });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        next(error);
    }
};

export default autorizarUsuario;
