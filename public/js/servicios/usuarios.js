import api from './api.js';

const usuarios = {
    listar({ pagina = 1, limite = 100, busqueda = '' } = {}) {
        const consulta = new URLSearchParams({ pagina, limite });
        if (busqueda) {
            consulta.set('busqueda', busqueda);
        }
        return api.obtener(`/usuarios?${consulta}`);
    },

    obtener(id) {
        return api.obtener(`/usuarios/${id}`);
    },

    perfil() {
        return api.obtener('/usuarios/perfil');
    },

    actualizarPerfil(datos) {
        return api.actualizar('/usuarios/perfil', datos);
    },

    actualizar(id, datos) {
        return api.actualizar(`/usuarios/${id}`, datos);
    },

    cambiarEstado(id, activo) {
        return api.actualizar(`/usuarios/${id}/estado`, { activo });
    }
};

export default usuarios;
