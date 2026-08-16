import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const localEndpoint = process.env.DYNAMODB_ENDPOINT || undefined;
const primaryEndpoint = process.env.GAME_DYNAMODB_PRIMARY_ENDPOINT || undefined;
const regions = localEndpoint
  ? [process.env.AWS_REGION || 'us-east-1']
  : [...new Set([
      process.env.GAME_DYNAMODB_PRIMARY_REGION || process.env.AWS_REGION || 'us-east-1',
      ...String(process.env.GAME_DYNAMODB_FAILOVER_REGIONS || '').split(',').map((value) => value.trim()).filter(Boolean),
    ])];
const retryInAnotherRegion = new Set([
  'ResourceNotFoundException', 'InternalServerError', 'ServiceUnavailableException',
  'TimeoutError', 'NetworkingError', 'ECONNREFUSED', 'ENOTFOUND', 'EHOSTUNREACH',
]);

const clients = regions.map((region, index) => {
  const endpoint = localEndpoint || (index === 0 ? primaryEndpoint : undefined);
  return {
    region,
    client: DynamoDBDocumentClient.from(new DynamoDBClient({
      region,
      endpoint,
      ...(primaryEndpoint && index === 0 ? { maxAttempts: 1 } : {}),
      ...(localEndpoint ? { credentials: { accessKeyId: 'local', secretAccessKey: 'local' } } : {}),
    }), { marshallOptions: { removeUndefinedValues: true } }),
  };
});

function errorCodes(error) {
  const values = [];
  for (let current = error; current; current = current.cause) {
    values.push(current.name, current.code);
  }
  return values.filter(Boolean);
}

export class RegionalDocumentClient {
  constructor(entries) {
    this.clients = entries;
    this.activeRegion = entries[0].region;
  }
  async send(command) {
    return this.sendWithRegion(() => command);
  }
  async sendWithRegion(commandForRegion) {
    let lastError;
    for (const [index, entry] of this.clients.entries()) {
      try {
        const result = await entry.client.send(commandForRegion(entry.region));
        this.activeRegion = entry.region;
        return result;
      } catch (error) {
        lastError = error;
        const code = errorCodes(error).find((value) => retryInAnotherRegion.has(value));
        if (index === this.clients.length - 1 || !code) throw error;
        console.warn(`DynamoDB ${entry.region} no disponible (${code}); se intenta ${this.clients[index + 1].region}`);
      }
    }
    throw lastError;
  }
}

export const documentClient = new RegionalDocumentClient(clients);
