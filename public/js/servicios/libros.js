import api from './api.js';

const construirConsulta = (parametros = {}) => {
    const consulta = new URLSearchParams();
    for (const [clave, valor] of Object.entries(parametros)) {
        if (valor !== '' && valor !== null && valor !== undefined) {
            consulta.set(clave, valor);
        }
    }
    const cadena = consulta.toString();
    return cadena ? `?${cadena}` : '';
};

const libros = {
    listar(parametros = {}) {
        return api.obtener(`/libros${construirConsulta(parametros)}`, {
            autenticado: false
        });
    },

    obtener(id) {
        return api.obtener(`/libros/${id}`, { autenticado: false });
    },

    crear(datos) {
        return api.crear('/libros', datos);
    },

    actualizar(id, datos) {
        return api.actualizar(`/libros/${id}`, datos);
    },

    eliminar(id) {
        return api.eliminar(`/libros/${id}`);
    },

    agregarExistencias(id, cantidad, motivo) {
        return api.crear(`/libros/${id}/inventario`, { cantidad, motivo });
    },

    crearEjemplares(id, cantidad) {
        return api.crear(`/libros/${id}/ejemplares`, { cantidad });
    },

    ejemplares(id) {
        return api.obtener(`/libros/${id}/ejemplares`);
    },

    movimientos(id, pagina = 1) {
        return api.obtener(`/libros/${id}/movimientos?pagina=${pagina}`);
    },

    categorias() {
        return api.obtener('/categorias', { autenticado: false });
    },

    autores() {
        return api.obtener('/autores', { autenticado: false });
    },

    crearCategoria(nombre) {
        return api.crear('/categorias', { nombre });
    },

    crearAutor(nombre) {
        return api.crear('/autores', { nombre });
    }
};

export default libros;
