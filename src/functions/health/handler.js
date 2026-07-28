import { buildHealthController } from './container.js';

const controller = buildHealthController();

/**
 * Adaptador Lambda: no contiene reglas de negocio ni acceso a infraestructura.
 */
export const handler = async (event) => controller.handle(event);
