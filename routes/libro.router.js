import { Router } from 'express';
import { body, param, query } from 'express-validator';
import libroControlador from '../controladores/libro.controlador.js';
import autorizarUsuario from '../util/autorizar-usuario.js';
import autorizarRol from '../util/autorizar-rol.js';
import manejadorErroresValidacion from '../util/manejador-errores-validacion.js';
import libroCrearValidaciones from '../validaciones/libro.crear.validaciones.js';
import libroActualizarValidaciones from '../validaciones/libro.actualizar.validaciones.js';

const libroRouter = Router();
const validarId = param('id').isInt({ min: 1 }).withMessage('ID inválido').toInt();
const validarCantidad = body('cantidad')
    .isInt({ min: 1, max: 1000 }).withMessage('La cantidad debe estar entre 1 y 1000')
    .toInt();
const soloAdministrador = [autorizarUsuario, autorizarRol('admin')];

libroRouter.get(
    '/',
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('categoria_id').optional().isInt({ min: 1 }).toInt(),
    query('busqueda').optional().isString().isLength({ max: 100 })
        .withMessage('La búsqueda admite hasta 100 caracteres'),
    query('ordenar').optional().isIn(['titulo', 'precio', 'fecha', 'id'])
        .withMessage('Campo de ordenamiento inválido'),
    query('direccion').optional().isIn(['asc', 'desc']),
    manejadorErroresValidacion,
    libroControlador.listar
);
libroRouter.get('/:id', validarId, manejadorErroresValidacion, libroControlador.obtener);
libroRouter.get(
    '/:id/ejemplares',
    ...soloAdministrador,
    validarId,
    manejadorErroresValidacion,
    libroControlador.listarEjemplares
);
libroRouter.get(
    '/:id/movimientos',
    ...soloAdministrador,
    validarId,
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 100 }).toInt(),
    manejadorErroresValidacion,
    libroControlador.listarMovimientos
);
libroRouter.post(
    '/',
    ...soloAdministrador,
    libroCrearValidaciones,
    manejadorErroresValidacion,
    libroControlador.crear
);
libroRouter.patch(
    '/:id',
    ...soloAdministrador,
    validarId,
    libroActualizarValidaciones,
    manejadorErroresValidacion,
    libroControlador.actualizar
);
libroRouter.delete(
    '/:id',
    ...soloAdministrador,
    validarId,
    manejadorErroresValidacion,
    libroControlador.eliminar
);
libroRouter.post(
    '/:id/inventario',
    ...soloAdministrador,
    validarId,
    validarCantidad,
    body('motivo').optional({ nullable: true }).isString().isLength({ max: 200 }),
    manejadorErroresValidacion,
    libroControlador.agregarExistencias
);
libroRouter.post(
    '/:id/ejemplares',
    ...soloAdministrador,
    validarId,
    validarCantidad,
    manejadorErroresValidacion,
    libroControlador.crearEjemplares
);

export default libroRouter;
