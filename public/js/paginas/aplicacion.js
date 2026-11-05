import autenticacion from '../servicios/autenticacion.js';
import libros from '../servicios/libros.js';
import prestamos from '../servicios/prestamos.js';
import ventas from '../servicios/ventas.js';
import usuarios from '../servicios/usuarios.js';
import { dibujarNavegacion } from '../componentes/navegacion.js';
import { abrirModal, cerrarModal } from '../componentes/modales.js';
import { botonAccion, crearTabla, htmlSeguro } from '../componentes/tablas.js';
import { notificar } from '../componentes/notificaciones.js';
import {
    claseEstado,
    escaparHtml,
    formatearFecha,
    formatearMoneda,
    humanizar,
    iniciales
} from '../utilidades/formato.js';
import { RUTAS, CLAVE_USUARIO } from '../config/configuracion.js';

const vista = document.getElementById('vista-panel');
const catalogoMeta = {
    dashboard: ['Resumen', 'Una mirada clara a lo que sucede en tu biblioteca.'],
    inicio: ['Mi biblioteca', 'Tu espacio personal para leer, descubrir y continuar.'],
    libros: ['Libros', 'Administra el catálogo y explora cada título.'],
    catalogo: ['Explorar libros', 'Encuentra la historia que estabas buscando.'],
    prestamos: ['Préstamos', 'Consulta los ejemplares prestados y su estado.'],
    devoluciones: ['Devoluciones', 'Controla las devoluciones pendientes.'],
    ventas: ['Ventas', 'Registra compras y revisa el historial de ventas.'],
    compras: ['Mis compras', 'Cada título que forma parte de tu colección.'],
    inventario: ['Inventario', 'Existencias de venta y ejemplares para préstamo.'],
    usuarios: ['Usuarios', 'Administra las cuentas registradas.'],
    clientes: ['Clientes', 'Lectores registrados y su actividad.'],
    perfil: ['Mi perfil', 'Tus datos personales y preferencias de cuenta.']
};

const estado = {
    usuario: null,
    rol: null,
    vista: '',
    pagina: 1,
    busqueda: '',
    categoriaId: '',
    filtroTemporizador: null
};

const crearEncabezado = (titulo, descripcion, accion = '') => `
    <header class="cabecera-vista">
        <div>
            <p class="sobretitulo">${estado.rol === 'admin' ? 'PANEL DE ADMINISTRACIÓN' : 'TU ESPACIO ASLA'}</p>
            <h1>${escaparHtml(titulo)}</h1>
            <p>${escaparHtml(descripcion)}</p>
        </div>
        ${accion}
    </header>`;

const dibujarCarga = (titulo, descripcion) => {
    vista.innerHTML = `${crearEncabezado(titulo, descripcion)}
        <div class="esqueleto" aria-label="Cargando" role="status"></div>`;
};

const dibujarError = (error) => {
    vista.innerHTML = `<div class="estado-vacio panel-tarjeta">
        <strong>No pudimos cargar esta sección</strong>
        <p>${escaparHtml(error.message)}</p>
        <button class="boton boton--secundario" type="button" data-accion="reintentar">Volver a intentar</button>
    </div>`;
};

const etiqueta = (texto, clase = '') =>
    `<span class="etiqueta-estado ${clase}">${escaparHtml(texto)}</span>`;

const paginacion = (total, pagina, limite = 20) => {
    const paginas = Math.max(1, Math.ceil(Number(total || 0) / limite));
    if (paginas < 2) {
        return '';
    }
    return `<nav class="paginacion" aria-label="Paginación">
        <span>${Number(total)} registros · Página ${pagina} de ${paginas}</span>
        <span class="paginacion-acciones">
            <button class="boton boton--secundario boton--compacto" data-accion="pagina-anterior"
                type="button"${pagina <= 1 ? ' disabled' : ''}>← Anterior</button>
            <button class="boton boton--secundario boton--compacto" data-accion="pagina-siguiente"
                type="button"${pagina >= paginas ? ' disabled' : ''}>Siguiente →</button>
        </span>
    </nav>`;
};

const opcionesSelect = (opciones, valorActual = '') => opciones.map((opcion) => `
    <option value="${escaparHtml(opcion.valor)}"${String(opcion.valor) === String(valorActual) ? ' selected' : ''}>
        ${escaparHtml(opcion.etiqueta)}
    </option>`).join('');

