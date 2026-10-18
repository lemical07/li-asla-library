import { body } from "express-validator";

const prestamoCrearValidacion = [
    body('usuario_id')
        .notEmpty().withMessage('El ID del usuario es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del usuario debe ser entero positivo'),

    body('admin_id')
        .notEmpty().withMessage('El ID del administrador es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del admin debe ser entero positivo'), 

    body('ejemplar_id')
        .notEmpty().withMessage('El ID del ejemplar es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del ejemplar debe ser entero positivo'), 

    body('fecha_limite')
        .notEmpty().withMessage('La fecha límite es obligatoria')
        .isDate().withMessage('Ingrese una fecha válida (YYYY-MM-DD)') 

        .custom((value) => {
            const hoy = new Date(); hoy.setHours(0,0,0,0);
            if (new Date(value) < hoy) throw new Error('fecha_limite no puede ser pasada');
            return true;
        }),

    body('fecha_devolucion_real')
        .optional({ nullable: true })
        .isDate().withMessage('Debe ser una fecha válida'),

    body('estado')
        .optional({ nullable: true }) 
        .isIn(['prestado', 'devuelto']).withMessage('Estado inválido')
];

export default prestamoCrearValidacion;