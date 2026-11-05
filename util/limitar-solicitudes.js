const crearLimitador = ({ maximo, ventanaMs }) => {
    const solicitudes = new Map();

    return (req, res, next) => {
        const ahora = Date.now();
        const clave = req.ip || req.socket.remoteAddress || 'desconocido';
        let registro = solicitudes.get(clave);

        if (!registro || registro.reiniciaEn <= ahora) {
            registro = { cantidad: 0, reiniciaEn: ahora + ventanaMs };
            solicitudes.set(clave, registro);
        }

        if (solicitudes.size > 10000) {
            for (const [ip, valor] of solicitudes) {
                if (valor.reiniciaEn <= ahora) {
                    solicitudes.delete(ip);
                }
            }
            while (solicitudes.size > 10000) {
                solicitudes.delete(solicitudes.keys().next().value);
            }
        }

        registro.cantidad += 1;
        if (registro.cantidad > maximo) {
            res.set('Retry-After', String(Math.ceil((registro.reiniciaEn - ahora) / 1000)));
            return res.status(429).json({
                mensaje: 'Demasiadas solicitudes; inténtelo más tarde'
            });
        }
        next();
    };
};

export default crearLimitador;
