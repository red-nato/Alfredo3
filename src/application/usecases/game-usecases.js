import { randomInt } from 'node:crypto';
import { DomainError } from '../../domain/errors.js';
import { SESSION_STATUS, sessionCode } from '../../domain/entities/session.js';

const required = (value, message) => { const result = String(value ?? '').trim(); if (!result) throw new DomainError(message); return result; };
const bodyValue = (body, ...names) => names.map((name) => body[name]).find((value) => value !== undefined && String(value).trim() !== '');
const now = () => new Date().toISOString();
const code = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
const teamName = (body) => required(bodyValue(body, 'nombre_equipo', 'nombreEquipo', 'equipo', 'teamName'), 'El nombre del equipo es requerido');
const codeFrom = (body) => sessionCode(required(bodyValue(body, 'codigo', 'codigo_sesion', 'codigo_acceso', 'sessionCode'), 'El código de sesión es requerido'));

export class GameUseCases {
  constructor(repository) { this.repository = repository; }
  async createSession(body = {}) {
    const metadata = { nombreProfesor: String(bodyValue(body, 'nombreProfesor', 'nombre_profesor') ?? 'Profesor Principal').trim(), facultad: String(body.facultad ?? 'Sin facultad registrada').trim(), modalidadGrupos: ['manual', 'excel'].includes(String(bodyValue(body, 'modalidadGrupos', 'modalidad_grupos') ?? 'manual').toLowerCase()) ? String(bodyValue(body, 'modalidadGrupos', 'modalidad_grupos') ?? 'manual').toLowerCase() : 'manual' };
    let session;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const codigo = code(); session = { codigo, estado: SESSION_STATUS.WAITING, faseActual: 0, estaPausada: false, subFase: '', ganadorRuleta: null, equipoPresentando: null, creadoEn: now(), ...metadata };
      try { await this.repository.createSession(session); break; } catch (error) { if (error.name !== 'ConditionalCheckFailedException') throw error; session = null; }
    }
    if (!session) throw new DomainError('No se pudo generar un código de sesión único', 503);
    const groups = metadata.modalidadGrupos === 'excel' && Array.isArray(body.grupos) ? body.grupos : [];
    let created = 0;
    for (const [index, group] of groups.entries()) {
      const integrantes = Array.isArray(group.integrantes) ? group.integrantes.filter((member) => String(member?.nombre ?? member ?? '').trim()).map((member) => typeof member === 'string' ? { nombre: member, carrera: 'Sin definir' } : { nombre: String(member.nombre ?? member.name).trim(), carrera: String(member.carrera ?? 'Sin definir').trim() }) : [];
      if (!integrantes.length) continue;
      try { await this.repository.registerTeam({ codigo: session.codigo, nombre: String(group.nombreGrupo ?? group.nombre ?? `Grupo ${index + 1}`).trim(), integrantes }); created += 1; } catch (error) { if (!(error instanceof DomainError)) throw error; }
    }
    return { status: 'ok', codigo: session.codigo, sesion: { codigo: session.codigo, ...metadata, grupos_creados: created } };
  }
  async registerTeam(body) {
    const codigo = codeFrom(body); const nombre = teamName(body); const defaultCareer = String(bodyValue(body, 'carrera_principal', 'carreraPrincipal', 'career') ?? 'Sin definir').trim();
    const raw = bodyValue(body, 'integrantes', 'miembros', 'alumnos', 'members'); if (!Array.isArray(raw) || !raw.length) throw new DomainError('Debe haber al menos un integrante');
    const integrantes = raw.map((member) => ({ nombre: String(member?.nombre ?? member?.name ?? member?.alumno ?? '').trim(), carrera: String(member?.carrera ?? member?.career ?? defaultCareer).trim() || 'Sin definir' })).filter((member) => member.nombre);
    if (!integrantes.length) throw new DomainError('Debe haber al menos un integrante válido');
    const team = await this.repository.registerTeam({ codigo, nombre, integrantes });
    return { status: 'ok', id: team.id, equipo_id: team.id, equipo: team.nombre, sesion: codigo, integrantes_creados: integrantes.length, integrantes };
  }
  async getTeams(codigo) { await this.repository.requireSession(codigo); return { status: 'ok', sesion: codigo, equipos: await this.repository.listTeams(codigo) }; }
  async validateSession(codigo) { return (await this.repository.getSession(codigo)) ? { status: 'ok' } : { status: 'error', message: 'Sesión no encontrada' }; }
  async gameState({ codigo, equipo }) {
    const session = await this.repository.getSession(codigo); const team = session && await this.repository.getTeam(codigo, equipo); if (!session || !team) return { status: 'kicked' };
    await this.repository.touchTeam(codigo, equipo); const teams = await this.repository.listTeams(codigo); const ranking = teams.sort((a, b) => b.puntaje_total - a.puntaje_total).slice(0, 5).map(({ nombre, puntaje_total }) => ({ nombre, puntaje_total }));
    const allPresented = session.faseActual === 4 && session.subFase === 'pitches' && teams.length > 0 && teams.every((item) => item.ya_presento_pitch);
    return { status: 'ok', current_stage: session.faseActual, paused: session.estaPausada, equipo_termino_fase: team.terminoFaseActual, ranking_temporal: ranking, sub_stage: session.subFase, roulette_winner: session.ganadorRuleta, current_presenter: session.equipoPresentando, all_presented: allPresented };
  }
  async addTokens(body) {
    const value = Number(body.valor ?? 0); if (!Number.isFinite(value)) throw new DomainError('El valor debe ser numérico'); const codigo = sessionCode(required(body.sesion_id ?? body.codigo, 'sesion_id es requerido'));
    let team = body.equipo; if (!team && body.equipo_id) team = await this.repository.findTeamById(String(body.equipo_id)); if (!team) throw new DomainError('Equipo no encontrado', 404);
    const result = await this.repository.addTokens({ codigo, team, valor: value, origen: String(body.origen ?? 'ACTIVIDAD'), descripcion: String(body.descripcion ?? '') }); return { status: 'ok', token_id: result.tokenId, nuevo_puntaje: result.nuevoPuntaje };
  }
  async start(codigo) { await this.repository.requireSession(codigo); await this.repository.updateSession(codigo, { faseActual: 1, estaPausada: false, estado: SESSION_STATUS.ACTIVE, fechaInicio: (await this.repository.getSession(codigo)).fechaInicio ?? now() }); await this.repository.resetTeams(codigo, { terminoFaseActual: false }); return { status: 'ok' }; }
  async pause(codigo, state) { await this.repository.requireSession(codigo); await this.repository.updateSession(codigo, { estaPausada: String(state).toLowerCase() === 'true' }); return { status: 'ok' }; }
  async next(codigo) { const session = await this.repository.requireSession(codigo); const stage = session.faseActual + 1; const update = { faseActual: stage, estaPausada: false }; if (stage === 4) Object.assign(update, { subFase: 'prep', ganadorRuleta: null, equipoPresentando: null }); if (stage >= 5) Object.assign(update, { estado: SESSION_STATUS.FINISHED, fechaFin: session.fechaFin ?? now() }); await this.repository.updateSession(codigo, update); await this.repository.resetTeams(codigo, { terminoFaseActual: false, ...(stage === 4 ? { yaPresentoPitch: false } : {}) }); return { status: 'ok', new_stage: stage }; }
  async finishPhase(body) {
    const codigo = codeFrom(body); const nombre = teamName(body); const session = await this.repository.requireSession(codigo);
    const requestedStage = Number(body.fase ?? session.faseActual);
    if (!Number.isInteger(requestedStage) || requestedStage < 1) throw new DomainError('La fase es inválida');
    if (requestedStage !== session.faseActual) {
      return { status: 'ok', advanced: false, current_stage: session.faseActual, message: 'La sesión ya cambió de fase' };
    }
    await this.repository.requireTeam(codigo, nombre);
    // La marca incluye el número de fase: así una marca atrasada no puede hacer
    // avanzar accidentalmente la fase siguiente después de un reintento de red.
    await this.repository.updateTeam(codigo, nombre, { terminoFaseActual: true, faseTerminada: requestedStage });
    const teams = await this.repository.listTeams(codigo);
    // Compatibilidad con sesiones abiertas antes de esta versión, que solo
    // guardaban el booleano terminoFaseActual y no el número de fase.
    const allFinished = teams.every((team) => team.fase_terminada === requestedStage
      || (team.fase_terminada == null && team.termino_fase_actual));
    if (!teams.length || !allFinished) {
      return { status: 'ok', advanced: false, current_stage: requestedStage };
    }
    const nextStage = requestedStage + 1;
    const advanced = await this.repository.advanceSessionIfCurrentStage(codigo, requestedStage, {
      faseActual: nextStage,
      estaPausada: false,
      ...(nextStage >= 5 ? { estado: SESSION_STATUS.FINISHED, fechaFin: now() } : {}),
    });
    if (advanced) await this.repository.resetTeams(codigo, { terminoFaseActual: false, faseTerminada: null });
    const current = advanced ? nextStage : (await this.repository.requireSession(codigo)).faseActual;
    return { status: 'ok', advanced, current_stage: current };
  }
  async teamReady(body) { const codigo = codeFrom(body); const nombre = teamName(body); const subStage = String(body.sub_stage ?? '').trim(); await this.repository.requireSession(codigo); await this.repository.updateTeam(codigo, nombre, { terminoFaseActual: true }); const teams = await this.repository.listTeams(codigo); if (teams.length && teams.every((team) => team.termino_fase_actual)) { const update = {}; if (subStage === 'prep') update.subFase = 'coins_intro'; if (subStage === 'coins_intro') { update.subFase = 'pitches'; const pending = teams.filter((team) => !team.ya_presento_pitch); const winner = pending[randomInt(pending.length)]?.nombre ?? null; update.ganadorRuleta = winner; update.equipoPresentando = winner; } if (Object.keys(update).length) await this.repository.updateSession(codigo, update); await this.repository.resetTeams(codigo, { terminoFaseActual: false }); } return { status: 'ok' }; }
  async finishPitch(body) { const codigo = codeFrom(body); const nombre = teamName(body); await this.repository.requireSession(codigo); await this.repository.updateTeam(codigo, nombre, { yaPresentoPitch: true }); const pending = (await this.repository.listTeams(codigo)).filter((team) => !team.ya_presento_pitch); const winner = pending[randomInt(pending.length)]?.nombre ?? null; await this.repository.updateSession(codigo, { ganadorRuleta: winner, equipoPresentando: winner }); return { status: 'ok' }; }
  async adminStats() { const sessions = await this.repository.listSessions(); const data = []; for (const session of sessions) { const teams = await this.repository.listTeams(session.codigo); data.push({ id: session.codigo, codigo: session.codigo, estado: session.estado, fase_actual: session.faseActual, fecha_inicio: session.fechaInicio ?? null, fecha_fin: session.fechaFin ?? null, creado_en: session.creadoEn, nombreProfesor: session.nombreProfesor, facultad: session.facultad, modalidadGrupos: session.modalidadGrupos, cantidad_grupos: teams.length, cantidad_participantes: teams.reduce((n, team) => n + team.integrantes.length, 0), puntaje_total: teams.reduce((n, team) => n + team.puntaje_total, 0), grupos: teams }); } return { status: 'ok', total_equipos: data.reduce((n, session) => n + session.cantidad_grupos, 0), total_agentes: data.reduce((n, session) => n + session.cantidad_participantes, 0), sesiones: data }; }
}
