const manejadorErrores = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const erroresConflicto = new Set(['ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED_2']);
    const estado = error.statusCode || error.status
        || (erroresConflicto.has(error.code) ? 409
            : error.code === 'ER_NO_REFERENCED_ROW_2' ? 404
                : error.code === 'ER_CHECK_CONSTRAINT_VIOLATED' ? 400 : 500);
    const mensaje = error.code === 'ER_DUP_ENTRY'
        ? 'El registro ya existe'
        : error.code === 'ER_ROW_IS_REFERENCED_2'
            ? 'El registro tiene información relacionada y no puede eliminarse'
            : error.code === 'ER_NO_REFERENCED_ROW_2'
                ? 'Uno de los registros relacionados no existe'
                : error.code === 'ER_CHECK_CONSTRAINT_VIOLATED'
                    ? 'Los datos no cumplen las restricciones de la base de datos'
                    : error.type === 'entity.parse.failed'
                        ? 'El cuerpo JSON no es válido'
                        : error.type === 'entity.too.large'
                            ? 'El cuerpo de la solicitud excede el tamaño permitido'
                    : estado === 500
                        ? 'Error interno del servidor'
                        : error.message;

    if (estado === 500) {
        console.error(error);
    }

    res.status(estado).json({
        mensaje,
        errores: error.details || null
    });
};

export default manejadorErrores;
