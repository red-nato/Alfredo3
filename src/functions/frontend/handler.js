import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const bucket = process.env.FRONTEND_BUCKET_NAME;
const textTypes = new Set(['text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json', 'image/svg+xml']);
const contentTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const extension = (key) => {
  const index = key.lastIndexOf('.');
  return index < 0 ? '' : key.slice(index).toLowerCase();
};

const objectKey = (event) => {
  let path = event.pathParameters?.proxy ?? '';
  try { path = decodeURIComponent(path); } catch { return null; }
  path = path.replace(/^\/+/, '');
  if (path.split('/').includes('..')) return null;
  if (!path || path.endsWith('/')) return `${path}index.html`;
  // API Gateway normaliza /panel-admin/ como /panel-admin y elimina la barra
  // final. Las rutas sin extensión representan directorios del frontend.
  if (!path.split('/').at(-1).includes('.')) return `${path}/index.html`;
  return path;
};

const response = (statusCode, body, contentType = 'text/plain', isBase64Encoded = false) => ({
  statusCode,
  headers: {
    'Content-Type': `${contentType}${textTypes.has(contentType) ? '; charset=utf-8' : ''}`,
    'Cache-Control': contentType === 'text/html' ? 'no-cache' : 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
  },
  isBase64Encoded,
  body,
});

export const handler = async (event) => {
  const key = objectKey(event);
  if (!key || !bucket) return response(400, 'Solicitud inválida');

  try {
    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = await object.Body.transformToByteArray();
    const contentType = object.ContentType ?? contentTypes[extension(key)] ?? 'application/octet-stream';
    if (textTypes.has(contentType)) return response(200, new TextDecoder().decode(bytes), contentType);
    return response(200, Buffer.from(bytes).toString('base64'), contentType, true);
  } catch (error) {
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return response(404, '<!doctype html><meta charset="utf-8"><h1>404</h1><p>Recurso no encontrado.</p>', 'text/html');
    }
    console.error('No se pudo servir el frontend', { key, name: error?.name });
    return response(500, 'No se pudo cargar el frontend');
  }
};
