import autenticacion from '../servicios/autenticacion.js';
import { RUTAS } from '../config/configuracion.js';
import { notificar } from '../componentes/notificaciones.js';
import { establecerCarga, validarContrasena } from '../utilidades/validaciones.js';

const formularioInicio = document.getElementById('formulario-inicio');
const formularioRegistro = document.getElementById('formulario-registro');

if (autenticacion.estaAutenticado()) {
    autenticacion.irAlPanel(autenticacion.obtenerUsuario());
}

if (new URLSearchParams(window.location.search).get('sesion') === 'expirada') {
    notificar('Tu sesión terminó. Inicia sesión para continuar.', 'aviso');
}

if (new URLSearchParams(window.location.search).has('registro')) {
    notificar('Tu cuenta se creó correctamente. Ya puedes iniciar sesión.');
}

formularioInicio?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!formularioInicio.reportValidity()) {
        return;
    }
    const boton = formularioInicio.querySelector('[type="submit"]');
    establecerCarga(boton, true, 'Validando acceso…');
    try {
        const datos = new FormData(formularioInicio);
        const usuario = await autenticacion.iniciarSesion(
            datos.get('email').trim(),
            datos.get('contrasena')
        );
        autenticacion.irAlPanel(usuario);
    } catch (error) {
        notificar(error.message, 'error');
    } finally {
        establecerCarga(boton, false);
    }
});

formularioRegistro?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!formularioRegistro.reportValidity()) {
        return;
    }
    const datosFormulario = new FormData(formularioRegistro);
    const contrasena = datosFormulario.get('contrasena');
    if (!validarContrasena(contrasena)) {
        notificar('La contraseña debe incluir 8 caracteres, mayúscula, número y símbolo.', 'aviso');
        return;
    }
    const boton = formularioRegistro.querySelector('[type="submit"]');
    establecerCarga(boton, true, 'Creando cuenta…');
    try {
        const datos = Object.fromEntries(datosFormulario.entries());
        for (const campo of ['telefono', 'direccion']) {
            if (!datos[campo]) {
                delete datos[campo];
            }
        }
        await autenticacion.registrar(datos);
        window.location.assign(`${RUTAS.iniciarSesion}?registro=ok`);
    } catch (error) {
        notificar(error.message, 'error');
    } finally {
        establecerCarga(boton, false);
    }
});
