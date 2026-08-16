import test from 'node:test';
import assert from 'node:assert/strict';
import { GameController } from '../../../interfaces/controllers/game-controller.js';

const event = (groups) => ({
  queryStringParameters: {},
  requestContext: { authorizer: { claims: { 'cognito:groups': groups } } },
});

test('protege operaciones administrativas cuando falta el grupo Cognito', async () => {
  const controller = new GameController({ adminStats: async () => ({ status: 'ok' }) });
  const response = await controller.handle('adminStats', event('Profesores'));
  assert.equal(response.statusCode, 403);
});

test('acepta el formato de arreglo serializado que puede entregar API Gateway', async () => {
  const controller = new GameController({ adminStats: async () => ({ status: 'ok' }) });
  const response = await controller.handle('adminStats', event('["Admins","Auditores"]'));
  assert.equal(response.statusCode, 200);
});
