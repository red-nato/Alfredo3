import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { documentClient } from '../infrastructure/database/dynamodb/client.js';
import { hashPassword } from '../application/services/password-hasher.js';

const [, , usernameArg, passwordArg] = process.argv;
if (!usernameArg || !passwordArg) {
  console.error('Uso: node scripts/create-admin-user.js <usuario> <contraseña>');
  process.exit(1);
}

const tableName = process.env.GAME_TABLE_NAME;
if (!tableName) {
  console.error('GAME_TABLE_NAME es requerido (por ejemplo: GAME_TABLE_NAME=MisionEmprende-local node scripts/create-admin-user.js admin miClave)');
  process.exit(1);
}

const username = usernameArg.trim().toLowerCase();
const passwordHash = await hashPassword(passwordArg);

await documentClient.send(new PutCommand({
  TableName: tableName,
  Item: { PK: `ADMIN#${username}`, SK: 'META', entityType: 'ADMIN', username, passwordHash, creadoEn: new Date().toISOString() },
}));

console.log(`Administrador "${username}" creado/actualizado en la tabla ${tableName}.`);
