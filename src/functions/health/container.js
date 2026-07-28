import { CheckHealth } from '../../application/usecases/check-health.js';
import { HealthController } from '../../interfaces/controllers/health-controller.js';

export const buildHealthController = () => new HealthController({
  checkHealth: new CheckHealth(),
});
