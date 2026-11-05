import { body } from 'express-validator';

const libroActualizarValidaciones = [
    body('isbn').optional().isString().withMessage('El ISBN debe ser texto')
        .matches(/^(?:\d{9}[\dXx]|\d{13})$/).withMessage('ISBN inválido'),
    body('titulo').optional().isString().withMessage('El título debe ser texto')
        .isLength({ min: 1, max: 200 }).withMessage('El título admite entre 1 y 200 caracteres')
        .trim(),
    body('categoria_id').optional().isInt({ min: 1 })
        .withMessage('La categoría debe ser un entero positivo')
        .toInt(),
    body('fecha_publicacion').optional({ nullable: true })
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('Fecha inválida (YYYY-MM-DD)'),
    body('precio').optional().isFloat({ min: 0 })
        .withMessage('El precio debe ser mayor o igual a cero')
        .toFloat(),
    body('autores_ids').optional().isArray({ max: 20 })
        .withMessage('autores_ids debe contener como máximo 20 autores')
        .custom((autores) => new Set(autores).size === autores.length)
        .withMessage('No se permiten autores repetidos'),
    body('autores_ids.*').optional().isInt({ min: 1 })
        .withMessage('Cada autor debe tener un ID válido')
        .toInt()
];

export default libroActualizarValidaciones;