const guardarUsuario = (usuario) => {
    estado.usuario = usuario;
    estado.rol = usuario.rol;
    sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    document.getElementById('nombre-lateral').textContent =
        `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Mi cuenta';
    document.getElementById('rol-lateral').textContent =
        usuario.rol === 'admin' ? 'ADMINISTRADOR' : 'LECTOR';
    document.getElementById('avatar-usuario').textContent = iniciales(usuario.nombre || 'ASLA');
    document.getElementById('avatar-cabecera').textContent = iniciales(usuario.nombre || 'ASLA');
};

const irVista = (nombre) => {
    const permitidas = estado.rol === 'admin'
        ? Object.keys(catalogoMeta).filter((clave) =>
            !['inicio', 'catalogo', 'compras'].includes(clave)
        )
        : ['inicio', 'catalogo', 'prestamos', 'compras', 'perfil'];
    estado.vista = permitidas.includes(nombre)
        ? nombre
        : estado.rol === 'admin' ? 'dashboard' : 'inicio';
    estado.pagina = 1;
    dibujarNavegacion(estado.rol, estado.vista);
    document.getElementById('ruta-actual').textContent =
        catalogoMeta[estado.vista][0];
    document.title = `${catalogoMeta[estado.vista][0]} — ASLA Library`;
    cargarVista();
};

const dibujarDashboardAdmin = async () => {
    dibujarCarga('Resumen', catalogoMeta.dashboard[1]);
    const [librosResultado, prestamosResultado, ventasResultado, usuariosResultado] =
        await Promise.all([
            libros.listar({ pagina: 1, limite: 6, ordenar: 'id', direccion: 'desc' }),
            prestamos.listar({ pagina: 1, limite: 5 }),
            ventas.listar({ pagina: 1, limite: 5 }),
            usuarios.listar({ pagina: 1, limite: 1 })
        ]);
    const prestamosRecientes = prestamosResultado.datos || [];
    const ultimosPrestamos = crearTabla(
        ['Lector', 'Libro', 'Fecha límite', 'Estado'],
        prestamosRecientes.slice(0, 5).map((prestamo) => [
            `${prestamo.nombre || ''} ${prestamo.apellido || ''}`.trim(),
            prestamo.titulo,
            formatearFecha(prestamo.fecha_limite),
            htmlSeguro(etiqueta(
                humanizar(prestamo.estado),
                claseEstado(prestamo.estado === 'devuelto' ? 'devuelto' : prestamo.estado)
            ))
        ]),
        'Cuando registres préstamos, aparecerán aquí.'
    );
    const cantidadVencidos = prestamosRecientes.filter((registro) =>
        registro.estado === 'vencido'
    ).length;
    vista.innerHTML = `
        ${crearEncabezado('Resumen', 'Una mirada clara a lo que sucede en tu biblioteca.',
        '<button class="boton boton--acento" data-accion="nuevo-libro">＋ Agregar libro</button>')}
        <section class="tarjetas-indicadores" aria-label="Indicadores">
            ${[
        ['Libros en catálogo', librosResultado.total, 'Títulos registrados'],
        ['Préstamos', prestamosResultado.total, 'Registros históricos'],
        ['Ventas', ventasResultado.total, 'Ventas registradas'],
        ['Usuarios', usuariosResultado.total, 'Cuentas de la biblioteca']
    ].map(([nombre, valor, nota]) => `
                <article class="tarjeta-indicador">
                    <span class="indicador-etiqueta">${nombre}</span>
                    <strong class="indicador-valor">${Number(valor || 0).toLocaleString('es-GT')}</strong>
                    <span class="indicador-pie">${nota}</span>
                </article>`).join('')}
        </section>
        <div class="panel-resumen">
            <section class="panel-seccion">
                <header class="panel-seccion-cabecera">
                    <h2>Préstamos recientes</h2>
                    <a href="#prestamos" data-vista="prestamos">Ver todos →</a>
                </header>
                ${ultimosPrestamos}
                ${cantidadVencidos ? `<p class="aviso-superficie">${cantidadVencidos} préstamo(s) vencido(s) entre los registros recientes.</p>` : ''}
            </section>
            <section class="panel-seccion">
                <header class="panel-seccion-cabecera"><h2>Acceso rápido</h2></header>
                <div class="panel-acceso-rapido">
                    ${[
        ['libros', '▤', 'Nuevo libro'],
        ['prestamos', '↗', 'Registrar préstamo'],
        ['devoluciones', '↙', 'Devoluciones'],
        ['ventas', '◇', 'Nueva venta']
    ].map(([destino, icono, etiquetaAcceso]) => `
                        <a class="tarjeta-acceso" href="#${destino}" data-vista="${destino}">
                            <span aria-hidden="true">${icono}</span><strong>${etiquetaAcceso}</strong>
                        </a>`).join('')}
                </div>
            </section>
        </div>
        <section class="panel-seccion">
            <header class="panel-seccion-cabecera">
                <h2>Últimos títulos registrados</h2>
                <a href="#libros" data-vista="libros">Explorar catálogo →</a>
            </header>
            ${dibujarTarjetasLibros(librosResultado.datos || [], false)}
        </section>`;
};

const dibujarDashboardLector = async () => {
    dibujarCarga('Mi biblioteca', catalogoMeta.inicio[1]);
    const [perfil, prestamosResultado, comprasResultado] = await Promise.all([
        usuarios.perfil(),
        prestamos.listar({ propios: true, pagina: 1, limite: 5 }),
        ventas.listar({ propias: true, pagina: 1, limite: 5 })
    ]);
    guardarUsuario(perfil);
    const saludo = escaparHtml(perfil.nombre || 'lector');
    vista.innerHTML = `
        <section class="saludo-usuario">
            <p class="sobretitulo">TU PRÓXIMO CAPÍTULO</p>
            <h1>Qué gusto verte, <span>${saludo}.</span></h1>
            <p>Tu espacio de lectura te espera. Explora el catálogo y encuentra algo que te inspire.</p>
        </section>
        <section class="panel-seccion">
            <header class="panel-seccion-cabecera"><h2>Tu biblioteca, a un paso</h2></header>
            <div class="atajos-usuario">
                <a class="atajo-usuario" href="#catalogo" data-vista="catalogo"><span aria-hidden="true">⌕</span><strong>Explorar libros</strong><small>Descubre nuevos títulos</small></a>
                <a class="atajo-usuario" href="#prestamos" data-vista="prestamos"><span aria-hidden="true">↗</span><strong>Mis préstamos</strong><small>${prestamosResultado.total || 0} registro(s)</small></a>
                <a class="atajo-usuario" href="#compras" data-vista="compras"><span aria-hidden="true">◈</span><strong>Mis compras</strong><small>${comprasResultado.total || 0} registro(s)</small></a>
            </div>
        </section>
        <section class="panel-seccion">
            <header class="panel-seccion-cabecera">
                <h2>Una lectura para ti</h2><a href="#catalogo" data-vista="catalogo">Ver catálogo →</a>
            </header>
            <div id="recomendaciones" class="libro-grid"><span class="cargando-indicador">Buscando en el catálogo…</span></div>
        </section>`;
    try {
        const resultado = await libros.listar({ pagina: 1, limite: 3, ordenar: 'id', direccion: 'desc' });
        const recomendaciones = document.getElementById('recomendaciones');
        if (recomendaciones) {
            recomendaciones.innerHTML = dibujarTarjetasLibros(resultado.datos || [], true);
        }
    } catch (error) {
        const recomendaciones = document.getElementById('recomendaciones');
        if (recomendaciones) {
            recomendaciones.innerHTML = `<p class="texto-secundario">${escaparHtml(error.message)}</p>`;
        }
    }
};

const dibujarTarjetasLibros = (registros, permitirCompra) => {
    if (!registros.length) {
        return `<div class="estado-vacio panel-tarjeta"><strong>El catálogo está tomando forma</strong><p>Aún no hay títulos publicados.</p></div>`;
    }
    return `<div class="libro-grid">${registros.map((libro) => `
        <article class="libro-tarjeta">
            <span class="libro-tarjeta-categoria">${escaparHtml(libro.categoria || 'Biblioteca')}</span>
            <h2>${escaparHtml(libro.titulo)}</h2>
            <p>${escaparHtml(libro.autores?.map((autor) => autor.nombre).join(', ') || `ISBN ${libro.isbn}`)}</p>
            <div class="libro-tarjeta-pie">
                <span class="libro-tarjeta-precio">${formatearMoneda(libro.precio)}</span>
                <span class="libro-tarjeta-disponibilidad">${Number(libro.stock_venta || 0)} en stock</span>
                ${permitirCompra
        ? `<button class="boton boton--secundario boton--compacto" type="button" data-accion="comprar-libro" data-id="${Number(libro.id)}"${Number(libro.stock_venta) < 1 ? ' disabled' : ''}>Comprar</button>`
        : ''}
            </div>
        </article>`).join('')}</div>`;
};

const dibujarBarraHerramientas = ({ placeholder = 'Buscar título, ISBN o categoría', categorias = false, accion = '' } = {}) => `
    <div class="panel-herramientas">
        <div class="panel-herramientas-grupo">
            <label class="control-busqueda">
                <span aria-hidden="true">⌕</span>
                <input id="filtro-libros" type="search" value="${escaparHtml(estado.busqueda)}"
                    placeholder="${escaparHtml(placeholder)}" aria-label="Buscar">
            </label>
            ${categorias ? `<label class="control-filtro"><select id="filtro-categoria" aria-label="Filtrar por categoría">
                <option value="">Todas las categorías</option>
                ${opcionesSelect((awaitCategorias || []).map((categoria) => ({ valor: categoria.id, etiqueta: categoria.nombre })), estado.categoriaId)}
            </select></label>` : ''}
        </div>
        ${accion}
    </div>`;

let awaitCategorias = [];

const dibujarPaginacionLibros = (resultado) => paginacion(
    resultado.total,
    estado.pagina,
    Number(resultado.limite) || 20
);

const cargarLibros = async ({ admin = false } = {}) => {
    const nombreVista = admin ? 'libros' : 'catalogo';
    const [resultado, categorias] = await Promise.all([
        libros.listar({
            pagina: estado.pagina,
            limite: 20,
            busqueda: estado.busqueda,
            categoria_id: estado.categoriaId,
            ordenar: 'titulo',
            direccion: 'asc'
        }),
        libros.categorias()
    ]);
    awaitCategorias = categorias;
    const encabezados = ['Libro', 'Categoría', 'Precio', 'Venta', 'Préstamo'];
    let filas = (resultado.datos || []).map((libro) => {
        const libroTitulo = `<strong class="tabla-principal">${escaparHtml(libro.titulo)}</strong><span class="tabla-secundario">${escaparHtml(libro.autores?.map((autor) => autor.nombre).join(', ') || `ISBN ${libro.isbn}`)}</span>`;
        const stockVenta = Number(libro.stock_venta || 0);
        const disponibles = Number(libro.ejemplares_disponibles || 0);
        const celdas = [
            htmlSeguro(libroTitulo),
            libro.categoria,
            formatearMoneda(libro.precio),
            `${stockVenta} ejemplar(es)`,
            `${disponibles} disponible(s)`
        ];
        if (admin) {
            celdas.push(htmlSeguro(`<div class="tabla-acciones">
                ${botonAccion('editar-libro', libro.id, 'Editar libro', '✎')}
                ${botonAccion('inventario-libro', libro.id, 'Ajustar inventario', '＋')}
                ${botonAccion('movimientos-libro', libro.id, 'Ver movimientos', '↻')}
                ${botonAccion('eliminar-libro', libro.id, 'Eliminar libro', '×', true)}
            </div>`));
        } else {
            celdas.push(htmlSeguro(`<button class="boton boton--secundario boton--compacto" type="button"
                data-accion="comprar-libro" data-id="${Number(libro.id)}"${stockVenta < 1 ? ' disabled' : ''}>Comprar</button>`));
        }
        return celdas;
    });
    const cabecera = crearEncabezado(
        catalogoMeta[nombreVista][0],
        admin ? 'Gestiona títulos, disponibilidad y existencias.' : 'Busca por título, autor, ISBN o categoría.',
        admin ? '<button class="boton boton--acento" data-accion="nuevo-libro">＋ Agregar libro</button>' : ''
    );
    const barra = `
        <div class="panel-herramientas">
            <div class="panel-herramientas-grupo">
                <label class="control-busqueda"><span aria-hidden="true">⌕</span>
                    <input id="filtro-libros" type="search" value="${escaparHtml(estado.busqueda)}"
                        placeholder="Buscar título, ISBN o categoría" aria-label="Buscar libros">
                </label>
                <label class="control-filtro"><select id="filtro-categoria" aria-label="Filtrar por categoría">
                    <option value="">Todas las categorías</option>
                    ${opcionesSelect(categorias.map((categoria) => ({
        valor: categoria.id,
        etiqueta: categoria.nombre
    })), estado.categoriaId)}
                </select></label>
            </div>
            ${admin ? `<div class="panel-herramientas-grupo">
                <button class="boton boton--secundario boton--compacto" data-accion="nueva-categoria">＋ Categoría</button>
                <button class="boton boton--secundario boton--compacto" data-accion="nuevo-autor">＋ Autor</button>
            </div>` : ''}
        </div>`;
    vista.innerHTML = `${cabecera}${barra}${crearTabla(
        admin ? [...encabezados, 'Acciones'] : encabezados,
        filas,
        'No encontramos títulos con esos filtros.'
    )}${dibujarPaginacionLibros(resultado)}`;
};

const dibujarPrestamos = async ({ devoluciones = false, propios = false, usuarioId = null } = {}) => {
    const resultado = await prestamos.listar({
        propios,
        pagina: estado.pagina,
        limite: 20,
        usuarioId
    });
    let registros = resultado.datos || [];
    if (devoluciones) {
        registros = registros.filter((registro) =>
            registro.estado === 'prestado' || registro.estado === 'vencido'
        );
    }
    const filas = registros.map((registro) => {
        const estadoPrestamo = registro.estado;
        const datos = [
            `#${registro.id}`,
            `${registro.nombre || ''} ${registro.apellido || ''}`.trim() || `Lector #${registro.usuario_id}`,
            registro.titulo,
            formatearFecha(registro.fecha_prestamo),
            formatearFecha(registro.fecha_limite),
            htmlSeguro(etiqueta(humanizar(estadoPrestamo), claseEstado(estadoPrestamo)))
        ];
        if (!propios && estado.rol === 'admin') {
            datos.push(htmlSeguro(estadoPrestamo === 'prestado' || estadoPrestamo === 'vencido'
                ? botonAccion('devolver-prestamo', registro.id, 'Registrar devolución', '↙')
                : '—'));
        }
        return datos;
    });
    const tabla = crearTabla(
        ['Préstamo', 'Lector', 'Libro', 'Fecha', 'Devolución prevista', 'Estado',
            ...(!propios && estado.rol === 'admin' ? ['Acción'] : [])],
        filas,
        devoluciones ? 'No hay devoluciones pendientes.' : 'Aún no hay préstamos registrados.'
    );
    if (usuarioId) {
        return tabla;
    }
    const titulo = propios ? 'Mis préstamos' : devoluciones ? 'Devoluciones' : 'Préstamos';
    vista.innerHTML = `
        ${crearEncabezado(
        titulo,
        propios ? 'Consulta el estado y las fechas de tus préstamos.' : devoluciones
            ? 'Registra la devolución de ejemplares y consulta los vencidos.'
            : 'Administra préstamos activos y el historial de ejemplares.',
        !propios && estado.rol === 'admin'
            ? '<button class="boton boton--acento" data-accion="nuevo-prestamo">＋ Registrar préstamo</button>'
            : ''
    )}
        ${tabla}${!devoluciones ? paginacion(resultado.total, estado.pagina) : ''}`;
};

