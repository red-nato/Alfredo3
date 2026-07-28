import test from 'node:test';
import assert from 'node:assert/strict';
import { CheckHealth } from '../../../application/usecases/check-health.js';

test('CheckHealth informa que el servicio está operativo', () => {
  const result = new CheckHealth().execute();

  assert.deepEqual(result, {
    status: 'ok',
    service: 'mision-emprende-serverless',
  });
});
