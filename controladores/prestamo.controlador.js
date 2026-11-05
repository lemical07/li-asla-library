import prestamoRepositorio from '../repositorios/prestamo.repositorio.js';
import prestamoServicio from '../servicios/prestamo.servicio.js';

const prestamoControlador = {
    async listar(req, res, next) {
        try {
            const pagina = Number(req.query.pagina) || 1;
            const limite = Math.min(Number(req.query.limite) || 20, 100);
            res.json(await prestamoRepositorio.listar({
                pagina,
                limite,
                usuarioId: req.soloPropios
                    ? req.usuario.id
                    : req.query.usuario_id || null
            }));
        } catch (error) {
            next(error);
        }
    },

    async registrar(req, res, next) {
        try {
            const id = await prestamoServicio.registrar(req.body, req.usuario.id);
            res.status(201).json({ id, mensaje: 'Préstamo registrado' });
        } catch (error) {
            next(error);
        }
    },

    async devolver(req, res, next) {
        try {
            await prestamoRepositorio.devolver(req.params.id);
            res.json({ mensaje: 'Devolución registrada' });
        } catch (error) {
            next(error);
        }
    }
};

export default prestamoControlador;
