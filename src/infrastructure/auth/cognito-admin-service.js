import {
  AdminAddUserToGroupCommand, AdminCreateUserCommand, AdminGetUserCommand,
  AdminSetUserPasswordCommand, CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { DomainError } from '../../domain/errors.js';

export class CognitoAdminService {
  constructor({ client = new CognitoIdentityProviderClient({}), userPoolId = process.env.ADMIN_USER_POOL_ID } = {}) {
    if (!userPoolId) throw new Error('ADMIN_USER_POOL_ID es requerido');
    this.client = client;
    this.userPoolId = userPoolId;
  }

  async create({ email, password }) {
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new DomainError('Ingresa un correo válido');
    if (String(password ?? '').length < 12) throw new DomainError('La contraseña debe tener al menos 12 caracteres');
    try {
      await this.client.send(new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: normalizedEmail,
        UserAttributes: [{ Name: 'email', Value: normalizedEmail }, { Name: 'email_verified', Value: 'true' }],
        MessageAction: 'SUPPRESS',
      }));
    } catch (error) {
      if (error.name !== 'UsernameExistsException') throw error;
    }
    await this.client.send(new AdminSetUserPasswordCommand({
      UserPoolId: this.userPoolId, Username: normalizedEmail, Password: String(password), Permanent: true,
    }));
    await this.client.send(new AdminAddUserToGroupCommand({
      UserPoolId: this.userPoolId, Username: normalizedEmail, GroupName: 'Admins',
    }));
    const user = await this.client.send(new AdminGetUserCommand({ UserPoolId: this.userPoolId, Username: normalizedEmail }));
    return { email: normalizedEmail, estado: user.UserStatus, habilitado: user.Enabled };
  }
}
