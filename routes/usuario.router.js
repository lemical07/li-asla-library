import { Router } from 'express';
import usuarioControlador from '../controladores/usuario.controlador.js';
import autorizarUsuario from '../util/autorizar-usuario.js';
import autorizarRol from '../util/autorizar-rol.js';
import manejadorErroresValidacion from '../util/manejador-errores-validacion.js';
import crearLimitador from '../util/limitar-solicitudes.js';
import usuarioCrearValidaciones from '../validaciones/usuario.crear.validaciones.js';
import usuarioLoginValidaciones from '../validaciones/usuario.login.validaciones.js';
import usuarioPerfilValidaciones from '../validaciones/usuario.perfil.validaciones.js';
import { body, param, query } from 'express-validator';

const usuarioRouter = Router();
const limitarRegistro = crearLimitador({ maximo: 10, ventanaMs: 15 * 60 * 1000 });
const limitarInicioSesion = crearLimitador({ maximo: 5, ventanaMs: 15 * 60 * 1000 });

const registrar = [
    limitarRegistro,
    usuarioCrearValidaciones,
    manejadorErroresValidacion,
    usuarioControlador.registrar
];
usuarioRouter.post('/registro', registrar);
usuarioRouter.post('/', registrar);
usuarioRouter.post(
    '/login',
    limitarInicioSesion,
    usuarioLoginValidaciones,
    manejadorErroresValidacion,
    usuarioControlador.iniciarSesion
);
usuarioRouter.get('/perfil', autorizarUsuario, usuarioControlador.obtenerPerfil);
usuarioRouter.patch(
    '/perfil',
    autorizarUsuario,
    usuarioPerfilValidaciones,
    manejadorErroresValidacion,
    usuarioControlador.actualizarPerfil
);
usuarioRouter.get(
    '/',
    autorizarUsuario,
    autorizarRol('admin'),
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('busqueda').optional().isString().isLength({ max: 100 }),
    manejadorErroresValidacion,
    usuarioControlador.listar
);
usuarioRouter.get(
    '/:id',
    autorizarUsuario,
    autorizarRol('admin'),
    param('id').isInt({ min: 1 }).toInt(),
    manejadorErroresValidacion,
    usuarioControlador.obtener
);
usuarioRouter.patch(
    '/:id',
    autorizarUsuario,
    autorizarRol('admin'),
    param('id').isInt({ min: 1 }).toInt(),
    usuarioPerfilValidaciones,
    manejadorErroresValidacion,
    usuarioControlador.actualizar
);
usuarioRouter.patch(
    '/:id/estado',
    autorizarUsuario,
    autorizarRol('admin'),
    param('id').isInt({ min: 1 }),
    body('activo').isBoolean().toBoolean(),
    manejadorErroresValidacion,
    usuarioControlador.actualizarEstado
);

export default usuarioRouter;
