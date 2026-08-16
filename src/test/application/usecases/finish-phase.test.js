import test from 'node:test';
import assert from 'node:assert/strict';
import { GameUseCases } from '../../../application/usecases/game-usecases.js';

class FakeRepository {
  constructor() {
    this.session = { codigo: '123456', faseActual: 1, estado: 'ACTIVE' };
    this.teams = [
      { nombre: 'Alpha', termino_fase_actual: false, fase_terminada: null },
      { nombre: 'Beta', termino_fase_actual: false, fase_terminada: null },
    ];
    this.advanced = 0;
  }
  async requireSession() { return this.session; }
  async requireTeam(_code, name) { return this.teams.find((team) => team.nombre === name); }
  async updateTeam(_code, name, values) {
    const team = this.teams.find((item) => item.nombre === name);
    team.termino_fase_actual = values.terminoFaseActual;
    team.fase_terminada = values.faseTerminada;
  }
  async listTeams() { return this.teams; }
  async advanceSessionIfCurrentStage(_code, expected, attributes) {
    if (this.session.faseActual !== expected) return false;
    Object.assign(this.session, attributes);
    this.advanced += 1;
    return true;
  }
  async resetTeams(_code, values) {
    this.teams.forEach((team) => {
      team.termino_fase_actual = values.terminoFaseActual;
      team.fase_terminada = values.faseTerminada;
    });
  }
}

test('FinishPhase espera a todos los equipos y avanza una sola vez', async () => {
  const repository = new FakeRepository();
  const useCases = new GameUseCases(repository);

  const first = await useCases.finishPhase({ codigo: '123456', nombre_equipo: 'Alpha', fase: 1 });
  assert.deepEqual(first, { status: 'ok', advanced: false, current_stage: 1 });

  const second = await useCases.finishPhase({ codigo: '123456', nombre_equipo: 'Beta', fase: 1 });
  assert.equal(second.advanced, true);
  assert.equal(second.current_stage, 2);
  assert.equal(repository.advanced, 1);
  assert.deepEqual(repository.teams.map((team) => team.fase_terminada), [null, null]);
});

test('FinishPhase ignora un reintento atrasado de una fase ya superada', async () => {
  const repository = new FakeRepository();
  repository.session.faseActual = 2;
  const result = await new GameUseCases(repository).finishPhase({ codigo: '123456', nombre_equipo: 'Alpha', fase: 1 });

  assert.deepEqual(result, { status: 'ok', advanced: false, current_stage: 2, message: 'La sesión ya cambió de fase' });
  assert.equal(repository.advanced, 0);
});
