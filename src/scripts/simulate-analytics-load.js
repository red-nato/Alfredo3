import { randomUUID } from 'node:crypto';

const apiUrl = String(process.env.API_URL ?? '').replace(/\/+$/, '');
const sessions = Math.max(1, Number(process.env.SIM_SESSIONS ?? 3));
const teamsPerSession = Math.max(1, Number(process.env.SIM_TEAMS ?? 6));
const clicksPerStage = Math.max(1, Number(process.env.SIM_CLICKS ?? 8));
const stages = [1, 2, 3, 4];

if (!apiUrl) {
  console.error('Define API_URL=https://.../Prod');
  process.exit(2);
}

const request = async (path, body) => {
  const response = await fetch(`${apiUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.status === 'error') throw new Error(`${path}: ${data.error ?? data.message ?? response.status}`);
  return data;
};

const chunks = (values, size) => Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size));
const runId = `sim-${Date.now()}`;
let totalEvents = 0;
const sessionCodes = [];

for (let sessionIndex = 1; sessionIndex <= sessions; sessionIndex += 1) {
  const created = await request('/api/crear-sesion', {
    nombreProfesor: `Simulación KPI ${sessionIndex}`,
    facultad: ['Ingeniería', 'Economía', 'Diseño'][sessionIndex % 3],
    modalidadGrupos: 'manual',
  });
  const codigo = created.codigo;
  sessionCodes.push(codigo);

  for (let teamIndex = 1; teamIndex <= teamsPerSession; teamIndex += 1) {
    const teamName = `SIM-${sessionIndex}-${teamIndex}`;
    await request('/api/registrar-equipo', {
      codigo,
      nombre_equipo: teamName,
      integrantes: [
        { nombre: `Estudiante ${sessionIndex}-${teamIndex}-A`, carrera: 'Ingeniería' },
        { nombre: `Estudiante ${sessionIndex}-${teamIndex}-B`, carrera: 'Diseño' },
      ],
    });

    const events = [];
    for (const stage of stages) {
      const timestamp = new Date(Date.now() - (stages.length - stage) * 60_000).toISOString();
      events.push({ eventId: randomUUID(), type: 'stage_enter', stage, action: 'simulation_enter', timestamp });
      for (let click = 1; click <= clicksPerStage; click += 1) {
        events.push({
          eventId: randomUUID(), type: 'click', stage,
          action: click === 1 ? 'help_open_simulation' : `simulation_action_${click}`,
          timestamp,
        });
      }
      events.push({ eventId: randomUUID(), type: 'word_found', stage, action: 'simulation_success', timestamp });
      events.push({
        eventId: randomUUID(), type: 'stage_complete', stage, action: 'simulation_complete',
        durationMs: 35_000 + stage * 12_000 + teamIndex * 750,
        timedOut: (sessionIndex + teamIndex + stage) % 9 === 0,
        timestamp,
      });
    }

    for (const batch of chunks(events, 25)) {
      const result = await request('/api/analytics/events', { codigo, nombre_equipo: teamName, events: batch });
      totalEvents += result.accepted;
    }
  }
  console.log(`Sesión ${codigo}: ${teamsPerSession} equipos simulados`);
}

console.log(JSON.stringify({ runId, sessions: sessionCodes, teams: sessions * teamsPerSession, events: totalEvents }));
