import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const noopClient = { send: async () => undefined };

export class S3AnalyticsSink {
  constructor({ client, bucketName = process.env.ANALYTICS_BUCKET_NAME } = {}) {
    this.bucketName = bucketName;
    this.client = client ?? (bucketName ? new S3Client({}) : noopClient);
  }

  async putEvents(events) {
    if (!this.bucketName || !events.length) return;
    const clientDate = new Date(events[0].clientTimestamp);
    const timestamp = Number.isNaN(clientDate.getTime()) ? new Date(events[0].timestamp) : clientDate;
    const year = timestamp.getUTCFullYear();
    const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getUTCDate()).padStart(2, '0');
    const hour = String(timestamp.getUTCHours()).padStart(2, '0');
    const key = `raw/year=${year}/month=${month}/day=${day}/hour=${hour}/${events[0].eventId}.ndjson`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: `${events.map((event) => JSON.stringify({
        event_id: event.eventId,
        event_type: event.eventType,
        session_code: event.sessionCode,
        team_name: event.teamName,
        stage: event.stage,
        action: event.action,
        duration_ms: event.durationMs,
        timed_out: event.timedOut,
        client_timestamp: event.clientTimestamp,
        timestamp: event.timestamp,
      })).join('\n')}\n`,
      ContentType: 'application/x-ndjson',
      ServerSideEncryption: 'AES256',
    }));
  }
}
