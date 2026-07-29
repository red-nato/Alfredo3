import { AuthUseCases } from '../../application/usecases/auth-usecases.js';
import { DynamoGameRepository } from '../../infrastructure/repositories/dynamodb-game-repository.js';
import { AuthController } from '../../interfaces/controllers/auth-controller.js';

const controller = new AuthController(new AuthUseCases(new DynamoGameRepository()));
export const createAuthHandler = (operation) => async (event) => controller.handle(operation, event);
