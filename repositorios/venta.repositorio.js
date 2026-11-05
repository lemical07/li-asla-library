import pool from '../config/db.js';

const ventaRepositorio = {
    async crear({ usuarioId, nombreCliente, lineas, actorId }) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [venta] = await conexion.execute(
                'INSERT INTO venta (usuario_id, nombre_cliente) VALUES (?, ?)',
                [usuarioId, nombreCliente]
            );
            const idVenta = venta.insertId;
            const lineasAgrupadas = [...lineas.reduce((mapa, linea) => {
                mapa.set(
                    Number(linea.libro_id),
                    (mapa.get(Number(linea.libro_id)) || 0) + Number(linea.cantidad)
                );
                return mapa;
            }, new Map())]
                .sort(([idA], [idB]) => idA - idB);

            for (const [libroId, cantidad] of lineasAgrupadas) {
                const [libros] = await conexion.execute(
                    `SELECT l.precio, i.stock_venta
                    FROM libro l
                    JOIN inventario i ON i.libro_id = l.id
                    WHERE l.id = ? FOR UPDATE`,
                    [libroId]
                );
                if (!libros.length) {
                    const error = new Error(`Libro ${libroId} no encontrado en inventario`);
                    error.statusCode = 404;
                    throw error;
                }
                if (libros[0].stock_venta < cantidad) {
                    const error = new Error(`Existencias insuficientes para el libro ${libroId}`);
                    error.statusCode = 409;
                    throw error;
                }

                await conexion.execute(
                    `INSERT INTO detalle_venta
                        (venta_id, libro_id, cantidad, precio_unitario)
                    VALUES (?, ?, ?, ?)`,
                    [idVenta, libroId, cantidad, libros[0].precio]
                );
                await conexion.execute(
                    'UPDATE inventario SET stock_venta = stock_venta - ? WHERE libro_id = ?',
                    [cantidad, libroId]
                );
                await conexion.execute(
                    `INSERT INTO movimiento_inventario
                        (libro_id, usuario_id, tipo, cantidad, motivo)
                    VALUES (?, ?, 'venta', ?, ?)`,
                    [libroId, actorId, -cantidad, `Venta ${idVenta}`]
                );
            }

            const [totales] = await conexion.execute(
                'SELECT COALESCE(SUM(subtotal), 0) AS total FROM detalle_venta WHERE venta_id = ?',
                [idVenta]
            );
            await conexion.commit();
            return { id: idVenta, total: totales[0].total };
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    },

    async listar({ usuarioId = null, pagina = 1, limite = 20 }) {
        const filtro = usuarioId ? 'WHERE v.usuario_id = ?' : '';
        const parametros = usuarioId ? [usuarioId] : [];
        const [ventas] = await pool.execute(
            `SELECT v.id, v.usuario_id, v.nombre_cliente, v.fecha_venta,
                COALESCE(SUM(d.subtotal), 0) AS total
            FROM venta v
            LEFT JOIN detalle_venta d ON d.venta_id = v.id
            ${filtro}
            GROUP BY v.id
            ORDER BY v.id DESC LIMIT ? OFFSET ?`,
            [...parametros, limite, (pagina - 1) * limite]
        );
        const ids = ventas.map((venta) => venta.id);
        let detalles = [];
        if (ids.length) {
            const marcadores = ids.map(() => '?').join(', ');
            [detalles] = await pool.execute(
                `SELECT d.venta_id, d.libro_id, l.titulo, d.cantidad,
                    d.precio_unitario, d.subtotal
                FROM detalle_venta d
                JOIN libro l ON l.id = d.libro_id
                WHERE d.venta_id IN (${marcadores})
                ORDER BY d.venta_id, d.id`,
                ids
            );
        }
        const [conteo] = await pool.execute(
            `SELECT COUNT(*) AS total FROM venta v ${filtro}`,
            parametros
        );
        return {
            datos: ventas.map((venta) => ({
                ...venta,
                libros: detalles.filter((detalle) => detalle.venta_id === venta.id)
            })),
            total: conteo[0].total
        };
    }
};

export default ventaRepositorio;
