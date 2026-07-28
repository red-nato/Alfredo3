import { CreateTableCommand, DeleteTableCommand, DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

const tableName = process.env.GAME_TABLE_NAME || 'MisionEmprende-local';
const client = new DynamoDBClient({ region: 'us-east-1', endpoint: process.env.DYNAMODB_ENDPOINT || 'http://127.0.0.1:8000', credentials: { accessKeyId: 'local', secretAccessKey: 'local' } });
const schema = { TableName: tableName, BillingMode: 'PAY_PER_REQUEST', AttributeDefinitions: ['PK', 'SK', 'GSI1PK', 'GSI1SK', 'GSI2PK', 'GSI2SK'].map((AttributeName) => ({ AttributeName, AttributeType: 'S' })), KeySchema: [{ AttributeName: 'PK', KeyType: 'HASH' }, { AttributeName: 'SK', KeyType: 'RANGE' }], GlobalSecondaryIndexes: ['GSI1', 'GSI2'].map((IndexName, index) => ({ IndexName, KeySchema: [{ AttributeName: `GSI${index + 1}PK`, KeyType: 'HASH' }, { AttributeName: `GSI${index + 1}SK`, KeyType: 'RANGE' }], Projection: { ProjectionType: 'ALL' } })) };

const send = async (command) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try { return await client.send(command, { abortSignal: controller.signal }); } finally { clearTimeout(timeout); }
};

console.log(`Conectando a DynamoDB Local para preparar ${tableName}...`);
try {
  await send(new DescribeTableCommand({ TableName: tableName }));
  if (!process.argv.includes('--reset')) {
    console.log(`La tabla ${tableName} ya existe.`);
    process.exit(0);
  }
  await send(new DeleteTableCommand({ TableName: tableName }));
} catch (error) {
  if (error.name !== 'ResourceNotFoundException') {
    console.error(`No se pudo conectar a DynamoDB Local (${error.name}). Ejecuta primero: docker compose -f docker-compose.local.yml up -d`);
    process.exit(1);
  }
}
await send(new CreateTableCommand(schema));
console.log(`Tabla ${tableName} creada.`);
