import { body } from 'express-validator';

const usuarioLoginValidaciones = [
    body('email').isEmail().withMessage('Ingrese un correo válido').normalizeEmail(),
    body('contrasena')
        .isString().withMessage('La contraseña debe ser texto')
        .notEmpty().withMessage('La contraseña es obligatoria')
];

export default usuarioLoginValidaciones;
