import { body } from "express-validator";

const movimientoInventarioCrearValidacion = [
    body('libro_id')
        .notEmpty().withMessage('El ID del libro es obligatorio')
        .isInt({ min: 1 }).withMessage('libro_id debe ser entero positivo'), 

    body('usuario_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('usuario_id debe ser entero positivo'),

    body('tipo')
        .notEmpty().withMessage('Tipo obligatorio')
        .isIn(['entrada', 'venta']).withMessage('Tipo inválido'),

    body('cantidad')
        .notEmpty().withMessage('Cantidad obligatoria')
        .isInt().withMessage('Cantidad debe ser entero')
        .custom((v) => v !== 0).withMessage('Cantidad no puede ser 0'),

    body('motivo')
        .optional({ nullable: true }) // ← NUEVO: schema permite NULL
        .isString().withMessage('Motivo debe ser texto')
        .isLength({ max: 200 }).withMessage('Máximo 200 caracteres')
];

export default movimientoInventarioCrearValidacion;