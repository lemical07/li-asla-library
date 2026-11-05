import api from './api.js';

const ventas = {
    listar({ propias = false, pagina = 1, limite = 100, usuarioId = null } = {}) {
        const ruta = propias ? '/ventas/mis-ventas' : '/ventas';
        const consulta = new URLSearchParams({ pagina, limite });
        if (usuarioId) {
            consulta.set('usuario_id', usuarioId);
        }
        return api.obtener(`${ruta}?${consulta}`);
    },

    crear(datos) {
        return api.crear('/ventas', datos);
    }
};

export default ventas;
