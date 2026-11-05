const iconos = {
    dashboard: '◫',
    inicio: '⌂',
    libros: '▤',
    catalogo: '⌕',
    prestamos: '↗',
    devoluciones: '↙',
    ventas: '◇',
    compras: '◈',
    inventario: '▦',
    usuarios: '◎',
    clientes: '◉',
    perfil: '○'
};

const enlacesPorRol = {
    admin: [
        { grupo: 'GENERAL', enlaces: [['dashboard', 'Resumen'], ['libros', 'Libros']] },
        { grupo: 'OPERACIONES', enlaces: [['prestamos', 'Préstamos'], ['devoluciones', 'Devoluciones'], ['ventas', 'Ventas'], ['inventario', 'Inventario']] },
        { grupo: 'PERSONAS', enlaces: [['usuarios', 'Usuarios'], ['clientes', 'Clientes']] },
        { grupo: 'CUENTA', enlaces: [['perfil', 'Mi perfil']] }
    ],
    lector: [
        { grupo: 'MI ESPACIO', enlaces: [['inicio', 'Mi biblioteca'], ['catalogo', 'Explorar libros']] },
        { grupo: 'MI HISTORIAL', enlaces: [['prestamos', 'Mis préstamos'], ['compras', 'Mis compras']] },
        { grupo: 'CUENTA', enlaces: [['perfil', 'Mi perfil']] }
    ]
};

export const dibujarNavegacion = (rol, vistaActiva) => {
    const contenedor = document.getElementById('navegacion-panel');
    if (!contenedor) {
        return;
    }
    contenedor.innerHTML = (enlacesPorRol[rol] || []).map(({ grupo, enlaces }) => `
        <span class="navegacion-etiqueta">${grupo}</span>
        ${enlaces.map(([vista, etiqueta]) => `
            <a class="enlace-navegacion${vista === vistaActiva ? ' activo' : ''}"
                href="#${vista}" data-vista="${vista}"${vista === vistaActiva ? ' aria-current="page"' : ''}>
                <span class="navegacion-icono" aria-hidden="true">${iconos[vista] || '•'}</span>
                <span>${etiqueta}</span>
            </a>
        `).join('')}
    `).join('');
};
