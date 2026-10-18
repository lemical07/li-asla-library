import { body } from "express-validator";

const autorCrearValidacion = [
    body('nombre')
        .notEmpty().withMessage('Nombre del autor obligatorio')
        .isString().withMessage('Nombre debe ser texto')
        .isLength({ max: 100 }).withMessage('Máximo 100 caracteres')
        .trim()
];

export default autorCrearValidacion;    