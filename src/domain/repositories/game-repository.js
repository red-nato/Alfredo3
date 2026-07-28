/** Puerto de persistencia. La capa de aplicación nunca importa AWS SDK. */
export class GameRepository {
  async createSession() { throw new Error('Not implemented'); }
  async getSession() { throw new Error('Not implemented'); }
  async registerTeam() { throw new Error('Not implemented'); }
}
