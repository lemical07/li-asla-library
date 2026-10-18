import { body } from "express-validator";

const usuarioCrearValidacion = [
    body('identificacion')
        .notEmpty().withMessage('Identificación obligatoria')
        .isString().withMessage('Identificación debe ser texto') 
        .isLength({ min: 1, max: 20 }).withMessage('Máximo 20 caracteres')
        .trim(),

    body('nombre')
        .notEmpty().withMessage('Nombre obligatorio')
        .isString().withMessage('Nombre debe ser texto')
        .isLength({ max: 50 }).withMessage('Máximo 50 caracteres')
        .trim(),

    body('apellido')
        .notEmpty().withMessage('Apellido obligatorio')
        .isString().withMessage('Apellido debe ser texto')
        .isLength({ max: 50 }).withMessage('Máximo 50 caracteres')
        .trim(),

    body('telefono')
        .optional({ nullable: true })
        .isString().withMessage('Teléfono debe ser texto') 
        .isLength({ max: 20 }).withMessage('Máximo 20 caracteres') 
        .matches(/^[\d+\-\s()]{7,20}$/).withMessage('Formato de teléfono inválido')
        .trim(),

    body('direccion')
        .optional({ nullable: true })
        .isString().withMessage('Dirección debe ser texto')
        .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),

    body('email')
        .notEmpty().withMessage('Correo obligatorio')
        .isEmail().withMessage('Ingrese un correo válido')
        .isLength({ max: 120 }).withMessage('Máximo 120 caracteres') 
        .normalizeEmail().trim(),

    body('contrasena')
        .notEmpty().withMessage('Contraseña obligatoria')
        .isStrongPassword().withMessage('Ingrese una contraseña segura'),

    body('rol')
        .optional({ nullable: true })
        .isIn(['admin', 'lector']).withMessage('Rol inválido')
];

export default usuarioCrearValidacion;