import ventaRepositorio from '../repositorios/venta.repositorio.js';
import ventaServicio from '../servicios/venta.servicio.js';

const ventaControlador = {
    async listar(req, res, next) {
        try {
            const pagina = Number(req.query.pagina) || 1;
            const limite = Math.min(Number(req.query.limite) || 20, 100);
            res.json(await ventaRepositorio.listar({
                pagina,
                limite,
                usuarioId: req.soloPropias
                    ? req.usuario.id
                    : req.query.usuario_id || null
            }));
        } catch (error) {
            next(error);
        }
    },

    async registrar(req, res, next) {
        try {
            const resultado = await ventaServicio.registrar(req.body, req.usuario);
            res.status(201).json({
                ...resultado,
                mensaje: 'Venta registrada correctamente'
            });
        } catch (error) {
            next(error);
        }
    }
};

export default ventaControlador;
