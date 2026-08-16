import { DomainError } from '../../domain/errors.js';
import { CognitoAdminService } from '../../infrastructure/auth/cognito-admin-service.js';

const service = new CognitoAdminService();
const response = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});
const groups = (event) => String(event.requestContext?.authorizer?.claims?.['cognito:groups'] ?? '')
  .replace(/[\[\]"']/g, '').split(',').map((value) => value.trim());

export const handler = async (event) => {
  try {
    if (!groups(event).includes('Admins')) throw new DomainError('Se requiere un usuario del grupo Admins', 403);
    const raw = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event.body;
    const body = JSON.parse(raw || '{}');
    const user = await service.create(body);
    return response(200, { status: 'ok', usuario: user });
  } catch (error) {
    if (error instanceof DomainError || error instanceof SyntaxError) return response(error.statusCode ?? 400, { error: error instanceof SyntaxError ? 'JSON inválido' : error.message });
    console.error(error);
    return response(500, { error: 'No se pudo crear el administrador' });
  }
};
