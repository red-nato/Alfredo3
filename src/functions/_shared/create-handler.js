import { GameUseCases } from '../../application/usecases/game-usecases.js';
import { AuthUseCases } from '../../application/usecases/auth-usecases.js';
import { DynamoGameRepository } from '../../infrastructure/repositories/dynamodb-game-repository.js';
import { S3AnalyticsSink } from '../../infrastructure/analytics/s3-analytics-sink.js';
import { GameController } from '../../interfaces/controllers/game-controller.js';

const repository = new DynamoGameRepository();
const controller = new GameController(new GameUseCases(repository), new AuthUseCases(repository));
export const createHandler = (operation) => async (event) => controller.handle(operation, event);
