/**
 * Adapta el resultado de un caso de uso al contrato HTTP expuesto por la API.
 */
export class HealthController {
  constructor({ checkHealth }) {
    this.checkHealth = checkHealth;
  }

  async handle() {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(this.checkHealth.execute()),
    };
  }
}
