import catalogoRepositorio from '../repositorios/catalogo.repositorio.js';

const catalogoControlador = {
    async listarCategorias(req, res, next) {
        try {
            res.json(await catalogoRepositorio.listarCategorias());
        } catch (error) {
            next(error);
        }
    },

    async crearCategoria(req, res, next) {
        try {
            const id = await catalogoRepositorio.crearCategoria(req.body.nombre);
            res.status(201).json({ id, nombre: req.body.nombre });
        } catch (error) {
            next(error);
        }
    },

    async listarAutores(req, res, next) {
        try {
            res.json(await catalogoRepositorio.listarAutores());
        } catch (error) {
            next(error);
        }
    },

    async crearAutor(req, res, next) {
        try {
            const id = await catalogoRepositorio.crearAutor(req.body.nombre);
            res.status(201).json({ id, nombre: req.body.nombre });
        } catch (error) {
            next(error);
        }
    }
};

export default catalogoControlador;
