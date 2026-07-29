import { DomainError } from '../../domain/errors.js';
import { sessionCode } from '../../domain/entities/session.js';
import { bearerToken } from './auth-controller.js';

const response = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
const parseBody = (event) => { if (!event.body) return {}; try { return JSON.parse(event.body); } catch { throw new DomainError('JSON inválido'); } };
const ADMIN_OPERATIONS = new Set(['start', 'pause', 'next', 'adminStats']);

export class GameController {
  constructor(useCases, authUseCases) { this.useCases = useCases; this.authUseCases = authUseCases; }
  async handle(operation, event) {
    try {
      if (ADMIN_OPERATIONS.has(operation)) await this.authUseCases.verify(bearerToken(event));
      const query = event.queryStringParameters ?? {}; const body = ['getTeams', 'validateSession', 'gameState', 'start', 'pause', 'next', 'adminStats'].includes(operation) ? query : parseBody(event);
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
        default: throw new Error(`Operación desconocida: ${operation}`);
      }
      return response(result.status === 'error' ? 404 : 200, result);
    } catch (error) {
      if (error instanceof DomainError) return response(error.statusCode, { error: error.message });
      console.error(error); return response(500, { error: 'Error interno' });
    }
  }
}
