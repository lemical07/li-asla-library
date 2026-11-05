import { validationResult } from 'express-validator';

const manejadorErroresValidacion = (req, res, next) => {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        const error = new Error('La solicitud contiene datos inválidos');
        error.statusCode = 400;
        error.details = errores.array().map(({ location, path, msg }) => ({
            ubicacion: location,
            campo: path,
            mensaje: msg === 'Invalid value'
                ? 'El valor del campo es inválido'
                : msg
        }));
        return next(error);
    }

    next();
};

export default manejadorErroresValidacion;
