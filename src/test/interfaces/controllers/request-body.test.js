import test from 'node:test';
import assert from 'node:assert/strict';
import { GameController } from '../../../interfaces/controllers/game-controller.js';

test('acepta cuerpos JSON codificados en base64 por API Gateway', async () => {
  let received;
  const controller = new GameController({
    createSession: async (body) => {
      received = body;
      return { status: 'ok', codigo: 'ABC123' };
    },
  });
  const payload = { nombreProfesor: 'Simulación', facultad: 'Ingeniería' };

  const result = await controller.handle('createSession', {
    body: Buffer.from(JSON.stringify(payload)).toString('base64'),
    isBase64Encoded: true,
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(received, payload);
});

test('conserva compatibilidad con cuerpos JSON sin codificar', async () => {
  let received;
  const controller = new GameController({
    createSession: async (body) => {
      received = body;
      return { status: 'ok', codigo: 'ABC123' };
    },
  });
  const payload = { nombreProfesor: 'Docente' };

  const result = await controller.handle('createSession', { body: JSON.stringify(payload) });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(received, payload);
});
