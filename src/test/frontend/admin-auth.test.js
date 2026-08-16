import test from 'node:test';
import assert from 'node:assert/strict';

const values = new Map();
globalThis.sessionStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
globalThis.window = {
  MISION_EMPRENDE_COGNITO: {
    clientId: 'client-123',
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/pool-123',
  },
};
globalThis.app = {};

await import('../../../frontend/static/misionemprende/js/04_admin.js');

const token = (overrides = {}) => {
  const payload = {
    token_use: 'id',
    aud: window.MISION_EMPRENDE_COGNITO.clientId,
    iss: window.MISION_EMPRENDE_COGNITO.issuer,
    exp: Math.floor(Date.now() / 1000) + 300,
    'cognito:groups': ['Admins'],
    ...overrides,
  };
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
};

test('acepta un ID token vigente de este pool y del grupo Admins', () => {
  const claims = app._validateAdminToken(token());
  assert.equal(claims.aud, 'client-123');
});

test('rechaza un usuario Cognito que no pertenece a Admins', () => {
  assert.throws(() => app._validateAdminToken(token({ 'cognito:groups': ['Profesores'] })), /Admins/);
});

test('rechaza tokens emitidos para otro cliente', () => {
  assert.throws(() => app._validateAdminToken(token({ aud: 'otro-cliente' })), /no corresponde/);
});
