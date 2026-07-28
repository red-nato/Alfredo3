/**
 * Caso de uso: expresa una capacidad de la aplicación, no un detalle de AWS.
 */
export class CheckHealth {
  execute() {
    return {
      status: 'ok',
      service: 'mision-emprende-serverless',
    };
  }
}
