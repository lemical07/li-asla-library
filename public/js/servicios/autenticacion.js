import api from './api.js';
import { CLAVE_TOKEN, CLAVE_USUARIO, RUTAS } from '../config/configuracion.js';

const autenticacion = {
    async iniciarSesion(email, contrasena) {
        const resultado = await api.crear(
            '/usuarios/login',
            { email, contrasena },
            { autenticado: false }
        );
        this.guardarSesion(resultado);
        return resultado.usuario;
    },

    async registrar(datos) {
        return api.crear('/usuarios/registro', datos, { autenticado: false });
    },

    guardarSesion({ token, usuario }) {
        if (!token || !usuario?.id || !usuario?.rol) {
            throw new Error('El servidor devolvió una respuesta de sesión incompleta.');
        }
        sessionStorage.setItem(CLAVE_TOKEN, token);
        sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    },

    obtenerToken() {
        return sessionStorage.getItem(CLAVE_TOKEN);
    },

    obtenerUsuario() {
        try {
            return JSON.parse(sessionStorage.getItem(CLAVE_USUARIO) || 'null');
        } catch {
            this.cerrarSesion();
            return null;
        }
    },

    estaAutenticado() {
        const token = this.obtenerToken();
        if (!token) {
            return false;
        }
        try {
            const carga = JSON.parse(
                atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
            );
            if (!carga.exp || carga.exp <= Math.floor(Date.now() / 1000)) {
                this.cerrarSesion();
                return false;
            }
            return Boolean(this.obtenerUsuario());
        } catch {
            this.cerrarSesion();
            return false;
        }
    },

    cerrarSesion() {
        sessionStorage.removeItem(CLAVE_TOKEN);
        sessionStorage.removeItem(CLAVE_USUARIO);
    },

    irAlPanel(usuario) {
        if (!usuario || !['admin', 'lector'].includes(usuario.rol)) {
            throw new Error('La cuenta no tiene un rol habilitado para acceder.');
        }
        window.location.assign(`${RUTAS.aplicacion}#${usuario.rol === 'admin' ? 'dashboard' : 'inicio'}`);
    }
};

export default autenticacion;
