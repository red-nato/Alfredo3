import { randomBytes } from 'node:crypto';
import { DomainError } from '../../domain/errors.js';
import { verifyPassword } from '../services/password-hasher.js';

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const nowSeconds = () => Math.floor(Date.now() / 1000);

export class AuthUseCases {
  constructor(repository) { this.repository = repository; }

  async login({ username, password } = {}) {
    const normalisedUser = String(username ?? '').trim().toLowerCase();
    if (!normalisedUser || !password) throw new DomainError('Usuario y contraseña son requeridos');
    const admin = await this.repository.getAdmin(normalisedUser);
    if (!admin || !(await verifyPassword(String(password), admin.passwordHash))) throw new DomainError('Usuario o contraseña incorrectos', 401);
    const token = randomBytes(32).toString('hex');
    const expiresAt = nowSeconds() + SESSION_TTL_SECONDS;
    await this.repository.createAdminSession({ token, username: admin.username, expiresAt });
    return { status: 'ok', token, username: admin.username, expires_at: expiresAt };
  }

  async verify(token) {
    if (!token) throw new DomainError('No autorizado', 401);
    const session = await this.repository.getAdminSession(token);
    if (!session || session.expiresAt < nowSeconds()) throw new DomainError('Sesión expirada, vuelve a iniciar sesión', 401);
    return session;
  }

  async logout(token) {
    if (token) await this.repository.deleteAdminSession(token);
    return { status: 'ok' };
  }
}
