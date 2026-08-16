import test from 'node:test';
import assert from 'node:assert/strict';
import { CognitoAdminService } from '../../../infrastructure/auth/cognito-admin-service.js';

test('crea usuario, fija contraseña permanente y lo agrega a Admins', async () => {
  const commands = [];
  const client = { send: async (command) => {
    commands.push(command.constructor.name);
    return command.constructor.name === 'AdminGetUserCommand' ? { UserStatus: 'CONFIRMED', Enabled: true } : {};
  } };
  const service = new CognitoAdminService({ client, userPoolId: 'us-east-1_test' });
  const result = await service.create({ email: 'NUEVO@Ejemplo.cl', password: 'ClaveSegura#123' });
  assert.deepEqual(commands, ['AdminCreateUserCommand', 'AdminSetUserPasswordCommand', 'AdminAddUserToGroupCommand', 'AdminGetUserCommand']);
  assert.deepEqual(result, { email: 'nuevo@ejemplo.cl', estado: 'CONFIRMED', habilitado: true });
});
