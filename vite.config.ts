import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const ICON_CACHE_DIR = path.join(os.tmpdir(), 'zerotrash-icons');
if (!fs.existsSync(ICON_CACHE_DIR)) {
  fs.mkdirSync(ICON_CACHE_DIR, { recursive: true });
}

function isTrustedLocalRequest(req: any): boolean {
  const host = String(req.headers?.host || '');
  const origin = req.headers?.origin ? String(req.headers.origin) : null;
  const okHosts = ['127.0.0.1:1420', 'localhost:1420'];
  if (!okHosts.includes(host)) return false;
  if (origin && !okHosts.map((h) => `http://${h}`).includes(origin)) return false;
  return true;
}

function rustEngineBridgePlugin() {
  return {
    name: 'zerotrash-rust-bridge',
    configureServer(server: any) {
      server.middlewares.use('/api', (req: any, res: any, next: any) => {
        if (!isTrustedLocalRequest(req)) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }
        if (
          req.method === 'POST' &&
          !String(req.headers['content-type'] || '').startsWith('application/json')
        ) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Content-Type must be application/json' }));
          return;
        }
        next();
      });

      server.middlewares.use('/api/icon', (req: any, res: any) => {
        try {
          const url = new URL(req.url || '', 'http://localhost');
          const targetPath = url.searchParams.get('path') || '';
          if (!targetPath || !fs.existsSync(targetPath)) {
            res.statusCode = 404;
            res.end();
            return;
          }

          const hash = crypto.createHash('sha1').update(targetPath).digest('hex');
          const cachedPng = path.join(ICON_CACHE_DIR, `${hash}.png`);

          const sendPng = (filePath: string) => {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            fs.createReadStream(filePath).pipe(res);
          };

          if (fs.existsSync(cachedPng)) {
            sendPng(cachedPng);
            return;
          }

          const iconBin = path.resolve(
            __dirname,
            'src-tauri/target/release/zerotrash-icon'
          );

          if (fs.existsSync(iconBin)) {
            execFile(iconBin, [targetPath, cachedPng], (err) => {
              if (!err && fs.existsSync(cachedPng)) {
                sendPng(cachedPng);
              } else {
                res.statusCode = 404;
                res.end();
              }
            });
          } else {
            res.statusCode = 404;
            res.end();
          }
        } catch {
          res.statusCode = 500;
          res.end();
        }
      });

      server.middlewares.use('/api/invoke', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const { cmd, args } = JSON.parse(body || '{}');
            const releaseBin = path.resolve(
              __dirname,
              'src-tauri/target/release/zerotrash-cli'
            );
            const debugBin = path.resolve(
              __dirname,
              'src-tauri/target/debug/zerotrash-cli'
            );
            const binPath = fs.existsSync(releaseBin) ? releaseBin : debugBin;

            execFile(
              binPath,
              [cmd, JSON.stringify(args || {})],
              { maxBuffer: 25 * 1024 * 1024 },
              (err, stdout, stderr) => {
                res.setHeader('Content-Type', 'application/json');
                if (err) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: stderr || err.message }));
                  return;
                }
                res.statusCode = 200;
                res.end(stdout);
              }
            );
          } catch (e: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: e?.message || 'Invalid JSON' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), rustEngineBridgePlugin()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
});
