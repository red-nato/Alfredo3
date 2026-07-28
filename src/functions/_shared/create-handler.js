import { GameUseCases } from '../../application/usecases/game-usecases.js';
import { DynamoGameRepository } from '../../infrastructure/repositories/dynamodb-game-repository.js';
import { GameController } from '../../interfaces/controllers/game-controller.js';

const controller = new GameController(new GameUseCases(new DynamoGameRepository()));
export const createHandler = (operation) => async (event) => controller.handle(operation, event);
