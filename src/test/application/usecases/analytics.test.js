import test from 'node:test';
import assert from 'node:assert/strict';
import { GameUseCases, summarizeAnalytics } from '../../../application/usecases/game-usecases.js';

test('resume tiempos, clics, ayuda y timeouts por etapa', () => {
  const result = summarizeAnalytics([
    { eventType: 'click', stage: 1, action: 'draw-card', sessionCode: '1', teamName: 'A' },
    { eventType: 'click', stage: 1, action: 'toggleHelp', sessionCode: '1', teamName: 'A' },
    { eventType: 'stage_complete', stage: 1, durationMs: 10_000, timedOut: false, sessionCode: '1', teamName: 'A' },
    { eventType: 'stage_complete', stage: 1, durationMs: 20_000, timedOut: true, sessionCode: '1', teamName: 'B' },
  ]);

  assert.equal(result.clicks_totales, 2);
  assert.equal(result.equipos_activos, 2);
  assert.equal(result.solicitudes_ayuda, 1);
  assert.equal(result.tasa_timeout_porcentaje, 50);
  assert.deepEqual(result.por_etapa['1'], {
    clicks: 2,
    completions: 2,
    timeouts: 1,
    solicitudes_ayuda: 1,
    tiempo_promedio_segundos: 15,
    tiempo_p50_segundos: 10,
    tiempo_p95_segundos: 20,
  });
});

test('valida y persiste un lote analítico en DynamoDB y S3', async () => {
  const saved = []; const exported = [];
  const repository = {
    requireSession: async () => ({ codigo: '123456' }),
    requireTeam: async () => ({ nombre: 'Alpha' }),
    recordAnalyticsEvents: async (events) => saved.push(...events),
  };
  const sink = { putEvents: async (events) => exported.push(...events) };
  const useCases = new GameUseCases(repository, sink);
  const result = await useCases.recordAnalytics({
    codigo: '123456', nombre_equipo: 'Alpha',
    events: [{ type: 'click', stage: 2, action: 'select-persona', timestamp: '2026-08-11T10:00:00Z' }],
  });

  assert.deepEqual(result, { status: 'ok', accepted: 1 });
  assert.equal(saved.length, 1);
  assert.equal(exported.length, 1);
  assert.equal(saved[0].sessionCode, '123456');
  assert.equal(saved[0].teamName, 'Alpha');
});
