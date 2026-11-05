export const validarCorreo = (correo) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim());

export const validarContrasena = (contrasena) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(contrasena);

export const establecerCarga = (boton, cargando, texto = 'Procesando…') => {
    if (!boton.dataset.textoOriginal) {
        boton.dataset.textoOriginal = boton.innerHTML;
    }
    boton.disabled = cargando;
    boton.setAttribute('aria-busy', String(cargando));
    boton.innerHTML = cargando
        ? `<span class="cargando-indicador">${texto}</span>`
        : boton.dataset.textoOriginal;
};
