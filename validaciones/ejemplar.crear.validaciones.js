import { body } from "express-validator";

const ejemplarCrearValidacion = [
    body('libro_id')
        .notEmpty().withMessage('El ID del libro es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del libro debe ser entero positivo'), 

    body('estado')
        .optional({ nullable: true }) 
        .isIn(['operativo', 'danado', 'perdido', 'baja'])
        .withMessage('Estado inválido')
];

export default ejemplarCrearValidacion;