import { createHmac, timingSafeEqual } from 'node:crypto';

const obtenerSecreto = () => {
    const secreto = process.env.JWT_SECRET;
    if (!secreto || secreto.length < 32) {
        throw new Error('JWT_SECRET debe contener al menos 32 caracteres');
    }
    return secreto;
};

const codificar = (valor) => Buffer.from(JSON.stringify(valor)).toString('base64url');
const firmar = (contenido, secreto) =>
    createHmac('sha256', secreto).update(contenido).digest('base64url');

export const crearToken = (usuario, duracionSegundos = 3600) => {
    const ahora = Math.floor(Date.now() / 1000);
    const encabezado = codificar({ alg: 'HS256', typ: 'JWT' });
    const carga = codificar({
        sub: String(usuario.id),
        iat: ahora,
        exp: ahora + duracionSegundos
    });
    const contenido = `${encabezado}.${carga}`;
    return `${contenido}.${firmar(contenido, obtenerSecreto())}`;
};

export const verificarToken = (token) => {
    try {
        const partes = token.split('.');
        if (partes.length !== 3) {
            return null;
        }

        const [encabezadoCodificado, cargaCodificada, firma] = partes;
        const encabezado = JSON.parse(
            Buffer.from(encabezadoCodificado, 'base64url').toString('utf8')
        );
        if (encabezado.alg !== 'HS256' || encabezado.typ !== 'JWT') {
            return null;
        }

        const firmaEsperada = Buffer.from(
            firmar(`${encabezadoCodificado}.${cargaCodificada}`, obtenerSecreto())
        );
        const firmaRecibida = Buffer.from(firma);
        if (firmaRecibida.length !== firmaEsperada.length
            || !timingSafeEqual(firmaRecibida, firmaEsperada)) {
            return null;
        }

        const carga = JSON.parse(
            Buffer.from(cargaCodificada, 'base64url').toString('utf8')
        );
        if (!carga.sub || !Number.isInteger(carga.exp)
            || carga.exp <= Math.floor(Date.now() / 1000)) {
            return null;
        }
        return carga;
    } catch (error) {
        if (error.message.includes('JWT_SECRET')) {
            throw error;
        }
        return null;
    }
};
