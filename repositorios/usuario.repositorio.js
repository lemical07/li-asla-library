import pool from '../config/db.js';

const usuarioRepositorio = {
    async obtenerPorId(id, conexion = pool) {
        const [filas] = await conexion.execute(
            `SELECT id, identificacion, nombre, apellido, telefono, direccion,
                email, rol, activo, creado_en, actualizado_en
            FROM usuario WHERE id = ?`,
            [id]
        );
        return filas[0] || null;
    },

    async obtenerPorEmail(email) {
        const [filas] = await pool.execute(
            `SELECT id, identificacion, nombre, apellido, telefono, direccion,
                email, contrasena, rol, activo
            FROM usuario WHERE email = ?`,
            [email]
        );
        return filas[0] || null;
    },

    async crear(usuario) {
        const [resultado] = await pool.execute(
            `INSERT INTO usuario
                (identificacion, nombre, apellido, telefono, direccion, email, contrasena)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                usuario.identificacion,
                usuario.nombre,
                usuario.apellido,
                usuario.telefono,
                usuario.direccion,
                usuario.email,
                usuario.contrasena
            ]
        );
        return resultado.insertId;
    },

    async listar({ pagina = 1, limite = 20, busqueda = '' } = {}) {
        const filtro = busqueda
            ? 'WHERE identificacion LIKE ? OR nombre LIKE ? OR apellido LIKE ? OR email LIKE ?'
            : '';
        const valores = busqueda
            ? [`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`]
            : [];
        const [filas] = await pool.execute(
            `SELECT id, identificacion, nombre, apellido, telefono, direccion,
                email, rol, activo, creado_en, actualizado_en
            FROM usuario ${filtro}
            ORDER BY id LIMIT ? OFFSET ?`,
            [...valores, limite, (pagina - 1) * limite]
        );
        const [conteo] = await pool.execute(
            `SELECT COUNT(*) AS total FROM usuario ${filtro}`,
            valores
        );
        return { datos: filas, total: conteo[0].total };
    },

    async actualizarPerfil(id, datos) {
        const columnas = {
            nombre: 'nombre',
            apellido: 'apellido',
            telefono: 'telefono',
            direccion: 'direccion',
            email: 'email',
            contrasena: 'contrasena'
        };
        const campos = Object.keys(columnas).filter((campo) =>
            Object.hasOwn(datos, campo)
        );
        if (campos.length === 0) {
            return false;
        }

        const asignaciones = campos.map((campo) => `${columnas[campo]} = ?`).join(', ');
        const valores = campos.map((campo) => datos[campo]);
        const [resultado] = await pool.execute(
            `UPDATE usuario SET ${asignaciones} WHERE id = ?`,
            [...valores, id]
        );
        return resultado.affectedRows > 0;
    },

    async actualizarEstado(id, activo) {
        const [resultado] = await pool.execute(
            'UPDATE usuario SET activo = ? WHERE id = ?',
            [activo, id]
        );
        return resultado.affectedRows > 0;
    }
};

export default usuarioRepositorio;
