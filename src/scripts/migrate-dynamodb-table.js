import { BatchWriteItemCommand, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const [sourceTable, targetTable] = process.argv.slice(2);
if (!sourceTable || !targetTable || sourceTable === targetTable) {
  console.error('Uso: node scripts/migrate-dynamodb-table.js <tabla-origen> <tabla-destino>');
  process.exit(2);
}

const client = new DynamoDBClient({});
const items = [];
let exclusiveStartKey;

do {
  const page = await client.send(new ScanCommand({
    TableName: sourceTable,
    ExclusiveStartKey: exclusiveStartKey,
    ConsistentRead: true,
  }));
  items.push(...(page.Items ?? []));
  exclusiveStartKey = page.LastEvaluatedKey;
} while (exclusiveStartKey);

let written = 0;
for (let offset = 0; offset < items.length; offset += 25) {
  let pending = items.slice(offset, offset + 25).map((Item) => ({ PutRequest: { Item } }));
  for (let attempt = 1; pending.length && attempt <= 8; attempt += 1) {
    const result = await client.send(new BatchWriteItemCommand({ RequestItems: { [targetTable]: pending } }));
    const retry = result.UnprocessedItems?.[targetTable] ?? [];
    written += pending.length - retry.length;
    pending = retry;
    if (pending.length) await new Promise((resolve) => setTimeout(resolve, 100 * (2 ** attempt)));
  }
  if (pending.length) throw new Error(`AWS no procesó ${pending.length} elementos después de varios reintentos`);
}

const verification = await client.send(new ScanCommand({
  TableName: targetTable,
  Select: 'COUNT',
  ConsistentRead: true,
}));

console.log(JSON.stringify({
  sourceTable,
  targetTable,
  sourceItems: items.length,
  written,
  targetItems: verification.Count ?? 0,
}));
