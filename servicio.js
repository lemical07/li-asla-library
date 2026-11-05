import express from 'express';
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import usuarioRouter from './routes/usuario.router.js';
import libroRouter from './routes/libro.router.js';
import prestamoRouter from './routes/prestamo.router.js';
import ventaRouter from './routes/venta.router.js';
import catalogoRouter from './routes/catalogo.router.js';
import manejadorErrores from './util/manejador-errores.js';

const app = express();
const puerto = Number(process.env.SERVER_PORT) || 3000;
const directorioProyecto = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.get('/salud', (req, res) => res.json({ estado: 'disponible' }));
app.use('/usuarios', usuarioRouter);
app.use('/libros', libroRouter);
app.use('/prestamos', prestamoRouter);
app.use('/ventas', ventaRouter);
app.use('/', catalogoRouter);

app.get('/', (req, res) => {
    res.sendFile(path.join(directorioProyecto, 'index.html'));
});
app.use(express.static(path.join(directorioProyecto, 'public'), {
    index: false,
    fallthrough: true,
    maxAge: '1h'
}));

app.use((req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.use(manejadorErrores);

app.listen(puerto, () => {
    console.log(`Servidor corriendo en http://localhost:${puerto}`);
});