const dibujarVentas = async ({ propias = false, usuarioId = null } = {}) => {
    const resultado = await ventas.listar({
        propias,
        pagina: estado.pagina,
        limite: 20,
        usuarioId
    });
    const filas = (resultado.datos || []).map((venta) => [
        `#${venta.id}`,
        venta.usuario_id
            ? `Usuario #${venta.usuario_id}`
            : venta.nombre_cliente || '—',
        (venta.libros || []).map((libro) =>
            `${escaparHtml(libro.titulo)} × ${Number(libro.cantidad)}`
        ).join('<br>') || '—',
        formatearFecha(venta.fecha_venta, {
            hour: '2-digit',
            minute: '2-digit'
        }),
        htmlSeguro(`<strong class="tabla-principal">${formatearMoneda(venta.total)}</strong>`)
    ].map((celda) => typeof celda === 'string' && celda.includes('<br>')
        ? htmlSeguro(celda)
        : celda));
    const tabla = crearTabla(
        ['Venta', propias ? 'Cuenta' : 'Cliente', 'Libros', 'Fecha', 'Total'],
        filas,
        'Cuando registres una compra, quedará disponible aquí.'
    );
    if (usuarioId) {
        return tabla;
    }
    vista.innerHTML = `
        ${crearEncabezado(
        propias ? 'Mis compras' : 'Ventas',
        propias ? 'Consulta los títulos y totales de tus compras.' : 'Registra ventas de uno o varios títulos y revisa el historial.',
        !propias ? '<button class="boton boton--acento" data-accion="nueva-venta">＋ Registrar venta</button>' : ''
    )}
        ${tabla}${paginacion(resultado.total, estado.pagina)}`;
};

const dibujarInventario = async () => {
    const resultado = await libros.listar({
        pagina: estado.pagina,
        limite: 20,
        busqueda: estado.busqueda,
        ordenar: 'titulo',
        direccion: 'asc'
    });
    const filas = (resultado.datos || []).map((libro) => [
        `<strong class="tabla-principal">${escaparHtml(libro.titulo)}</strong><span class="tabla-secundario">${escaparHtml(libro.isbn)}</span>`,
        libro.categoria,
        `${Number(libro.stock_venta || 0)} para venta`,
        `${Number(libro.ejemplares_disponibles || 0)} disponibles`,
        htmlSeguro(`<div class="tabla-acciones">
            ${botonAccion('inventario-libro', libro.id, 'Añadir existencias de venta', '＋')}
            ${botonAccion('crear-ejemplares', libro.id, 'Crear ejemplares para préstamo', '▤')}
            ${botonAccion('movimientos-libro', libro.id, 'Ver historial de movimientos', '↻')}
        </div>`)
    ]);
    vista.innerHTML = `
        ${crearEncabezado('Inventario', 'Controla por separado las existencias de venta y los ejemplares de préstamo.')}
        <div class="panel-herramientas">
            <label class="control-busqueda"><span aria-hidden="true">⌕</span>
                <input id="filtro-libros" type="search" value="${escaparHtml(estado.busqueda)}"
                    placeholder="Buscar título o ISBN" aria-label="Buscar inventario">
            </label>
            <span class="texto-secundario">Las entradas quedan registradas en el historial.</span>
        </div>
        ${crearTabla(['Libro', 'Categoría', 'Venta', 'Préstamo', 'Acciones'], filas, 'Aún no hay libros en el catálogo.')}
        ${dibujarPaginacionLibros(resultado)}`;
};

