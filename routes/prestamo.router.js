import { Router } from 'express';
import { param, query } from 'express-validator';
import prestamoControlador from '../controladores/prestamo.controlador.js';
import autorizarUsuario from '../util/autorizar-usuario.js';
import autorizarRol from '../util/autorizar-rol.js';
import manejadorErroresValidacion from '../util/manejador-errores-validacion.js';
import prestamoCrearValidaciones from '../validaciones/prestamo.crear.validaciones.js';

const prestamoRouter = Router();

prestamoRouter.get(
    '/mis-prestamos',
    autorizarUsuario,
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 100 }).toInt(),
    manejadorErroresValidacion,
    (req, res, next) => {
        req.soloPropios = true;
        next();
    },
    prestamoControlador.listar
);
prestamoRouter.get(
    '/',
    autorizarUsuario,
    autorizarRol('admin'),
    query('usuario_id').optional().isInt({ min: 1 }).toInt(),
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 100 }).toInt(),
    manejadorErroresValidacion,
    prestamoControlador.listar
);
prestamoRouter.post(
    '/',
    autorizarUsuario,
    autorizarRol('admin'),
    prestamoCrearValidaciones,
    manejadorErroresValidacion,
    prestamoControlador.registrar
);
prestamoRouter.post(
    '/:id/devolucion',
    autorizarUsuario,
    autorizarRol('admin'),
    param('id').isInt({ min: 1 }).toInt(),
    manejadorErroresValidacion,
    prestamoControlador.devolver
);

export default prestamoRouter;
