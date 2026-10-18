import { body } from "express-validator";

const detalleVentaCrearValidacion = [
    body('venta_id')
        .notEmpty().withMessage('El ID de la venta es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID de la venta debe ser entero positivo'), 

    body('libro_id')
        .notEmpty().withMessage('El ID del libro es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del libro debe ser entero positivo'),

    body('cantidad')
        .notEmpty().withMessage('La cantidad es obligatoria')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser entero >= 1'),

    body('precio_unitario')
        .notEmpty().withMessage('El precio unitario es obligatorio')
        .isFloat({ min: 0 }).withMessage('El precio debe ser número >= 0')
];

export default detalleVentaCrearValidacion;