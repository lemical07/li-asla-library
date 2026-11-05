import { body } from 'express-validator';

const prestamoCrearValidaciones = [
    body('usuario_id')
        .isInt({ min: 1 }).withMessage('El usuario es obligatorio')
        .toInt(),
    body('ejemplar_id')
        .isInt({ min: 1 }).withMessage('El ejemplar es obligatorio')
        .toInt(),
    body('fecha_limite')
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('Ingrese una fecha límite válida')
        .custom((valor) => {
            const fecha = new Date(`${valor}T00:00:00.000Z`);
            const hoy = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
            if (Number.isNaN(fecha.getTime()) || fecha < hoy) {
                throw new Error('La fecha límite no puede ser anterior a hoy');
            }
            return true;
        })
];

export default prestamoCrearValidaciones;
