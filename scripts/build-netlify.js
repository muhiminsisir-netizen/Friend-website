'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public');
const output = path.join(root, 'dist');
const backendValue = (process.env.BACKEND_URL || '').trim();

if (process.env.NETLIFY && !backendValue) {
  throw new Error('Set BACKEND_URL in Netlify site environment variables to your deployed Node backend URL.');
}

let backendUrl = '';
if (backendValue) {
  let parsed;
  try { parsed = new URL(backendValue); }
  catch { throw new Error('BACKEND_URL must be a valid URL such as https://your-service.onrender.com'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('BACKEND_URL must contain only the backend origin, without a path, query, or fragment.');
  }
  if (process.env.NETLIFY && parsed.protocol !== 'https:') {
    throw new Error('Production BACKEND_URL must use HTTPS.');
  }
  backendUrl = parsed.origin;
}

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });

if (backendUrl) {
  fs.writeFileSync(path.join(output, '_redirects'), [
    `/api/* ${backendUrl}/api/:splat 200!`,
    `/uploads/* ${backendUrl}/uploads/:splat 200!`,
    ''
  ].join('\n'));
}

fs.writeFileSync(path.join(output, '_headers'), [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: DENY',
  '  Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)',
  ''
].join('\n'));

console.log(`Netlify frontend built to dist/${backendUrl ? ' with API and upload proxy rules' : ' (no backend proxy configured)'}.`);
