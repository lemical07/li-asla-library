export const escaparHtml = (valor = '') => String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const formatearFecha = (valor, opciones = {}) => {
    if (!valor) {
        return '—';
    }
    const fecha = new Date(
        typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
            ? `${valor}T12:00:00`
            : valor
    );
    if (Number.isNaN(fecha.getTime())) {
        return '—';
    }
    return new Intl.DateTimeFormat('es-GT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...opciones
    }).format(fecha);
};

export const formatearMoneda = (valor) => new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 2
}).format(Number(valor) || 0);

export const iniciales = (nombre = '') => nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('') || 'A';

export const claseEstado = (estado = '') => {
    const normalizado = String(estado).toLowerCase();
    if (['activo', 'disponible', 'devuelto', 'operativo'].includes(normalizado)) {
        return 'etiqueta-estado--positivo';
    }
    if (['vencido', 'prestado', 'pendiente', 'inactivo'].includes(normalizado)) {
        return 'etiqueta-estado--aviso';
    }
    if (['cancelado', 'danado', 'perdido', 'baja'].includes(normalizado)) {
        return 'etiqueta-estado--error';
    }
    return '';
};

export const humanizar = (valor = '') => String(valor)
    .replaceAll('_', ' ')
    .replaceAll('danado', 'dañado')
    .replace(/\b\p{L}/gu, (letra) => letra.toUpperCase());
