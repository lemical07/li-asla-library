import ventaRepositorio from '../repositorios/venta.repositorio.js';
import usuarioRepositorio from '../repositorios/usuario.repositorio.js';

const ventaServicio = {
    async registrar(datos, solicitante) {
        let usuarioId = solicitante.id;
        let nombreCliente = null;
        if (solicitante.rol === 'admin') {
            usuarioId = datos.usuario_id || null;
            nombreCliente = datos.nombre_cliente || null;
            if (usuarioId) {
                const usuario = await usuarioRepositorio.obtenerPorId(usuarioId);
                if (!usuario || !usuario.activo) {
                    const error = new Error('Usuario de la venta no encontrado o inactivo');
                    error.statusCode = 404;
                    throw error;
                }
            }
        }
        return ventaRepositorio.crear({
            usuarioId,
            nombreCliente,
            lineas: datos.libros,
            actorId: solicitante.id
        });
    }
};

export default ventaServicio;
