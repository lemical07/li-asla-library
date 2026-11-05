import pool from '../config/db.js';

const catalogoRepositorio = {
    async listarCategorias() {
        const [filas] = await pool.execute(
            'SELECT id, nombre FROM categoria ORDER BY nombre'
        );
        return filas;
    },

    async crearCategoria(nombre) {
        const [resultado] = await pool.execute(
            'INSERT INTO categoria (nombre) VALUES (?)',
            [nombre]
        );
        return resultado.insertId;
    },

    async listarAutores() {
        const [filas] = await pool.execute(
            'SELECT id, nombre FROM autor ORDER BY nombre'
        );
        return filas;
    },

    async crearAutor(nombre) {
        const [resultado] = await pool.execute(
            'INSERT INTO autor (nombre) VALUES (?)',
            [nombre]
        );
        return resultado.insertId;
    }
};

export default catalogoRepositorio;
