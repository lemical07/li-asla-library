import { body } from "express-validator";

const inventarioCrearValidacion = [
    body('libro_id')
        .notEmpty().withMessage('El ID del libro es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del libro debe ser entero positivo'), 

    body('stock_venta')
        .optional({ nullable: true }) 
        .isInt({ min: 0 }).withMessage('El stock debe ser entero >= 0') 
];

export default inventarioCrearValidacion;