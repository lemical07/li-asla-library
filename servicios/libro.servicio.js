import libroRepositorio from '../repositorios/libro.repositorio.js';

const libroServicio = {
    listar(parametros) {
        return libroRepositorio.listar(parametros);
    },

    async obtener(id) {
        const libro = await libroRepositorio.obtenerPorId(id);
        if (!libro) {
            const error = new Error('Libro no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return libro;
    },

    async actualizar(id, datos) {
        const actualizado = await libroRepositorio.actualizar(id, datos);
        if (!actualizado) {
            const existente = await libroRepositorio.obtenerPorId(id);
            if (!existente) {
                const error = new Error('Libro no encontrado');
                error.statusCode = 404;
                throw error;
            }
        }
        return libroRepositorio.obtenerPorId(id);
    }
};

export default libroServicio;
