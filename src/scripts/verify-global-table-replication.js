import { randomUUID } from 'node:crypto';
import { DeleteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const tableName = process.env.TABLE_NAME ?? 'mision-emprende-dev-game';
const primaryRegion = process.env.PRIMARY_REGION ?? 'us-east-1';
const replicaRegion = process.env.REPLICA_REGION ?? 'us-west-2';
const keepProbe = process.argv.includes('--keep');
const primary = new DynamoDBClient({ region: primaryRegion });
const replica = new DynamoDBClient({ region: replicaRegion });
const probeId = randomUUID();
const key = { PK: { S: `REPLICATION_TEST#${probeId}` }, SK: { S: 'PROBE' } };

const waitFor = async (client, expectedValue, timeoutMs = 60_000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await client.send(new GetItemCommand({ TableName: tableName, Key: key, ConsistentRead: false }));
    if (result.Item?.value?.S === expectedValue) return Date.now() - startedAt;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`La réplica no mostró el valor ${expectedValue} dentro de ${timeoutMs} ms`);
};

await primary.send(new PutItemCommand({
  TableName: tableName,
  Item: { ...key, entityType: { S: 'REPLICATION_TEST' }, value: { S: 'east-to-west' }, createdAt: { S: new Date().toISOString() } },
}));
const eastToWestMs = await waitFor(replica, 'east-to-west');
console.log(`us-east-1 → us-west-2: ${eastToWestMs} ms`);

await replica.send(new PutItemCommand({
  TableName: tableName,
  Item: { ...key, entityType: { S: 'REPLICATION_TEST' }, value: { S: 'west-to-east' }, updatedAt: { S: new Date().toISOString() } },
}));
const westToEastMs = await waitFor(primary, 'west-to-east');
console.log(`us-west-2 → us-east-1: ${westToEastMs} ms`);

if (!keepProbe) {
  await primary.send(new DeleteItemCommand({ TableName: tableName, Key: key }));
  console.log('Sonda eliminada después de la prueba.');
} else {
  console.log(`Sonda conservada: PK=${key.PK.S}, SK=PROBE`);
}

console.log(JSON.stringify({ tableName, probeId, eastToWestMs, westToEastMs, kept: keepProbe }));
