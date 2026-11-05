import { body } from 'express-validator';

const libroCrearValidacion = [
    body('isbn')
        .notEmpty().withMessage('ISBN obligatorio')
        .isString().withMessage('ISBN debe ser texto')
        .matches(/^(?:\d{9}[\dXx]|\d{13})$/).withMessage('ISBN inválido (10 o 13 dígitos)')
        .isLength({ max: 17 }).withMessage('Máximo 17 caracteres')
        .trim(),

    body('titulo')
        .notEmpty().withMessage('Título obligatorio')
        .isString().withMessage('Título debe ser texto')
        .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),

    body('categoria_id')
        .notEmpty().withMessage('Categoría obligatoria')
        .isInt({ min: 1 }).withMessage('categoria_id debe ser entero positivo')
        .toInt(),

    body('fecha_publicacion')
        .optional({ nullable: true })
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('Fecha inválida (YYYY-MM-DD)'),

    body('precio')
        .notEmpty().withMessage('Precio obligatorio')
        .isFloat({ min: 0 }).withMessage('Precio debe ser número >= 0')
        .toFloat(),
    body('autores_ids').optional().isArray({ max: 20 })
        .withMessage('autores_ids debe contener como máximo 20 autores')
        .custom((autores) => new Set(autores).size === autores.length)
        .withMessage('No se permiten autores repetidos'),
    body('autores_ids.*').optional().isInt({ min: 1 })
        .withMessage('Cada autor debe tener un ID válido')
        .toInt()
];

export default libroCrearValidacion;