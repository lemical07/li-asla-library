import assert from 'node:assert/strict';
import test from 'node:test';
import { crearToken, verificarToken } from '../util/jwt.js';

process.env.JWT_SECRET = 'secreto-de-prueba-con-44-caracteres-aleatorios';

test('firma y verifica un JWT con el identificador de usuario', () => {
    const token = crearToken({ id: 27 });
    const carga = verificarToken(token);

    assert.equal(carga.sub, '27');
    assert.ok(carga.exp > carga.iat);
});

test('rechaza un JWT alterado o malformado', () => {
    const token = crearToken({ id: 27 });
    const [encabezado, carga, firma] = token.split('.');

    assert.equal(verificarToken(`${encabezado}.${carga}.firma-alterada`), null);
    assert.equal(verificarToken('no-es-un-jwt'), null);
});

test('rechaza un JWT expirado', () => {
    const token = crearToken({ id: 27 }, 0);

    assert.equal(verificarToken(token), null);
});