const dibujarUsuarios = async ({ clientes = false } = {}) => {
    const resultado = await usuarios.listar({
        pagina: estado.pagina,
        limite: 100,
        busqueda: estado.busqueda
    });
    let registros = resultado.datos || [];
    if (clientes) {
        registros = registros.filter((usuario) => usuario.rol === 'lector');
    }
    const filas = registros.map((usuario) => [
        `<strong class="tabla-principal">${escaparHtml(`${usuario.nombre} ${usuario.apellido}`)}</strong><span class="tabla-secundario">${escaparHtml(usuario.email)}</span>`,
        usuario.identificacion,
        usuario.telefono || '—',
        htmlSeguro(etiqueta(
            usuario.activo ? 'Activa' : 'Inactiva',
            usuario.activo ? 'etiqueta-estado--positivo' : 'etiqueta-estado--error'
        )),
        formatearFecha(usuario.creado_en),
        htmlSeguro(`<div class="tabla-acciones">
            ${botonAccion('editar-usuario', usuario.id, 'Editar información', '✎')}
            ${botonAccion('historial-usuario', usuario.id, 'Consultar historial', '◷')}
            ${botonAccion('estado-usuario', usuario.id, usuario.activo ? 'Desactivar cuenta' : 'Activar cuenta', usuario.activo ? '−' : '✓')}
        </div>`)
    ]);
    vista.innerHTML = `
        ${crearEncabezado(
        clientes ? 'Clientes' : 'Usuarios',
        clientes ? 'Lectores registrados como clientes de ASLA Library.' : 'Consulta los lectores y administra sus cuentas.'
    )}
        <div class="panel-herramientas">
            <label class="control-busqueda"><span aria-hidden="true">⌕</span>
                <input id="filtro-usuarios" type="search" value="${escaparHtml(estado.busqueda)}"
                    placeholder="Buscar por nombre, identificación o correo" aria-label="Buscar usuarios">
            </label>
            <span class="texto-secundario">${clientes ? `${registros.length} lector(es) en esta página` : `${resultado.total} cuenta(s)`}</span>
        </div>
        ${crearTabla(['Persona', 'Identificación', 'Teléfono', 'Cuenta', 'Registro', 'Acciones'], filas, 'No hay personas que coincidan con la búsqueda.')}
        ${paginacion(resultado.total, estado.pagina, 100)}`;
};

const dibujarPerfil = async () => {
    const perfil = await usuarios.perfil();
    guardarUsuario(perfil);
    vista.innerHTML = `
        ${crearEncabezado('Mi perfil', 'Mantén tus datos actualizados para una mejor experiencia.')}
        <form class="panel-tarjeta perfil-edicion" id="form-perfil">
            <div class="formulario-dos-columnas">
                <label class="campo"><span>Identificación</span><input value="${escaparHtml(perfil.identificacion)}" disabled></label>
                <label class="campo"><span>Correo electrónico</span><input name="email" type="email" autocomplete="email" maxlength="120" value="${escaparHtml(perfil.email)}" required></label>
            </div>
            <div class="formulario-dos-columnas">
                <label class="campo"><span>Nombre</span><input name="nombre" autocomplete="given-name" maxlength="50" value="${escaparHtml(perfil.nombre)}" required></label>
                <label class="campo"><span>Apellido</span><input name="apellido" autocomplete="family-name" maxlength="50" value="${escaparHtml(perfil.apellido)}" required></label>
            </div>
            <div class="formulario-dos-columnas">
                <label class="campo"><span>Teléfono</span><input name="telefono" type="tel" autocomplete="tel" maxlength="20" value="${escaparHtml(perfil.telefono || '')}"></label>
                <label class="campo"><span>Dirección</span><input name="direccion" autocomplete="street-address" maxlength="200" value="${escaparHtml(perfil.direccion || '')}"></label>
            </div>
            <label class="campo"><span>Nueva contraseña <small>Déjala en blanco para conservar la actual</small></span><input name="contrasena" type="password" autocomplete="new-password" minlength="8" placeholder="••••••••"></label>
            <div class="aviso-superficie"><span aria-hidden="true">i</span><p>Tu identificación y rol son administrados por ASLA y no se pueden editar desde el perfil.</p></div>
            <div class="perfil-edicion-acciones"><button class="boton boton--acento" type="submit">Guardar cambios</button></div>
        </form>`;
};

const cargarVista = async () => {
    const nombreVista = estado.vista;
    try {
        switch (nombreVista) {
            case 'dashboard':
                await dibujarDashboardAdmin();
                break;
            case 'inicio':
                await dibujarDashboardLector();
                break;
            case 'libros':
                dibujarCarga('Libros', catalogoMeta.libros[1]);
                await cargarLibros({ admin: true });
                break;
            case 'catalogo':
                dibujarCarga('Explorar libros', catalogoMeta.catalogo[1]);
                await cargarLibros();
                break;
            case 'prestamos':
                dibujarCarga(nombreVista === 'prestamos' && estado.rol === 'lector' ? 'Mis préstamos' : 'Préstamos', catalogoMeta.prestamos[1]);
                await dibujarPrestamos({ propios: estado.rol !== 'admin' });
                break;
            case 'devoluciones':
                dibujarCarga('Devoluciones', catalogoMeta.devoluciones[1]);
                await dibujarPrestamos({ devoluciones: true });
                break;
            case 'ventas':
                dibujarCarga('Ventas', catalogoMeta.ventas[1]);
                await dibujarVentas();
                break;
            case 'compras':
                dibujarCarga('Mis compras', catalogoMeta.compras[1]);
                await dibujarVentas({ propias: true });
                break;
            case 'inventario':
                dibujarCarga('Inventario', catalogoMeta.inventario[1]);
                await dibujarInventario();
                break;
            case 'usuarios':
                dibujarCarga('Usuarios', catalogoMeta.usuarios[1]);
                await dibujarUsuarios();
                break;
            case 'clientes':
                dibujarCarga('Clientes', catalogoMeta.clientes[1]);
                await dibujarUsuarios({ clientes: true });
                break;
            case 'perfil':
                dibujarCarga('Mi perfil', catalogoMeta.perfil[1]);
                await dibujarPerfil();
                break;
            default:
                irVista(estado.rol === 'admin' ? 'dashboard' : 'inicio');
        }
    } catch (error) {
        dibujarError(error);
    }
};

