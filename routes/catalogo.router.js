import { Router } from 'express';
import catalogoControlador from '../controladores/catalogo.controlador.js';
import autorizarUsuario from '../util/autorizar-usuario.js';
import autorizarRol from '../util/autorizar-rol.js';
import manejadorErroresValidacion from '../util/manejador-errores-validacion.js';
import categoriaCrearValidaciones from '../validaciones/categoria.crear.validacion.js';
import autorCrearValidaciones from '../validaciones/autor.crear.validaciones.js';

const catalogoRouter = Router();

catalogoRouter.get('/categorias', catalogoControlador.listarCategorias);
catalogoRouter.post(
    '/categorias',
    autorizarUsuario,
    autorizarRol('admin'),
    categoriaCrearValidaciones,
    manejadorErroresValidacion,
    catalogoControlador.crearCategoria
);
catalogoRouter.get('/autores', catalogoControlador.listarAutores);
catalogoRouter.post(
    '/autores',
    autorizarUsuario,
    autorizarRol('admin'),
    autorCrearValidaciones,
    manejadorErroresValidacion,
    catalogoControlador.crearAutor
);

export default catalogoRouter;
