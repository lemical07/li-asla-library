import { body } from "express-validator";

const ventaCrearValidacion = [
    body('usuario_id')
        .optional({ nullable: true }) 
        .isInt({ min: 1 }).withMessage('El ID del usuario debe ser entero positivo'),

    body('nombre_cliente')
        .optional({ nullable: true }) // ← CAMBIO: schema permite NULL
        .isString().withMessage('El nombre del cliente debe ser texto')
        .isLength({ min: 1, max: 100 }).withMessage('Entre 1 y 100 caracteres')
        .trim(),

    body('identificacion_cliente')
        .optional({ nullable: true })
        .isString().withMessage('Identificación debe ser texto')
        .isLength({ max: 20 }).withMessage('Máximo 20 caracteres')
        .trim(),

    body().custom((value) => {
        if (!value.usuario_id && !value.nombre_cliente) {
            throw new Error('Debe indicar usuario_id o nombre_cliente');
        }
        return true;
    })
];

export default ventaCrearValidacion;