const abrirFormularioLibro = async (id = null) => {
    const [categorias, autores, libro] = await Promise.all([
        libros.categorias(),
        libros.autores(),
        id ? libros.obtener(id) : Promise.resolve(null)
    ]);
    const seleccionados = new Set((libro?.autores || []).map((autor) => Number(autor.id)));
    abrirModal(`
        <h2>${libro ? 'Editar libro' : 'Agregar libro'}</h2>
        <p>Completa la información del catálogo. Las existencias se administran por separado.</p>
        <form class="modal-formulario" id="form-libro">
            <input type="hidden" name="id" value="${libro ? Number(libro.id) : ''}">
            <label class="campo"><span>ISBN</span><input name="isbn" required maxlength="17" value="${escaparHtml(libro?.isbn || '')}" placeholder="9780000000000"></label>
            <label class="campo"><span>Título</span><input name="titulo" required maxlength="200" value="${escaparHtml(libro?.titulo || '')}" placeholder="Título del libro"></label>
            <div class="formulario-dos-columnas">
                <label class="campo"><span>Categoría</span><select name="categoria_id" required><option value="">Selecciona una categoría</option>${opcionesSelect(categorias.map((categoria) => ({ valor: categoria.id, etiqueta: categoria.nombre })), libro?.categoria_id)}</select></label>
                <label class="campo"><span>Precio de venta</span><input name="precio" type="number" min="0" step="0.01" required value="${escaparHtml(libro?.precio || '')}" placeholder="0.00"></label>
            </div>
            <label class="campo"><span>Fecha de publicación <small>Opcional</small></span><input name="fecha_publicacion" type="date" value="${escaparHtml(libro?.fecha_publicacion || '')}"></label>
            <label class="campo"><span>Autores <small>Ctrl o ⌘ para seleccionar varios</small></span>
                <select name="autores_ids" multiple size="${Math.max(3, Math.min(autores.length, 6))}">
                    ${opcionesSelect(autores.map((autor) => ({ valor: autor.id, etiqueta: autor.nombre })))}
                </select>
            </label>
            ${autores.length ? '' : '<p class="texto-secundario">Aún no hay autores. Guarda el libro y agrega autores desde la sección de catálogo.</p>'}
            <div class="modal-acciones"><button class="boton boton--secundario" type="button" data-accion="cerrar-modal">Cancelar</button><button class="boton boton--acento" type="submit">${libro ? 'Guardar cambios' : 'Crear libro'}</button></div>
        </form>`);
    const selectorAutores = document.querySelector('#form-libro [name="autores_ids"]');
    if (selectorAutores) {
        for (const opcion of selectorAutores.options) {
            opcion.selected = seleccionados.has(Number(opcion.value));
        }
    }
};

const abrirFormularioExistencias = async (id) => {
    const libro = await libros.obtener(id);
    abrirModal(`
        <h2>Añadir existencias</h2>
        <p>${escaparHtml(libro.titulo)} · Stock actual: ${Number(libro.stock_venta || 0)}</p>
        <form class="modal-formulario" id="form-existencias">
            <input type="hidden" name="libro_id" value="${Number(libro.id)}">
            <label class="campo"><span>Cantidad</span><input name="cantidad" type="number" min="1" max="1000" required placeholder="1"></label>
            <label class="campo"><span>Motivo <small>Opcional</small></span><input name="motivo" maxlength="200" placeholder="Recepción de ejemplares"></label>
            <div class="modal-acciones"><button class="boton boton--secundario" type="button" data-accion="cerrar-modal">Cancelar</button><button class="boton boton--acento" type="submit">Registrar entrada</button></div>
        </form>`);
};

const abrirFormularioCopias = async (id) => {
    const libro = await libros.obtener(id);
    abrirModal(`
        <h2>Crear ejemplares de préstamo</h2>
        <p>${escaparHtml(libro.titulo)} · ${Number(libro.ejemplares_disponibles || 0)} ejemplar(es) disponible(s).</p>
        <form class="modal-formulario" id="form-ejemplares">
            <input type="hidden" name="libro_id" value="${Number(libro.id)}">
            <label class="campo"><span>Número de ejemplares</span><input name="cantidad" type="number" min="1" max="1000" required placeholder="1"></label>
            <div class="modal-acciones"><button class="boton boton--secundario" type="button" data-accion="cerrar-modal">Cancelar</button><button class="boton boton--acento" type="submit">Crear ejemplares</button></div>
        </form>`);
};

