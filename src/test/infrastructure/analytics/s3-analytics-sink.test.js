import test from 'node:test';
import assert from 'node:assert/strict';
import { S3AnalyticsSink } from '../../../infrastructure/analytics/s3-analytics-sink.js';

test('exporta NDJSON particionado por fecha para Glue/Athena', async () => {
  const commands = [];
  const client = { send: async (command) => commands.push(command.input) };
  const sink = new S3AnalyticsSink({ client, bucketName: 'analytics-test' });
  await sink.putEvents([{
    eventId: 'event-1', eventType: 'click', sessionCode: '123456', teamName: 'Alpha', stage: 2,
    action: 'select-persona', durationMs: null, timedOut: false,
    clientTimestamp: '2026-08-11T14:25:00.000Z', timestamp: '2026-08-11T14:25:01.000Z',
  }]);

  assert.equal(commands.length, 1);
  assert.equal(commands[0].Bucket, 'analytics-test');
  assert.equal(commands[0].Key, 'raw/year=2026/month=08/day=11/hour=14/event-1.ndjson');
  assert.match(commands[0].Body, /"event_type":"click"/);
  assert.equal(commands[0].ServerSideEncryption, 'AES256');
});
