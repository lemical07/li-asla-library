import pool from '../config/db.js';

const libroRepositorio = {
    async listar({ pagina, limite, busqueda, categoriaId, ordenar, direccion }) {
        const ordenesPermitidos = {
            titulo: 'l.titulo',
            precio: 'l.precio',
            fecha: 'l.fecha_publicacion',
            id: 'l.id'
        };
        const ordenSql = ordenesPermitidos[ordenar] || ordenesPermitidos.id;
        const direccionSql = direccion === 'asc' ? 'ASC' : 'DESC';
        const condiciones = [];
        const valores = [];

        if (busqueda) {
            condiciones.push('(l.titulo LIKE ? OR l.isbn LIKE ? OR c.nombre LIKE ?)');
            valores.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
        }
        if (categoriaId) {
            condiciones.push('l.categoria_id = ?');
            valores.push(categoriaId);
        }
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        const [filas] = await pool.execute(
            `SELECT l.id, l.isbn, l.titulo, l.categoria_id, c.nombre AS categoria,
                l.fecha_publicacion, l.precio, l.creado_en, l.actualizado_en,
                COALESCE(i.stock_venta, 0) AS stock_venta,
                (SELECT COUNT(*) FROM ejemplar e
                    WHERE e.libro_id = l.id AND e.estado = 'operativo'
                    AND NOT EXISTS (
                        SELECT 1 FROM prestamo p
                        WHERE p.ejemplar_id = e.id AND p.estado = 'prestado'
                    )) AS ejemplares_disponibles
            FROM libro l
            JOIN categoria c ON c.id = l.categoria_id
            LEFT JOIN inventario i ON i.libro_id = l.id
            ${where}
            ORDER BY ${ordenSql} ${direccionSql}
            LIMIT ? OFFSET ?`,
            [...valores, limite, (pagina - 1) * limite]
        );
        if (filas.length) {
            const ids = filas.map((libro) => libro.id);
            const marcadores = ids.map(() => '?').join(', ');
            const [autores] = await pool.execute(
                `SELECT la.libro_id, a.id, a.nombre, la.orden
                FROM libro_autor la JOIN autor a ON a.id = la.autor_id
                WHERE la.libro_id IN (${marcadores})
                ORDER BY la.libro_id, la.orden`,
                ids
            );
            for (const libro of filas) {
                libro.autores = autores.filter((autor) => autor.libro_id === libro.id)
                    .map(({ id, nombre, orden }) => ({ id, nombre, orden }));
            }
        }
        const [conteo] = await pool.execute(
            `SELECT COUNT(*) AS total FROM libro l
            JOIN categoria c ON c.id = l.categoria_id ${where}`,
            valores
        );
        return { datos: filas, total: conteo[0].total };
    },

    async obtenerPorId(id, conexion = pool) {
        const [filas] = await conexion.execute(
            `SELECT l.id, l.isbn, l.titulo, l.categoria_id, c.nombre AS categoria,
                l.fecha_publicacion, l.precio, l.creado_en, l.actualizado_en,
                COALESCE(i.stock_venta, 0) AS stock_venta,
                (SELECT COUNT(*) FROM ejemplar e
                    WHERE e.libro_id = l.id AND e.estado = 'operativo'
                    AND NOT EXISTS (
                        SELECT 1 FROM prestamo p
                        WHERE p.ejemplar_id = e.id AND p.estado = 'prestado'
                    )) AS ejemplares_disponibles
            FROM libro l
            JOIN categoria c ON c.id = l.categoria_id
            LEFT JOIN inventario i ON i.libro_id = l.id
            WHERE l.id = ?`,
            [id]
        );
        if (filas[0]) {
            const [autores] = await conexion.execute(
                `SELECT a.id, a.nombre, la.orden
                FROM libro_autor la JOIN autor a ON a.id = la.autor_id
                WHERE la.libro_id = ? ORDER BY la.orden`,
                [id]
            );
            filas[0].autores = autores;
        }
        return filas[0] || null;
    },

    async crear(libro) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [resultado] = await conexion.execute(
                `INSERT INTO libro (isbn, titulo, categoria_id, fecha_publicacion, precio)
                VALUES (?, ?, ?, ?, ?)`,
                [libro.isbn, libro.titulo, libro.categoria_id,
                    libro.fecha_publicacion, libro.precio]
            );
            await conexion.execute(
                'INSERT INTO inventario (libro_id, stock_venta) VALUES (?, 0)',
                [resultado.insertId]
            );
            if (libro.autores_ids.length) {
                const parametrosAutores = libro.autores_ids.map((autorId, indice) =>
                    [resultado.insertId, autorId, indice + 1]
                );
                const marcadoresAutores = parametrosAutores.map(() => '(?, ?, ?)').join(', ');
                await conexion.execute(
                    `INSERT INTO libro_autor (libro_id, autor_id, orden)
                    VALUES ${marcadoresAutores}`,
                    parametrosAutores.flat()
                );
            }
            await conexion.commit();
            return resultado.insertId;
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    },

    async actualizar(id, datos) {
        const columnas = {
            isbn: 'isbn',
            titulo: 'titulo',
            categoria_id: 'categoria_id',
            fecha_publicacion: 'fecha_publicacion',
            precio: 'precio'
        };
        const campos = Object.keys(columnas).filter((campo) =>
            Object.hasOwn(datos, campo)
        );
        if (!campos.length && !Object.hasOwn(datos, 'autores_ids')) {
            return false;
        }
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [libros] = await conexion.execute(
                'SELECT id FROM libro WHERE id = ? FOR UPDATE',
                [id]
            );
            if (!libros.length) {
                const error = new Error('Libro no encontrado');
                error.statusCode = 404;
                throw error;
            }
            if (campos.length) {
                const asignaciones = campos.map((campo) => `${columnas[campo]} = ?`).join(', ');
                const valores = campos.map((campo) => datos[campo]);
                await conexion.execute(
                    `UPDATE libro SET ${asignaciones} WHERE id = ?`,
                    [...valores, id]
                );
            }
            if (Object.hasOwn(datos, 'autores_ids')) {
                await conexion.execute('DELETE FROM libro_autor WHERE libro_id = ?', [id]);
                if (datos.autores_ids.length) {
                    const parametrosAutores = datos.autores_ids.map((autorId, indice) =>
                        [id, autorId, indice + 1]
                    );
                    const marcadoresAutores = parametrosAutores.map(() => '(?, ?, ?)').join(', ');
                    await conexion.execute(
                        `INSERT INTO libro_autor (libro_id, autor_id, orden)
                        VALUES ${marcadoresAutores}`,
                        parametrosAutores.flat()
                    );
                }
            }
            await conexion.commit();
            return true;
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    },

    async agregarExistencias(id, cantidad, usuarioId, motivo) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [libros] = await conexion.execute(
                'SELECT id FROM libro WHERE id = ? FOR UPDATE',
                [id]
            );
            if (!libros.length) {
                const error = new Error('Libro no encontrado');
                error.statusCode = 404;
                throw error;
            }
            await conexion.execute(
                `INSERT IGNORE INTO inventario (libro_id, stock_venta)
                VALUES (?, 0)`,
                [id]
            );
            const [inventario] = await conexion.execute(
                'SELECT libro_id FROM inventario WHERE libro_id = ? FOR UPDATE',
                [id]
            );
            if (!inventario.length) {
                const error = new Error('Libro no encontrado en inventario');
                error.statusCode = 404;
                throw error;
            }
            await conexion.execute(
                'UPDATE inventario SET stock_venta = stock_venta + ? WHERE libro_id = ?',
                [cantidad, id]
            );
            await conexion.execute(
                `INSERT INTO movimiento_inventario
                    (libro_id, usuario_id, tipo, cantidad, motivo)
                VALUES (?, ?, 'entrada', ?, ?)`,
                [id, usuarioId, cantidad, motivo || null]
            );
            await conexion.commit();
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    },

    async crearEjemplares(id, cantidad) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [libros] = await conexion.execute(
                'SELECT id FROM libro WHERE id = ? FOR UPDATE',
                [id]
            );
            if (!libros.length) {
                const error = new Error('Libro no encontrado');
                error.statusCode = 404;
                throw error;
            }
            const valores = Array.from({ length: cantidad }, () => '(?, ?)').join(', ');
            const parametros = Array.from({ length: cantidad }, () => [id, 'operativo']).flat();
            await conexion.execute(
                `INSERT INTO ejemplar (libro_id, estado) VALUES ${valores}`,
                parametros
            );
            await conexion.commit();
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    },

    async listarEjemplares(id) {
        const libro = await this.obtenerPorId(id);
        if (!libro) {
            const error = new Error('Libro no encontrado');
            error.statusCode = 404;
            throw error;
        }
        const [filas] = await pool.execute(
            `SELECT e.id, e.libro_id, e.estado,
                IF(p.id IS NULL, 1, 0) AS disponible,
                p.id AS prestamo_id, p.usuario_id, p.fecha_limite
            FROM ejemplar e
            LEFT JOIN prestamo p
                ON p.ejemplar_id = e.id AND p.estado = 'prestado'
            WHERE e.libro_id = ?
            ORDER BY e.id`,
            [id]
        );
        return filas;
    },

    async listarMovimientos(id, pagina, limite) {
        const libro = await this.obtenerPorId(id);
        if (!libro) {
            const error = new Error('Libro no encontrado');
            error.statusCode = 404;
            throw error;
        }
        const [filas] = await pool.execute(
            `SELECT m.id, m.tipo, m.cantidad, m.motivo, m.creado_en,
                m.usuario_id, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
            FROM movimiento_inventario m
            LEFT JOIN usuario u ON u.id = m.usuario_id
            WHERE m.libro_id = ?
            ORDER BY m.id DESC LIMIT ? OFFSET ?`,
            [id, limite, (pagina - 1) * limite]
        );
        const [conteo] = await pool.execute(
            'SELECT COUNT(*) AS total FROM movimiento_inventario WHERE libro_id = ?',
            [id]
        );
        return { datos: filas, total: conteo[0].total };
    },

    async eliminar(id) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [relaciones] = await conexion.execute(
                `SELECT
                    EXISTS(SELECT 1 FROM ejemplar WHERE libro_id = ?) AS tiene_ejemplares,
                    EXISTS(SELECT 1 FROM detalle_venta WHERE libro_id = ?) AS tiene_ventas,
                    EXISTS(SELECT 1 FROM movimiento_inventario WHERE libro_id = ?) AS tiene_movimientos`,
                [id, id, id]
            );
            if (Object.values(relaciones[0]).some(Boolean)) {
                const error = new Error('No se puede eliminar un libro con historial');
                error.statusCode = 409;
                throw error;
            }
            await conexion.execute('DELETE FROM inventario WHERE libro_id = ?', [id]);
            const [resultado] = await conexion.execute('DELETE FROM libro WHERE id = ?', [id]);
            if (!resultado.affectedRows) {
                const error = new Error('Libro no encontrado');
                error.statusCode = 404;
                throw error;
            }
            await conexion.commit();
            return true;
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    }
};

export default libroRepositorio;
