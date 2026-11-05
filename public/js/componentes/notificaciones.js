export const notificar = (mensaje, tipo = 'exito', duracion = 4200) => {
    const zona = document.getElementById('zona-notificaciones');
    if (!zona) {
        return;
    }
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion${tipo === 'error' ? ' notificacion--error' : tipo === 'aviso' ? ' notificacion--aviso' : ''}`;
    notificacion.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    notificacion.textContent = mensaje;
    zona.append(notificacion);
    window.setTimeout(() => {
        notificacion.classList.add('notificacion-salir');
        window.setTimeout(() => notificacion.remove(), 220);
    }, duracion);
};
