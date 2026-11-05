import { body } from "express-validator";

const libroAutorCrearValidacion = [
    body('libro_id')
        .notEmpty().withMessage('El ID del libro es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del libro debe ser entero positivo'), 

    body('autor_id')
        .notEmpty().withMessage('El ID del autor es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del autor debe ser entero positivo'),

    body('orden')
        .optional({ nullable: true }) 
        .isInt({ min: 1, max: 255 }).withMessage('orden debe estar entre 1 y 255') 
];

export default libroAutorCrearValidacion;