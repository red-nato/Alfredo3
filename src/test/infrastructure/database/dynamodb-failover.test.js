import test from 'node:test';
import assert from 'node:assert/strict';
import { RegionalDocumentClient } from '../../../infrastructure/database/dynamodb/client.js';

test('conmuta a la réplica cuando la tabla primaria no está disponible', async () => {
  const primary = { send: async () => { const error = new Error('missing'); error.name = 'ResourceNotFoundException'; throw error; } };
  const replica = { send: async () => ({ Item: { PK: 'DEMO' } }) };
  const client = new RegionalDocumentClient([
    { region: 'us-east-1', client: primary },
    { region: 'us-west-2', client: replica },
  ]);

  const result = await client.send({ input: {} });

  assert.equal(result.Item.PK, 'DEMO');
  assert.equal(client.activeRegion, 'us-west-2');
});

test('no oculta errores de validación con un failover', async () => {
  let replicaCalled = false;
  const primary = { send: async () => { const error = new Error('invalid'); error.name = 'ValidationException'; throw error; } };
  const replica = { send: async () => { replicaCalled = true; } };
  const client = new RegionalDocumentClient([
    { region: 'us-east-1', client: primary },
    { region: 'us-west-2', client: replica },
  ]);

  await assert.rejects(client.send({ input: {} }), /invalid/);
  assert.equal(replicaCalled, false);
});

test('conmuta cuando el error de red viene anidado como causa', async () => {
  const primary = { send: async () => {
    const cause = new Error('connection refused');
    cause.code = 'ECONNREFUSED';
    throw new Error('request failed', { cause });
  } };
  const replica = { send: async () => ({ ok: true }) };
  const client = new RegionalDocumentClient([
    { region: 'us-east-1', client: primary },
    { region: 'us-west-2', client: replica },
  ]);

  assert.deepEqual(await client.send({ input: {} }), { ok: true });
  assert.equal(client.activeRegion, 'us-west-2');
});

test('construye el comando con la región que realmente atendió la escritura', async () => {
  const seen = [];
  const primary = { send: async (command) => {
    seen.push(command.regionEvidence);
    const error = new Error('connection refused');
    error.code = 'ECONNREFUSED';
    throw error;
  } };
  const replica = { send: async (command) => { seen.push(command.regionEvidence); return { ok: true }; } };
  const client = new RegionalDocumentClient([
    { region: 'us-east-1', client: primary },
    { region: 'us-west-2', client: replica },
  ]);

  await client.sendWithRegion((region) => ({ regionEvidence: region }));

  assert.deepEqual(seen, ['us-east-1', 'us-west-2']);
  assert.equal(client.activeRegion, 'us-west-2');
});
