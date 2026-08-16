import { DomainError } from '../../domain/errors.js';
import { sessionCode } from '../../domain/entities/session.js';

const response = (statusCode, body, dataRegion) => ({ statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'X-Mision-Data-Region', ...(dataRegion ? { 'X-Mision-Data-Region': dataRegion } : {}) }, body: JSON.stringify(body) });
const parseBody = (event) => {
  if (!event.body) return {};
  try {
    const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    return JSON.parse(body);
  } catch {
    throw new DomainError('JSON inválido');
  }
};
const adminOperations = new Set(['start', 'pause', 'next', 'adminStats']);
const isAdmin = (event) => {
  const claim = event.requestContext?.authorizer?.claims?.['cognito:groups'];
  let groups = Array.isArray(claim) ? claim : String(claim ?? '').split(',');
  if (typeof claim === 'string' && claim.trim().startsWith('[')) {
    try { const parsed = JSON.parse(claim); if (Array.isArray(parsed)) groups = parsed; } catch { /* usa el fallback separado por comas */ }
  }
  return groups.map((group) => String(group).trim().replace(/^[\["']+|[\]"']+$/g, '')).includes('Admins');
};

export class GameController {
  constructor(useCases) { this.useCases = useCases; }
  async handle(operation, event) {
    try {
      const query = event.queryStringParameters ?? {}; const body = ['getTeams', 'validateSession', 'gameState', 'start', 'pause', 'next', 'adminStats'].includes(operation) ? query : parseBody(event);
      if (adminOperations.has(operation) && !isAdmin(event)) throw new DomainError('Se requiere un usuario del grupo Admins', 403);
      let result;
      switch (operation) {
        case 'createSession': result = await this.useCases.createSession(body); break;
        case 'registerTeam': result = await this.useCases.registerTeam(body); break;
        case 'getTeams': result = await this.useCases.getTeams(sessionCode(event.pathParameters?.codigo)); break;
        case 'addTokens': result = await this.useCases.addTokens(body); break;
        case 'validateSession': result = await this.useCases.validateSession(sessionCode(body.codigo)); break;
        case 'gameState': result = await this.useCases.gameState({ codigo: sessionCode(body.codigo), equipo: body.equipo }); break;
        case 'finishPhase': result = await this.useCases.finishPhase(body); break;
        case 'start': result = await this.useCases.start(sessionCode(body.codigo)); break;
        case 'pause': result = await this.useCases.pause(sessionCode(body.codigo), body.state); break;
        case 'next': result = await this.useCases.next(sessionCode(body.codigo)); break;
        case 'teamReady': result = await this.useCases.teamReady(body); break;
        case 'finishPitch': result = await this.useCases.finishPitch(body); break;
        case 'adminStats': result = await this.useCases.adminStats(); break;
        case 'recordAnalytics': result = await this.useCases.recordAnalytics(body); break;
        default: throw new Error(`Operación desconocida: ${operation}`);
      }
      return response(result.status === 'error' ? 404 : 200, result, this.useCases.repository?.activeRegion);
    } catch (error) {
      if (error instanceof DomainError) return response(error.statusCode, { error: error.message });
      console.error(error); return response(500, { error: 'Error interno' });
    }
  }
}
