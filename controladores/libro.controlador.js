import libroRepositorio from '../repositorios/libro.repositorio.js';
import libroServicio from '../servicios/libro.servicio.js';
import LibroCrearDTO from '../dto/libro.crear.dto.js';
import LibroObtenerDTO from '../dto/libro.obtener.dto.js';

const libroControlador = {
    async listar(req, res, next) {
        try {
            const pagina = Number(req.query.pagina) || 1;
            const limite = Math.min(Number(req.query.limite) || 20, 100);
            const resultado = await libroServicio.listar({
                pagina,
                limite,
                busqueda: req.query.busqueda || '',
                categoriaId: req.query.categoria_id || null,
                ordenar: req.query.ordenar || 'id',
                direccion: req.query.direccion || 'asc'
            });
            res.json({
                ...resultado,
                datos: resultado.datos.map((libro) => new LibroObtenerDTO(libro).data),
                pagina,
                limite,
                paginas: Math.ceil(resultado.total / limite)
            });
        } catch (error) {
            next(error);
        }
    },

    async listarMovimientos(req, res, next) {
        try {
            const pagina = Number(req.query.pagina) || 1;
            const limite = Math.min(Number(req.query.limite) || 20, 100);
            res.json({
                ...(await libroRepositorio.listarMovimientos(
                    req.params.id,
                    pagina,
                    limite
                )),
                pagina,
                limite
            });
        } catch (error) {
            next(error);
        }
    },

    async listarEjemplares(req, res, next) {
        try {
            res.json(await libroRepositorio.listarEjemplares(req.params.id));
        } catch (error) {
            next(error);
        }
    },

    async obtener(req, res, next) {
        try {
            const libro = await libroServicio.obtener(req.params.id);
            res.json(new LibroObtenerDTO(libro).data);
        } catch (error) {
            next(error);
        }
    },

    async crear(req, res, next) {
        try {
            const libro = new LibroCrearDTO(req.body);
            const id = await libroRepositorio.crear(libro);
            res.status(201).json({
                id,
                mensaje: 'Libro registrado correctamente'
            });
        } catch (error) {
            next(error);
        }
    },

    async actualizar(req, res, next) {
        try {
            const libro = await libroServicio.actualizar(req.params.id, req.body);
            res.json(new LibroObtenerDTO(libro).data);
        } catch (error) {
            next(error);
        }
    },

    async eliminar(req, res, next) {
        try {
            await libroRepositorio.eliminar(req.params.id);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    },

    async agregarExistencias(req, res, next) {
        try {
            await libroRepositorio.agregarExistencias(
                req.params.id,
                req.body.cantidad,
                req.usuario.id,
                req.body.motivo
            );
            res.status(201).json({ mensaje: 'Inventario actualizado' });
        } catch (error) {
            next(error);
        }
    },

    async crearEjemplares(req, res, next) {
        try {
            await libroRepositorio.crearEjemplares(
                req.params.id,
                req.body.cantidad
            );
            res.status(201).json({ mensaje: 'Ejemplares registrados' });
        } catch (error) {
            next(error);
        }
    }
};

export default libroControlador;