const abrirFormularioPrestamo = async () => {
    const [resultadoUsuarios, resultadoLibros] = await Promise.all([
        usuarios.listar({ pagina: 1, limite: 100 }),
        libros.listar({ pagina: 1, limite: 100, ordenar: 'titulo', direccion: 'asc' })
    ]);
    const lectores = resultadoUsuarios.datos.filter((usuario) =>
        usuario.rol === 'lector' && usuario.activo
    );
    const opcionesLibros = (resultadoLibros.datos || []).map((libro) => ({
        valor: libro.id,
        etiqueta: `${libro.titulo} · ${Number(libro.ejemplares_disponibles || 0)} disponible(s)`
    }));
    abrirModal(`
        <h2>Registrar préstamo</h2>
        <p>Elige al lector, un libro y uno de sus ejemplares disponibles.</p>
        <form class="modal-formulario" id="form-prestamo">
            <label class="campo"><span>Lector</span><select name="usuario_id" required><option value="">Selecciona un lector</option>${opcionesSelect(lectores.map((lector) => ({ valor: lector.id, etiqueta: `${lector.nombre} ${lector.apellido} · ${lector.identificacion}` })))}</select></label>
            <label class="campo"><span>Libro</span><select name="libro_id" id="libro-prestamo" required><option value="">Selecciona un libro</option>${opcionesSelect(opcionesLibros)}</select></label>
            <label class="campo"><span>Ejemplar disponible</span><select name="ejemplar_id" id="ejemplar-prestamo" required disabled><option value="">Primero selecciona un libro</option></select></label>
            <label class="campo"><span>Fecha límite de devolución</span><input name="fecha_limite" type="date" required></label>
            ${lectores.length ? '' : '<div class="aviso-superficie"><p>No hay lectores activos para registrar el préstamo.</p></div>'}
            <div class="modal-acciones"><button class="boton boton--secundario" type="button" data-accion="cerrar-modal">Cancelar</button><button class="boton boton--acento" type="submit"${lectores.length ? '' : ' disabled'}>Registrar préstamo</button></div>
        </form>`);
    const fechaLimite = document.querySelector('#form-prestamo [name="fecha_limite"]');
    const fechaSugerida = new Date();
    fechaSugerida.setDate(fechaSugerida.getDate() + 14);
    fechaLimite.value = [
        fechaSugerida.getFullYear(),
        String(fechaSugerida.getMonth() + 1).padStart(2, '0'),
        String(fechaSugerida.getDate()).padStart(2, '0')
    ].join('-');
    document.getElementById('libro-prestamo').addEventListener('change', async (evento) => {
        const selectorEjemplar = document.getElementById('ejemplar-prestamo');
        selectorEjemplar.disabled = true;
        selectorEjemplar.innerHTML = '<option value="">Buscando ejemplares…</option>';
        if (!evento.target.value) {
            selectorEjemplar.innerHTML = '<option value="">Primero selecciona un libro</option>';
            return;
        }
        try {
            const ejemplares = await libros.ejemplares(evento.target.value);
            const disponibles = ejemplares.filter((ejemplar) =>
                Number(ejemplar.disponible) === 1 && ejemplar.estado === 'operativo'
            );
            selectorEjemplar.innerHTML = disponibles.length
                ? `<option value="">Selecciona un ejemplar</option>${opcionesSelect(disponibles.map((ejemplar) => ({
                    valor: ejemplar.id,
                    etiqueta: `Ejemplar #${ejemplar.id}`
                })))}`
                : '<option value="">No hay ejemplares disponibles</option>';
            selectorEjemplar.disabled = !disponibles.length;
        } catch (error) {
            selectorEjemplar.innerHTML = '<option value="">No fue posible consultar ejemplares</option>';
            notificar(error.message, 'error');
        }
    });
};

const abrirFormularioVenta = async () => {
    const [resultadoLibros, resultadoUsuarios] = await Promise.all([
        libros.listar({ pagina: 1, limite: 100, ordenar: 'titulo', direccion: 'asc' }),
        usuarios.listar({ pagina: 1, limite: 100 })
    ]);
    const disponibles = (resultadoLibros.datos || []).filter((libro) =>
        Number(libro.stock_venta) > 0
    );
    const lectores = resultadoUsuarios.datos.filter((usuario) =>
        usuario.rol === 'lector' && usuario.activo
    );
    const carrito = [];
    abrirModal(`
        <h2>Registrar venta</h2>
        <p>Agrega uno o varios libros. El precio definitivo se calcula en el servidor.</p>
        <form class="modal-formulario" id="form-venta">
            <div class="formulario-dos-columnas">
                <label class="campo"><span>Tipo de cliente</span><select name="tipo_cliente" id="tipo-cliente"><option value="registrado">Cuenta registrada</option><option value="mostrador">Venta de mostrador</option></select></label>
                <label class="campo" id="grupo-usuario-venta"><span>Cliente</span><select name="usuario_id"><option value="">Selecciona un lector</option>${opcionesSelect(lectores.map((lector) => ({ valor: lector.id, etiqueta: `${lector.nombre} ${lector.apellido}` })))}</select></label>
            </div>
            <label class="campo" id="grupo-nombre-cliente" hidden><span>Nombre del cliente</span><input name="nombre_cliente" maxlength="100" placeholder="Nombre para la factura"></label>
            <div class="formulario-en-linea">
                <label class="campo"><span>Libro</span><select id="libro-carrito"><option value="">Selecciona un libro</option>${opcionesSelect(disponibles.map((libro) => ({ valor: libro.id, etiqueta: `${libro.titulo} · ${formatearMoneda(libro.precio)} · stock ${libro.stock_venta}` })))}</select></label>
                <label class="campo"><span>Cantidad</span><input id="cantidad-carrito" type="number" min="1" value="1"></label>
                <button class="boton boton--secundario" type="button" id="agregar-carrito">Agregar</button>
            </div>
            <div id="lineas-carrito"><p class="texto-secundario">El carrito está vacío.</p></div>
            <div class="carrito-total"><span>Total estimado · el servidor confirma el total</span><strong id="total-carrito">${formatearMoneda(0)}</strong></div>
            <div class="modal-acciones"><button class="boton boton--secundario" type="button" data-accion="cerrar-modal">Cancelar</button><button class="boton boton--acento" type="submit" disabled>Confirmar venta</button></div>
        </form>`);

    const selectorTipo = document.getElementById('tipo-cliente');
    const grupoUsuario = document.getElementById('grupo-usuario-venta');
    const grupoNombre = document.getElementById('grupo-nombre-cliente');
    const actualizarTipoCliente = () => {
        const mostrador = selectorTipo.value === 'mostrador';
        grupoUsuario.hidden = mostrador;
        grupoNombre.hidden = !mostrador;
        grupoUsuario.querySelector('select').required = !mostrador;
        grupoNombre.querySelector('input').required = mostrador;
    };
    selectorTipo.addEventListener('change', actualizarTipoCliente);
    actualizarTipoCliente();

    const dibujarCarrito = () => {
        const contenedor = document.getElementById('lineas-carrito');
        const total = carrito.reduce((suma, linea) =>
            suma + Number(linea.libro.precio) * linea.cantidad, 0
        );
        contenedor.innerHTML = carrito.length
            ? carrito.map((linea) => `
                <div class="carrito-linea">
                    <span class="carrito-titulo">${escaparHtml(linea.libro.titulo)}<small>${formatearMoneda(linea.libro.precio)} c/u</small></span>
                    <input type="number" min="1" max="${Number(linea.libro.stock_venta)}" value="${linea.cantidad}"
                        aria-label="Cantidad de ${escaparHtml(linea.libro.titulo)}" data-cantidad-libro="${Number(linea.libro.id)}">
                    <span>${formatearMoneda(Number(linea.libro.precio) * linea.cantidad)}</span>
                    <button class="boton boton--icono boton--peligro" type="button" data-quitar-linea="${Number(linea.libro.id)}" aria-label="Quitar ${escaparHtml(linea.libro.titulo)}">×</button>
                </div>`).join('')
            : '<p class="texto-secundario">El carrito está vacío.</p>';
        document.getElementById('total-carrito').textContent = formatearMoneda(total);
        document.querySelector('#form-venta [type="submit"]').disabled = !carrito.length;
    };
    document.getElementById('agregar-carrito').addEventListener('click', () => {
        const idLibro = Number(document.getElementById('libro-carrito').value);
        const cantidad = Number(document.getElementById('cantidad-carrito').value);
        const libro = disponibles.find((registro) => Number(registro.id) === idLibro);
        if (!libro || !Number.isInteger(cantidad) || cantidad < 1) {
            notificar('Selecciona un libro y una cantidad válida.', 'aviso');
            return;
        }
        const lineaActual = carrito.find((linea) => Number(linea.libro.id) === idLibro);
        const nuevaCantidad = cantidad + (lineaActual?.cantidad || 0);
        if (nuevaCantidad > Number(libro.stock_venta)) {
            notificar('La cantidad supera las existencias disponibles.', 'aviso');
            return;
        }
        if (lineaActual) {
            lineaActual.cantidad = nuevaCantidad;
        } else {
            carrito.push({ libro, cantidad });
        }
        dibujarCarrito();
    });
    document.getElementById('lineas-carrito').addEventListener('input', (evento) => {
        const idLibro = Number(evento.target.dataset.cantidadLibro);
        if (!idLibro) {
            return;
        }
        const linea = carrito.find((registro) => Number(registro.libro.id) === idLibro);
        const cantidad = Number(evento.target.value);
        if (linea && Number.isInteger(cantidad) && cantidad > 0
            && cantidad <= Number(linea.libro.stock_venta)) {
            linea.cantidad = cantidad;
            dibujarCarrito();
        }
    });
    document.getElementById('lineas-carrito').addEventListener('click', (evento) => {
        const botonQuitar = evento.target.closest('[data-quitar-linea]');
        if (!botonQuitar) {
            return;
        }
        const idLibro = Number(botonQuitar.dataset.quitarLinea);
        carrito.splice(carrito.findIndex((linea) =>
            Number(linea.libro.id) === idLibro
        ), 1);
        dibujarCarrito();
    });
    document.getElementById('form-venta').addEventListener('submit', async (evento) => {
        evento.preventDefault();
        await procesarFormularioVenta(evento.currentTarget, carrito);
    });
};

const procesarFormularioVenta = async (formulario, carrito) => {
    if (!formulario.reportValidity()) {
        return;
    }
    const boton = formulario.querySelector('[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Registrando…';
    try {
        const tipoCliente = formulario.elements.tipo_cliente.value;
        const datosVenta = {
            libros: carrito.map((linea) => ({
                libro_id: Number(linea.libro.id),
                cantidad: linea.cantidad
            }))
        };
        if (tipoCliente === 'mostrador') {
            datosVenta.nombre_cliente = formulario.elements.nombre_cliente.value.trim();
        } else {
            datosVenta.usuario_id = Number(formulario.elements.usuario_id.value);
        }
        const resultado = await ventas.crear(datosVenta);
        cerrarModal();
        notificar(`Venta #${resultado.id} registrada. Total confirmado: ${formatearMoneda(resultado.total)}.`);
        await cargarVista();
    } catch (error) {
        notificar(error.message, 'error');
        boton.disabled = false;
        boton.textContent = 'Confirmar venta';
    }
};

const abrirCompraLector = async (id) => {
    const libro = await libros.obtener(id);
    abrirModal(`
        <h2>Agregar a mis compras</h2>
        <p>${escaparHtml(libro.titulo)} · ${formatearMoneda(libro.precio)} · ${Number(libro.stock_venta)} disponible(s)</p>
        <form class="modal-formulario" id="form-compra">
            <input type="hidden" name="libro_id" value="${Number(libro.id)}">
            <label class="campo"><span>Cantidad</span><input name="cantidad" type="number" min="1" max="${Number(libro.stock_venta)}" value="1" required></label>
            <p class="texto-secundario">El importe final se calcula de forma segura en el servidor.</p>
            <div class="modal-acciones"><button class="boton boton--secundario" type="button" data-accion="cerrar-modal">Cancelar</button><button class="boton boton--acento" type="submit">Confirmar compra</button></div>
        </form>`);
};

