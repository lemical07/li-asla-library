import pool from '../config/db.js';

const prestamoRepositorio = {
    async crear({ usuarioId, administradorId, ejemplarId, fechaLimite }) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [usuarios] = await conexion.execute(
                `SELECT id FROM usuario
                WHERE id = ? AND activo = 1 AND rol = 'lector' FOR UPDATE`,
                [usuarioId]
            );
            if (!usuarios.length) {
                const error = new Error('Lector no encontrado o inactivo');
                error.statusCode = 404;
                throw error;
            }

            const [ejemplares] = await conexion.execute(
                `SELECT id FROM ejemplar
                WHERE id = ? AND estado = 'operativo' FOR UPDATE`,
                [ejemplarId]
            );
            if (!ejemplares.length) {
                const error = new Error('Ejemplar no disponible');
                error.statusCode = 409;
                throw error;
            }
            const [activos] = await conexion.execute(
                `SELECT id FROM prestamo
                WHERE ejemplar_id = ? AND estado = 'prestado' FOR UPDATE`,
                [ejemplarId]
            );
            if (activos.length) {
                const error = new Error('El ejemplar ya tiene un préstamo activo');
                error.statusCode = 409;
                throw error;
            }

            const [resultado] = await conexion.execute(
                `INSERT INTO prestamo
                    (usuario_id, admin_id, ejemplar_id, fecha_prestamo, fecha_limite)
                VALUES (?, ?, ?, CURDATE(), ?)`,
                [usuarioId, administradorId, ejemplarId, fechaLimite]
            );
            await conexion.commit();
            return resultado.insertId;
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    },

    async devolver(id) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [prestamos] = await conexion.execute(
                'SELECT id, estado FROM prestamo WHERE id = ? FOR UPDATE',
                [id]
            );
            if (!prestamos.length) {
                const error = new Error('Préstamo no encontrado');
                error.statusCode = 404;
                throw error;
            }
            if (prestamos[0].estado !== 'prestado') {
                const error = new Error('El préstamo ya fue devuelto');
                error.statusCode = 409;
                throw error;
            }
            await conexion.execute(
                `UPDATE prestamo
                SET estado = 'devuelto', fecha_devolucion_real = CURDATE()
                WHERE id = ?`,
                [id]
            );
            await conexion.commit();
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    },

    async listar({ usuarioId = null, pagina = 1, limite = 20 }) {
        const condiciones = usuarioId ? 'WHERE p.usuario_id = ?' : '';
        const parametros = usuarioId ? [usuarioId] : [];
        const [filas] = await pool.execute(
            `SELECT p.id, p.usuario_id, u.nombre, u.apellido, p.admin_id,
                p.ejemplar_id, l.id AS libro_id, l.titulo, l.isbn,
                p.fecha_prestamo, p.fecha_limite, p.fecha_devolucion_real,
                IF(p.estado = 'prestado' AND p.fecha_limite < CURDATE(),
                    'vencido', p.estado) AS estado
            FROM prestamo p
            JOIN usuario u ON u.id = p.usuario_id
            JOIN ejemplar e ON e.id = p.ejemplar_id
            JOIN libro l ON l.id = e.libro_id
            ${condiciones}
            ORDER BY p.id DESC LIMIT ? OFFSET ?`,
            [...parametros, limite, (pagina - 1) * limite]
        );
        const [conteo] = await pool.execute(
            `SELECT COUNT(*) AS total FROM prestamo p ${condiciones}`,
            parametros
        );
        return { datos: filas, total: conteo[0].total };
    }
};

export default prestamoRepositorio;
