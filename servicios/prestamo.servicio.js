import prestamoRepositorio from '../repositorios/prestamo.repositorio.js';

const prestamoServicio = {
    registrar(datos, administradorId) {
        return prestamoRepositorio.crear({
            usuarioId: datos.usuario_id,
            administradorId,
            ejemplarId: datos.ejemplar_id,
            fechaLimite: datos.fecha_limite
        });
    }
};

export default prestamoServicio;
