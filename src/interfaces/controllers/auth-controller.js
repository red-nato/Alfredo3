import { DomainError } from '../../domain/errors.js';

const response = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
const parseBody = (event) => { if (!event.body) return {}; try { return JSON.parse(event.body); } catch { throw new DomainError('JSON inválido'); } };
export const bearerToken = (event) => { const header = event.headers?.Authorization ?? event.headers?.authorization ?? ''; const [, token] = header.match(/^Bearer\s+(.+)$/i) ?? []; return token; };

export class AuthController {
  constructor(useCases) { this.useCases = useCases; }
  async handle(operation, event) {
    try {
      let result;
      switch (operation) {
        case 'adminLogin': result = await this.useCases.login(parseBody(event)); break;
        case 'adminLogout': result = await this.useCases.logout(bearerToken(event)); break;
        default: throw new Error(`Operación desconocida: ${operation}`);
      }
      return response(200, result);
    } catch (error) {
      if (error instanceof DomainError) return response(error.statusCode, { error: error.message });
      console.error(error); return response(500, { error: 'Error interno' });
    }
  }
}