const abrirEdicionUsuario = async (id) => {
    const usuario = await usuarios.obtener(id);
    abrirModal(`
        <h2>Actualizar usuario</h2>
        <p>La identificación y el rol no se pueden modificar desde esta vista.</p>
        <form class="modal-formulario" id="form-usuario">
            <input type="hidden" name="id" value="${Number(usuario.id)}">
            <div class="formulario-dos-columnas">
                <label class="campo"><span>Nombre</span><input name="nombre" maxlength="50" required value="${escaparHtml(usuario.nombre)}"></label>
                <label class="campo"><span>Apellido</span><input name="apellido" maxlength="50" required value="${escaparHtml(usuario.apellido)}"></label>
            </div>
            <label class="campo"><span>Correo</span><input name="email" type="email" maxlength="120" required value="${escaparHtml(usuario.email)}"></label>
            <div class="formulario-dos-columnas">
                <label class="campo"><span>Teléfono</span><input name="telefono" maxlength="20" value="${escaparHtml(usuario.telefono || '')}"></label>
                <label class="campo"><span>Dirección</span><input name="direccion" maxlength="200" value="${escaparHtml(usuario.direccion || '')}"></label>
            </div>
            <label class="campo"><span>Nueva contraseña <small>Opcional</small></span><input name="contrasena" type="password" minlength="8" autocomplete="new-password"></label>
            <div class="modal-acciones"><button class="boton boton--secundario" type="button" data-accion="cerrar-modal">Cancelar</button><button class="boton boton--acento" type="submit">Guardar</button></div>
        </form>`);
};

const abrirFormularioNombre = (tipo) => {
    const esCategoria = tipo === 'categoria';
    abrirModal(`
        <h2>Agregar ${esCategoria ? 'categoría' : 'autor'}</h2>
        <p>El nuevo registro estará disponible en el catálogo.</p>
        <form class="modal-formulario" id="form-${tipo}">
            <label class="campo"><span>Nombre</span><input name="nombre" maxlength="100" required placeholder="${esCategoria ? 'Nombre de la categoría' : 'Nombre del autor'}"></label>
            <div class="modal-acciones"><button class="boton boton--secundario" type="button" data-accion="cerrar-modal">Cancelar</button><button class="boton boton--acento" type="submit">Guardar</button></div>
        </form>`);
};

const mostrarMovimientos = async (id) => {
    const [libro, resultado] = await Promise.all([
        libros.obtener(id),
        libros.movimientos(id)
    ]);
    const filas = (resultado.datos || []).map((movimiento) => [
        formatearFecha(movimiento.creado_en, { hour: '2-digit', minute: '2-digit' }),
        htmlSeguro(etiqueta(humanizar(movimiento.tipo), claseEstado(movimiento.tipo === 'entrada' ? 'disponible' : 'prestado'))),
        `${Number(movimiento.cantidad) > 0 ? '+' : ''}${Number(movimiento.cantidad)}`,
        movimiento.motivo || '—',
        `${movimiento.usuario_nombre || ''} ${movimiento.usuario_apellido || ''}`.trim() || 'Sistema'
    ]);
    abrirModal(`
        <h2>Movimientos de inventario</h2>
        <p>${escaparHtml(libro.titulo)}</p>
        ${crearTabla(['Fecha', 'Movimiento', 'Cantidad', 'Motivo', 'Registrado por'], filas, 'Este libro aún no tiene movimientos de inventario.')}`);
};

const mostrarHistorialUsuario = async (id) => {
    const usuario = await usuarios.obtener(id);
    const [resultadoPrestamos, resultadoVentas] = await Promise.all([
        prestamos.listar({ usuarioId: id, pagina: 1, limite: 100 }),
        ventas.listar({ usuarioId: id, pagina: 1, limite: 100 })
    ]);
    const filasPrestamos = (resultadoPrestamos.datos || []).map((prestamo) => [
        prestamo.titulo,
        formatearFecha(prestamo.fecha_prestamo),
        formatearFecha(prestamo.fecha_limite),
        humanizar(prestamo.estado)
    ]);
    const filasVentas = (resultadoVentas.datos || []).map((venta) => [
        `#${venta.id}`,
        (venta.libros || []).map((libro) =>
            `${escaparHtml(libro.titulo)} × ${Number(libro.cantidad)}`
        ).join('<br>') || '—',
        formatearFecha(venta.fecha_venta),
        htmlSeguro(`<strong class="tabla-principal">${formatearMoneda(venta.total)}</strong>`)
    ].map((celda) => typeof celda === 'string' && celda.includes('<br>')
        ? htmlSeguro(celda)
        : celda));
    abrirModal(`
        <h2>Actividad del lector</h2>
        <p>${escaparHtml(`${usuario.nombre} ${usuario.apellido}`)} · ${escaparHtml(usuario.email)}</p>
        <section class="panel-seccion"><header class="panel-seccion-cabecera"><h2>Préstamos (${resultadoPrestamos.total})</h2></header>
            ${crearTabla(['Libro', 'Préstamo', 'Devolución prevista', 'Estado'], filasPrestamos, 'Sin préstamos registrados.')}</section>
        <section class="panel-seccion"><header class="panel-seccion-cabecera"><h2>Compras (${resultadoVentas.total})</h2></header>
            ${crearTabla(['Venta', 'Libros', 'Fecha', 'Total'], filasVentas, 'Sin compras registradas.')}</section>`);
};

const procesarFormulario = async (formulario) => {
    if (!formulario.reportValidity()) {
        return;
    }
    const boton = formulario.querySelector('[type="submit"]');
    const textoOriginal = boton?.textContent || 'Guardar';
    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Guardando…';
    }
    const datos = new FormData(formulario);
    try {
        switch (formulario.id) {
            case 'form-libro': {
                const id = datos.get('id');
                const autorIds = Array.from(
                    formulario.elements.autores_ids.selectedOptions,
                    (opcion) => Number(opcion.value)
                );
                const libro = {
                    isbn: datos.get('isbn').trim(),
                    titulo: datos.get('titulo').trim(),
                    categoria_id: Number(datos.get('categoria_id')),
                    precio: Number(datos.get('precio')),
                    fecha_publicacion: datos.get('fecha_publicacion') || null,
                    autores_ids: autorIds
                };
                if (id) {
                    await libros.actualizar(id, libro);
                    notificar('Los datos del libro se actualizaron.');
                } else {
                    await libros.crear(libro);
                    notificar('El libro se agregó al catálogo.');
                }
                break;
            }
            case 'form-existencias':
                await libros.agregarExistencias(
                    datos.get('libro_id'),
                    Number(datos.get('cantidad')),
                    datos.get('motivo').trim()
                );
                notificar('La entrada quedó registrada en el inventario.');
                break;
            case 'form-ejemplares':
                await libros.crearEjemplares(
                    datos.get('libro_id'),
                    Number(datos.get('cantidad'))
                );
                notificar('Los ejemplares quedaron disponibles para préstamo.');
                break;
            case 'form-prestamo':
                await prestamos.crear({
                    usuario_id: Number(datos.get('usuario_id')),
                    ejemplar_id: Number(datos.get('ejemplar_id')),
                    fecha_limite: datos.get('fecha_limite')
                });
                notificar('El préstamo quedó registrado.');
                break;
            case 'form-categoria':
                await libros.crearCategoria(datos.get('nombre').trim());
                notificar('La categoría se creó correctamente.');
                break;
            case 'form-autor':
                await libros.crearAutor(datos.get('nombre').trim());
                notificar('El autor se agregó correctamente.');
                break;
            case 'form-usuario': {
                const id = Number(datos.get('id'));
                const usuario = Object.fromEntries(
                    ['nombre', 'apellido', 'email', 'telefono', 'direccion', 'contrasena']
                        .map((campo) => [campo, datos.get(campo)])
                        .filter(([, valor]) => valor !== '')
                );
                await usuarios.actualizar(id, usuario);
                notificar('La cuenta se actualizó correctamente.');
                break;
            }
            case 'form-compra':
                await ventas.crear({
                    libros: [{
                        libro_id: Number(datos.get('libro_id')),
                        cantidad: Number(datos.get('cantidad'))
                    }]
                });
                notificar('Tu compra quedó registrada.');
                break;
            default:
                return;
        }
        cerrarModal();
        await cargarVista();
    } catch (error) {
        notificar(error.message, 'error');
        if (boton) {
            boton.disabled = false;
            boton.textContent = textoOriginal;
        }
    }
};

