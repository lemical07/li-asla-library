import { API_BASE, CLAVE_TOKEN, RUTAS } from '../config/configuracion.js';

const api = {
    async solicitar(ruta, opciones = {}) {
        const { metodo = 'GET', datos, autenticado = true, encabezados = {} } = opciones;
        const token = sessionStorage.getItem(CLAVE_TOKEN);
        const cabeceras = { Accept: 'application/json', ...encabezados };

        if (datos !== undefined) {
            cabeceras['Content-Type'] = 'application/json';
        }
        if (autenticado && token) {
            cabeceras.Authorization = `Bearer ${token}`;
        }

        let respuesta;
        try {
            respuesta = await fetch(`${API_BASE}${ruta}`, {
                method: metodo,
                headers: cabeceras,
                body: datos === undefined ? undefined : JSON.stringify(datos)
            });
        } catch (error) {
            const errorRed = new Error(
                'No fue posible conectar con ASLA Library. Revisa tu conexión e inténtalo de nuevo.'
            );
            errorRed.causa = error;
            throw errorRed;
        }

        const tipo = respuesta.headers.get('content-type') || '';
        const resultado = respuesta.status === 204
            ? null
            : tipo.includes('application/json')
                ? await respuesta.json().catch(() => null)
                : await respuesta.text().catch(() => '');

        if (!respuesta.ok) {
            if (respuesta.status === 401 && autenticado && token) {
                sessionStorage.removeItem(CLAVE_TOKEN);
                sessionStorage.removeItem('asla_usuario');
                if (window.location.pathname === RUTAS.aplicacion) {
                    window.location.replace(
                        `${RUTAS.iniciarSesion}?sesion=expirada`
                    );
                }
            }

            const detalle = Array.isArray(resultado?.errores)
                ? resultado.errores.map((error) =>
                    error.mensaje || error.msg
                ).filter(Boolean).join('. ')
                : '';
            const error = new Error(
                detalle || resultado?.mensaje || `No se pudo completar la solicitud (${respuesta.status}).`
            );
            error.estado = respuesta.status;
            error.detalles = resultado?.errores || null;
            throw error;
        }

        return resultado;
    },

    obtener(ruta, opciones = {}) {
        return this.solicitar(ruta, opciones);
    },

    crear(ruta, datos, opciones = {}) {
        return this.solicitar(ruta, {
            ...opciones,
            metodo: 'POST',
            datos
        });
    },

    actualizar(ruta, datos, opciones = {}) {
        return this.solicitar(ruta, {
            ...opciones,
            metodo: 'PATCH',
            datos
        });
    },

    eliminar(ruta, opciones = {}) {
        return this.solicitar(ruta, { ...opciones, metodo: 'DELETE' });
    }
};

export default api;
