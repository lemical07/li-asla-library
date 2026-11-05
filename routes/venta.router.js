import { Router } from 'express';
import { query } from 'express-validator';
import ventaControlador from '../controladores/venta.controlador.js';
import ventaCrearValidaciones from '../validaciones/venta.crear.validaciones.js';
import autorizarUsuario from '../util/autorizar-usuario.js';
import autorizarRol from '../util/autorizar-rol.js';
import manejadorErroresValidacion from '../util/manejador-errores-validacion.js';

const ventaRouter = Router();

ventaRouter.get(
    '/mis-ventas',
    autorizarUsuario,
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 100 }).toInt(),
    manejadorErroresValidacion,
    (req, res, next) => {
        req.soloPropias = true;
        next();
    },
    ventaControlador.listar
);
ventaRouter.get(
    '/',
    autorizarUsuario,
    autorizarRol('admin'),
    query('usuario_id').optional().isInt({ min: 1 }).toInt(),
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 100 }).toInt(),
    manejadorErroresValidacion,
    ventaControlador.listar
);
ventaRouter.post(
    '/',
    autorizarUsuario,
    ventaCrearValidaciones,
    manejadorErroresValidacion,
    ventaControlador.registrar
);

export default ventaRouter;