const procesarPerfil = async (formulario) => {
    if (!formulario.reportValidity()) {
        return;
    }
    const boton = formulario.querySelector('[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Guardando…';
    const datos = Object.fromEntries(new FormData(formulario));
    if (!datos.contrasena) {
        delete datos.contrasena;
    }
    try {
        const perfil = await usuarios.actualizarPerfil(datos);
        guardarUsuario(perfil);
        notificar('Tu perfil se actualizó correctamente.');
        await dibujarPerfil();
    } catch (error) {
        notificar(error.message, 'error');
        boton.disabled = false;
        boton.textContent = 'Guardar cambios';
    }
};

const manejarAccion = async (elemento) => {
    const accion = elemento.dataset.accion;
    const id = Number(elemento.dataset.id);
    switch (accion) {
        case 'cerrar-sesion':
            autenticacion.cerrarSesion();
            window.location.assign(RUTAS.inicio);
            break;
        case 'menu':
            document.getElementById('barra-lateral').classList.toggle('abierta');
            document.getElementById('fondo-menu').classList.toggle('abierto');
            document.getElementById('boton-menu').setAttribute(
                'aria-expanded',
                String(document.getElementById('barra-lateral').classList.contains('abierta'))
            );
            break;
        case 'nuevo-libro':
            await abrirFormularioLibro();
            break;
        case 'editar-libro':
            await abrirFormularioLibro(id);
            break;
        case 'eliminar-libro':
            if (window.confirm('¿Eliminar este libro? La operación no se puede deshacer y se rechazará si conserva ejemplares o historial.')) {
                await libros.eliminar(id);
                notificar('El libro se eliminó del catálogo.');
                await cargarVista();
            }
            break;
        case 'inventario-libro':
            await abrirFormularioExistencias(id);
            break;
        case 'crear-ejemplares':
            await abrirFormularioCopias(id);
            break;
        case 'movimientos-libro':
            await mostrarMovimientos(id);
            break;
        case 'nuevo-prestamo':
            await abrirFormularioPrestamo();
            break;
        case 'devolver-prestamo':
            if (window.confirm('¿Confirmas que el ejemplar fue devuelto? La devolución se registrará con la fecha de hoy.')) {
                await prestamos.devolver(id);
                notificar('La devolución quedó registrada.');
                await cargarVista();
            }
            break;
        case 'nueva-venta':
            await abrirFormularioVenta();
            break;
        case 'comprar-libro':
            await abrirCompraLector(id);
            break;
        case 'nueva-categoria':
            abrirFormularioNombre('categoria');
            break;
        case 'nuevo-autor':
            abrirFormularioNombre('autor');
            break;
        case 'editar-usuario':
            await abrirEdicionUsuario(id);
            break;
        case 'estado-usuario': {
            const usuario = await usuarios.obtener(id);
            const nuevoEstado = !Boolean(usuario.activo);
            const accionTexto = nuevoEstado ? 'activar' : 'desactivar';
            if (window.confirm(`¿Deseas ${accionTexto} la cuenta de ${usuario.nombre} ${usuario.apellido}?`)) {
                await usuarios.cambiarEstado(id, nuevoEstado);
                notificar(`La cuenta quedó ${nuevoEstado ? 'activa' : 'inactiva'}.`);
                await cargarVista();
            }
            break;
        }
        case 'historial-usuario':
            await mostrarHistorialUsuario(id);
            break;
        case 'cerrar-modal':
            cerrarModal();
            break;
        case 'pagina-anterior':
            estado.pagina = Math.max(1, estado.pagina - 1);
            await cargarVista();
            break;
        case 'pagina-siguiente':
            estado.pagina += 1;
            await cargarVista();
            break;
        case 'reintentar':
            await cargarVista();
            break;
        default:
            break;
    }
};

const iniciar = async () => {
    if (!autenticacion.estaAutenticado()) {
        window.location.replace(RUTAS.iniciarSesion);
        return;
    }
    const [fecha, perfil] = await Promise.all([
        Promise.resolve(new Intl.DateTimeFormat('es-GT', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        }).format(new Date())),
        usuarios.perfil()
    ]);
    document.getElementById('fecha-actual').textContent = fecha;
    document.getElementById('anio-panel').textContent = new Date().getFullYear();
    guardarUsuario(perfil);
    const vistaInicial = window.location.hash.slice(1)
        || (perfil.rol === 'admin' ? 'dashboard' : 'inicio');
    irVista(vistaInicial);

    window.addEventListener('hashchange', () => {
        const nombre = window.location.hash.slice(1)
            || (estado.rol === 'admin' ? 'dashboard' : 'inicio');
        if (nombre !== estado.vista) {
            estado.busqueda = '';
            estado.categoriaId = '';
            irVista(nombre);
        }
    });

    document.addEventListener('click', async (evento) => {
        const enlaceVista = evento.target.closest('[data-vista]');
        if (enlaceVista) {
            document.getElementById('barra-lateral').classList.remove('abierta');
            document.getElementById('fondo-menu').classList.remove('abierto');
            return;
        }
        const elemento = evento.target.closest('[data-accion]');
        if (!elemento) {
            return;
        }
        evento.preventDefault();
        try {
            await manejarAccion(elemento);
        } catch (error) {
            notificar(error.message, 'error');
        }
    });

    document.getElementById('fondo-menu').addEventListener('click', () => {
        document.getElementById('barra-lateral').classList.remove('abierta');
        document.getElementById('fondo-menu').classList.remove('abierto');
    });
    document.getElementById('avatar-cabecera').addEventListener('click', () => {
        window.location.hash = '#perfil';
    });

    document.addEventListener('input', (evento) => {
        if (!['filtro-libros', 'filtro-usuarios'].includes(evento.target.id)) {
            return;
        }
        estado.busqueda = evento.target.value.trim();
        estado.pagina = 1;
        window.clearTimeout(estado.filtroTemporizador);
        estado.filtroTemporizador = window.setTimeout(() => cargarVista(), 280);
    });
    document.addEventListener('change', (evento) => {
        if (evento.target.id === 'filtro-categoria') {
            estado.categoriaId = evento.target.value;
            estado.pagina = 1;
            cargarVista();
        }
    });
    document.addEventListener('submit', async (evento) => {
        const formulario = evento.target;
        if (formulario.id === 'form-perfil') {
            evento.preventDefault();
            await procesarPerfil(formulario);
        } else if (formulario.id === 'form-venta') {
            return;
        } else if (formulario.closest('#modal-principal')) {
            evento.preventDefault();
            await procesarFormulario(formulario);
        }
    });
};

iniciar().catch((error) => {
    if (error.estado !== 401) {
        dibujarError(error);
        notificar(error.message, 'error');
    }
});
