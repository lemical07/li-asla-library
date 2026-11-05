import bcrypt from 'bcrypt';
import usuarioRepositorio from '../repositorios/usuario.repositorio.js';
import { crearToken } from '../util/jwt.js';

const usuarioServicio = {
    async registrar(datos) {
        const usuario = {
            identificacion: datos.identificacion,
            nombre: datos.nombre,
            apellido: datos.apellido,
            telefono: datos.telefono,
            direccion: datos.direccion,
            email: datos.email.toLowerCase(),
            contrasena: await bcrypt.hash(datos.contrasena, 12)
        };
        const id = await usuarioRepositorio.crear(usuario);
        return { id };
    },

    async iniciarSesion(email, contrasena) {
        const usuario = await usuarioRepositorio.obtenerPorEmail(email.toLowerCase());
        const valido = usuario && usuario.activo
            ? await bcrypt.compare(contrasena, usuario.contrasena)
            : false;
        if (!valido) {
            const error = new Error('Correo o contraseña inválidos');
            error.statusCode = 401;
            throw error;
        }

        return {
            token: crearToken(usuario),
            usuario: {
                id: usuario.id,
                identificacion: usuario.identificacion,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.rol
            }
        };
    },

    async actualizarPerfil(id, datos) {
        const actualizados = { ...datos };
        if (actualizados.email) {
            actualizados.email = actualizados.email.toLowerCase();
        }
        if (actualizados.contrasena) {
            actualizados.contrasena = await bcrypt.hash(actualizados.contrasena, 12);
        }
        const existe = await usuarioRepositorio.obtenerPorId(id);
        if (!existe) {
            const error = new Error('Usuario no encontrado');
            error.statusCode = 404;
            throw error;
        }
        await usuarioRepositorio.actualizarPerfil(id, actualizados);
        return usuarioRepositorio.obtenerPorId(id);
    }
};

export default usuarioServicio;
