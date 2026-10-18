import { body } from "express-validator";

const categoriaCrearValidacion = [
    body('nombre')
        .notEmpty().withMessage('La categoría es obligatoria')
        .isString().withMessage('Categoría debe ser texto')
        .isLength({ max: 100 }).withMessage('Máximo 100 caracteres') 
        .trim()
];

export default categoriaCrearValidacion;