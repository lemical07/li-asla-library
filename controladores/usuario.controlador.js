import usuarioRepositorio from '../repositorios/usuario.repositorio.js';
import usuarioServicio from '../servicios/usuario.servicio.js';
import UsuarioObtenerDTO from '../dto/usuario.obtener.dto.js';
import UsuarioCrearDTO from '../dto/usuario.crear.dto.js';

const usuarioControlador = {
    async registrar(req, res, next) {
        try {
            const resultado = await usuarioServicio.registrar(
                new UsuarioCrearDTO(req.body)
            );
            res.status(201).json({
                ...resultado,
                mensaje: 'Usuario registrado correctamente'
            });
        } catch (error) {
            next(error);
        }
    },

    async iniciarSesion(req, res, next) {
        try {
            res.json(await usuarioServicio.iniciarSesion(
                req.body.email,
                req.body.contrasena
            ));
        } catch (error) {
            next(error);
        }
    },

    async obtenerPerfil(req, res, next) {
        try {
            res.json(new UsuarioObtenerDTO(req.usuario).data);
        } catch (error) {
            next(error);
        }
    },

    async actualizarPerfil(req, res, next) {
        try {
            const usuario = await usuarioServicio.actualizarPerfil(
                req.usuario.id,
                req.body
            );
            res.json(new UsuarioObtenerDTO(usuario).data);
        } catch (error) {
            next(error);
        }
    },

    async listar(req, res, next) {
        try {
            const pagina = Number(req.query.pagina) || 1;
            const limite = Math.min(Number(req.query.limite) || 20, 100);
            const resultado = await usuarioRepositorio.listar({
                pagina,
                limite,
                busqueda: req.query.busqueda || ''
            });
            res.json({
                ...resultado,
                datos: resultado.datos.map((usuario) =>
                    new UsuarioObtenerDTO(usuario).data
                ),
                pagina,
                limite
            });
        } catch (error) {
            next(error);
        }
    },

    async obtener(req, res, next) {
        try {
            const usuario = await usuarioRepositorio.obtenerPorId(req.params.id);
            if (!usuario) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }
            res.json(new UsuarioObtenerDTO(usuario).data);
        } catch (error) {
            next(error);
        }
    },

    async actualizar(req, res, next) {
        try {
            const usuario = await usuarioServicio.actualizarPerfil(
                req.params.id,
                req.body
            );
            res.json(new UsuarioObtenerDTO(usuario).data);
        } catch (error) {
            next(error);
        }
    },

    async actualizarEstado(req, res, next) {
        try {
            const actualizado = await usuarioRepositorio.actualizarEstado(
                req.params.id,
                req.body.activo
            );
            if (!actualizado) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }
            res.json({ mensaje: 'Estado de la cuenta actualizado' });
        } catch (error) {
            next(error);
        }
    }
};

export default usuarioControlador;
