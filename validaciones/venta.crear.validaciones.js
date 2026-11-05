import { body } from 'express-validator';

const ventaCrearValidacion = [
    body('usuario_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('El ID del usuario debe ser entero positivo')
        .toInt(),
    body('nombre_cliente')
        .optional({ nullable: true })
        .isString().withMessage('El nombre del cliente debe ser texto')
        .isLength({ min: 1, max: 100 }).withMessage('Entre 1 y 100 caracteres')
        .trim(),
    body('libros')
        .isArray({ min: 1, max: 100 })
        .withMessage('La venta debe incluir entre 1 y 100 libros'),
    body('libros.*.libro_id')
        .isInt({ min: 1 }).withMessage('El ID del libro debe ser entero positivo')
        .toInt(),
    body('libros.*.cantidad')
        .isInt({ min: 1, max: 10000 })
        .withMessage('La cantidad debe ser un entero positivo')
        .toInt(),
    body().custom((valor, { req }) => {
        const datos = valor || {};
        if (req.usuario?.rol === 'admin' && !datos.usuario_id && !datos.nombre_cliente) {
            throw new Error('Debe indicar usuario_id o nombre_cliente para la venta');
        }
        return true;
    })
];

export default ventaCrearValidacion;