import { escaparHtml } from '../utilidades/formato.js';

export const botonAccion = (accion, id, etiqueta, icono, peligro = false) => `
    <button class="boton boton--icono${peligro ? ' boton--peligro' : ''}"
        type="button" data-accion="${escaparHtml(accion)}" data-id="${Number(id)}"
        aria-label="${escaparHtml(etiqueta)}" title="${escaparHtml(etiqueta)}">
        <span aria-hidden="true">${icono}</span>
    </button>`;

export const crearTabla = (encabezados, filas, vacio = 'No hay registros para mostrar.') => {
    if (!filas.length) {
        return `<div class="estado-vacio"><strong>Todo al día</strong><p>${escaparHtml(vacio)}</p></div>`;
    }

    return `<div class="tabla-contenedor"><table class="tabla">
        <thead><tr>${encabezados.map((encabezado) =>
        `<th scope="col">${escaparHtml(encabezado)}</th>`
    ).join('')}</tr></thead>
        <tbody>${filas.map((fila) => `<tr>${fila.map((celda) =>
        `<td>${celda?.seguro === true ? celda.valor : escaparHtml(celda)}</td>`
    ).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
};

export const htmlSeguro = (valor) => ({ seguro: true, valor });
