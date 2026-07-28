// Servidor estático sin dependencias para probar el frontend en local.
// Uso: node frontend/serve.mjs [puerto=8080]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.argv[2]) || 8080;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.mp3': 'audio/mpeg',
    '.webmanifest': 'application/manifest+json',
};

// Replica las rutas "limpias" que tenía Django (core/urls.py): '/', '/profesor/'
// y '/panel-admin/' resuelven a un .html sin que la URL lo muestre.
async function resolveFile(pathname) {
    if (pathname === '/') return join(ROOT, 'index.html');
    const clean = pathname.replace(/\/+$/, '');
    const candidates = [join(ROOT, pathname), `${join(ROOT, clean)}.html`, join(ROOT, clean, 'index.html')];
    for (const candidate of candidates) {
        if (!candidate.startsWith(ROOT)) continue;
        try {
            const info = await stat(candidate);
            if (info.isFile()) return candidate;
        } catch { /* probar el siguiente candidato */ }
    }
    return null;
}

createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = normalize(decodeURIComponent(url.pathname));

    const filePath = await resolveFile(pathname);
    if (!filePath) {
        res.writeHead(404).end('Not found');
        return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
}).listen(PORT, () => {
    console.log(`Frontend servido en http://localhost:${PORT}`);
});
