import api from './api.js';

const prestamos = {
    listar({ propios = false, pagina = 1, limite = 100, usuarioId = null } = {}) {
        const ruta = propios ? '/prestamos/mis-prestamos' : '/prestamos';
        const consulta = new URLSearchParams({ pagina, limite });
        if (usuarioId) {
            consulta.set('usuario_id', usuarioId);
        }
        return api.obtener(`${ruta}?${consulta}`);
    },

    crear(datos) {
        return api.crear('/prestamos', datos);
    },

    devolver(id) {
        return api.crear(`/prestamos/${id}/devolucion`, {});
    }
};

export default prestamos;
