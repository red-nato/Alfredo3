import { randomUUID } from 'node:crypto';
import {
  BatchWriteCommand, GetCommand, PutCommand, QueryCommand, TransactWriteCommand, UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { documentClient } from '../database/dynamodb/client.js';
import { GameRepository } from '../../domain/repositories/game-repository.js';
import { DomainError } from '../../domain/errors.js';
import { normalise } from '../../domain/entities/session.js';

const key = (code) => `SESSION#${code}`;
const metaKey = (code) => ({ PK: key(code), SK: 'META' });
const teamKey = (code, name) => ({ PK: key(code), SK: `TEAM#${encodeURIComponent(normalise(name))}` });
const toTeam = (item) => item && ({ id: item.id, nombre: item.nombre, puntaje_total: item.puntajeTotal ?? 0, integrantes: item.integrantes ?? [], miembros: item.integrantes ?? [], termino_fase_actual: !!item.terminoFaseActual, fase_terminada: item.faseTerminada ?? null, ya_presento_pitch: !!item.yaPresentoPitch });

export class DynamoGameRepository extends GameRepository {
  constructor({ client = documentClient, tableName = process.env.GAME_TABLE_NAME } = {}) {
    super();
    if (!tableName) throw new Error('GAME_TABLE_NAME es requerido');
    this.client = client; this.tableName = tableName;
  }
  get activeRegion() { return this.client.activeRegion ?? process.env.GAME_DYNAMODB_PRIMARY_REGION ?? process.env.AWS_REGION; }
  async createSession(session) {
    const commandForRegion = (region) => new PutCommand({
      TableName: this.tableName,
      Item: { ...metaKey(session.codigo), entityType: 'SESSION', ...session, writeRegion: region, GSI2PK: 'SESSION', GSI2SK: session.creadoEn },
      ConditionExpression: 'attribute_not_exists(PK)',
    });
    if (typeof this.client.sendWithRegion === 'function') await this.client.sendWithRegion(commandForRegion);
    else await this.client.send(commandForRegion(this.activeRegion));
    session.writeRegion = this.activeRegion;
    return session;
  }
  async getSession(codigo) {
    const response = await this.client.send(new GetCommand({ TableName: this.tableName, Key: metaKey(codigo) }));
    return response.Item;
  }
  async requireSession(codigo) {
    const session = await this.getSession(codigo);
    if (!session) throw new DomainError('Sesión no encontrada', 404);
    return session;
  }
  async listTeams(codigo) {
    const response = await this.client.send(new QueryCommand({ TableName: this.tableName, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :team)', ExpressionAttributeValues: { ':pk': key(codigo), ':team': 'TEAM#' } }));
    return (response.Items ?? []).map(toTeam);
  }
  async getTeam(codigo, nombre) {
    const response = await this.client.send(new GetCommand({ TableName: this.tableName, Key: teamKey(codigo, nombre) }));
    return response.Item;
  }
  async requireTeam(codigo, nombre) {
    const team = await this.getTeam(codigo, nombre);
    if (!team) throw new DomainError('Equipo no encontrado', 404);
    return team;
  }
  async findTeamById(id) {
    const response = await this.client.send(new QueryCommand({ TableName: this.tableName, IndexName: 'GSI1', KeyConditionExpression: 'GSI1PK = :pk', ExpressionAttributeValues: { ':pk': `TEAM#${id}` } }));
    return response.Items?.[0];
  }
  async registerTeam({ codigo, nombre, integrantes }) {
    await this.requireSession(codigo);
    const now = new Date().toISOString(); const id = randomUUID(); const item = { ...teamKey(codigo, nombre), entityType: 'TEAM', id, nombre, integrantes, puntajeTotal: 0, terminoFaseActual: false, yaPresentoPitch: false, creadoEn: now, ultimaConexion: now, GSI1PK: `TEAM#${id}`, GSI1SK: `SESSION#${codigo}` };
    const members = [...new Map(integrantes.map((m) => [normalise(m.nombre), m])).values()];
    try {
      await this.client.send(new TransactWriteCommand({ TransactItems: [
        { Put: { TableName: this.tableName, Item: item, ConditionExpression: 'attribute_not_exists(PK)' } },
        ...members.map((member) => ({ Put: { TableName: this.tableName, Item: { PK: key(codigo), SK: `MEMBER#${encodeURIComponent(normalise(member.nombre))}`, entityType: 'MEMBER_LOCK', teamName: nombre }, ConditionExpression: 'attribute_not_exists(PK)' } })),
      ] }));
    } catch (error) {
      if (error.name === 'TransactionCanceledException' || error.name === 'ConditionalCheckFailedException') throw new DomainError(`Ya existe un equipo o integrante con esos datos en esta sesión`);
      throw error;
    }
    return toTeam(item);
  }
  async updateSession(codigo, attributes) {
    const names = {}; const values = {}; const sets = Object.entries(attributes).map(([property, value], index) => { const n = `#n${index}`; const v = `:v${index}`; names[n] = property; values[v] = value; return `${n} = ${v}`; });
    await this.client.send(new UpdateCommand({ TableName: this.tableName, Key: metaKey(codigo), UpdateExpression: `SET ${sets.join(', ')}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values, ConditionExpression: 'attribute_exists(PK)' }));
  }
  async advanceSessionIfCurrentStage(codigo, expectedStage, attributes) {
    const names = { '#phase': 'faseActual' }; const values = { ':expected': expectedStage };
    const sets = Object.entries(attributes).map(([property, value], index) => {
      const n = `#n${index}`; const v = `:v${index}`; names[n] = property; values[v] = value; return `${n} = ${v}`;
    });
    try {
      await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: metaKey(codigo),
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ConditionExpression: 'attribute_exists(PK) AND #phase = :expected',
      }));
      return true;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') return false;
      throw error;
    }
  }
  async updateTeam(codigo, nombre, attributes) {
    const names = {}; const values = {}; const sets = Object.entries(attributes).map(([property, value], index) => { const n = `#n${index}`; const v = `:v${index}`; names[n] = property; values[v] = value; return `${n} = ${v}`; });
    await this.client.send(new UpdateCommand({ TableName: this.tableName, Key: teamKey(codigo, nombre), UpdateExpression: `SET ${sets.join(', ')}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values, ConditionExpression: 'attribute_exists(PK)' }));
  }
  async resetTeams(codigo, attributes) { for (const team of await this.listTeams(codigo)) await this.updateTeam(codigo, team.nombre, attributes); }
  async addTokens({ codigo, team, valor, origen, descripcion }) {
    const tokenId = randomUUID(); const teamItem = await this.requireTeam(codigo, team.nombre);
    await this.client.send(new TransactWriteCommand({ TransactItems: [
      { Put: { TableName: this.tableName, Item: { PK: key(codigo), SK: `TOKEN#${new Date().toISOString()}#${tokenId}`, entityType: 'TOKEN', tokenId, teamId: teamItem.id, teamName: teamItem.nombre, valor, origen, descripcion, creadoEn: new Date().toISOString() } } },
      { Update: { TableName: this.tableName, Key: teamKey(codigo, teamItem.nombre), UpdateExpression: 'SET puntajeTotal = puntajeTotal + :value', ExpressionAttributeValues: { ':value': valor } } },
    ] }));
    return { tokenId, nuevoPuntaje: teamItem.puntajeTotal + valor };
  }
  async listSessions() {
    const response = await this.client.send(new QueryCommand({ TableName: this.tableName, IndexName: 'GSI2', KeyConditionExpression: 'GSI2PK = :pk', ExpressionAttributeValues: { ':pk': 'SESSION' }, ScanIndexForward: false }));
    return response.Items ?? [];
  }
  async recordAnalyticsEvents(events) {
    for (let offset = 0; offset < events.length; offset += 25) {
      let requests = events.slice(offset, offset + 25).map((event) => ({
        PutRequest: {
          Item: {
            PK: key(event.sessionCode),
            // El eventId estable hace que un reintento del batch sobrescriba el
            // mismo evento en vez de inflar clics o duraciones.
            SK: `ANALYTICS#${event.eventId}`,
            entityType: 'ANALYTICS_EVENT',
            ...event,
          },
        },
      }));
      for (let attempt = 0; requests.length && attempt < 4; attempt += 1) {
        const response = await this.client.send(new BatchWriteCommand({
          RequestItems: { [this.tableName]: requests },
        }));
        requests = response.UnprocessedItems?.[this.tableName] ?? [];
      }
      if (requests.length) throw new Error('DynamoDB no pudo persistir todos los eventos analíticos');
    }
  }
  async listAnalyticsEvents(codigo) {
    const events = [];
    let ExclusiveStartKey;
    do {
      const response = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :analytics)',
        ExpressionAttributeValues: { ':pk': key(codigo), ':analytics': 'ANALYTICS#' },
        ExclusiveStartKey,
      }));
      events.push(...(response.Items ?? []));
      ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return events;
  }
  async touchTeam(codigo, nombre) { return this.updateTeam(codigo, nombre, { ultimaConexion: new Date().toISOString() }); }
}
