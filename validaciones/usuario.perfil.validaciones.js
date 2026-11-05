import { body } from 'express-validator';

const usuarioPerfilValidaciones = [
    body('nombre').optional().isString().withMessage('El nombre debe ser texto')
        .isLength({ min: 1, max: 50 }).withMessage('El nombre debe tener entre 1 y 50 caracteres')
        .trim(),
    body('apellido').optional().isString().withMessage('El apellido debe ser texto')
        .isLength({ min: 1, max: 50 }).withMessage('El apellido debe tener entre 1 y 50 caracteres')
        .trim(),
    body('telefono').optional({ nullable: true }).isString()
        .withMessage('El teléfono debe ser texto')
        .isLength({ max: 20 }).withMessage('El teléfono admite hasta 20 caracteres')
        .matches(/^[\d+\-\s()]{7,20}$/).withMessage('Formato de teléfono inválido')
        .trim(),
    body('direccion').optional({ nullable: true }).isString()
        .withMessage('La dirección debe ser texto')
        .isLength({ max: 200 }).withMessage('La dirección admite hasta 200 caracteres'),
    body('email').optional().isEmail().withMessage('Ingrese un correo válido')
        .isLength({ max: 120 }).withMessage('El correo admite hasta 120 caracteres')
        .normalizeEmail(),
    body('contrasena').optional().isStrongPassword()
        .withMessage('Ingrese una contraseña segura')
];

export default usuarioPerfilValidaciones;
