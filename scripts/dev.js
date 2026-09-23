#!/usr/bin/env node
/**
 * PathAura — one-command development launcher.
 *
 * Starts the API (http://localhost:4000) and the web app (http://localhost:5173)
 * together, prefixes each line so you can tell them apart, and shuts both down
 * cleanly on Ctrl+C. Nothing else needs to be installed: the database is SQLite
 * and runs inside the API process.
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SERVER = path.join(ROOT, 'server');
const CLIENT = path.join(ROOT, 'client');
const API_PORT = 4000;
const WEB_PORT = 5173;

const colour = process.stdout.isTTY
  ? { api: '\x1b[36m', web: '\x1b[35m', dim: '\x1b[2m', bold: '\x1b[1m', warn: '\x1b[33m', off: '\x1b[0m' }
  : { api: '', web: '', dim: '', bold: '', warn: '', off: '' };

/** Resolve true if something is listening on `port` at `host`. */
function hostInUse(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (inUse) => {
      socket.destroy();
      resolve(inUse);
    };
    socket.setTimeout(700);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

/**
 * Resolve true if anything holds `port`. Both stacks must be checked: the API
 * binds IPv4 while Vite binds [::1], so testing only 127.0.0.1 reports a busy
 * web port as free.
 */
async function portInUse(port) {
  const [v4, v6] = await Promise.all([hostInUse('127.0.0.1', port), hostInUse('::1', port)]);
  return v4 || v6;
}

const children = [];
let shuttingDown = false;

/**
 * Start one service by running its Node entry point directly.
 *
 * Deliberately not "npm run" through a shell: Node 24 on Windows refuses to
 * spawn a .cmd without shell: true (EINVAL), and shell: true with arguments is
 * itself deprecated. Calling node on the real script sidesteps both.
 */
function run(name, tint, script, cwd, args = []) {
  const child = spawn(process.execPath, [script, ...args], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  children.push(child);

  const label = tint + name.padEnd(3) + colour.off + ' ' + colour.dim + '|' + colour.off + ' ';
  const forward = (stream) => {
    let buffer = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) {
        if (/^\s*$/.test(line)) continue;
        process.stdout.write(label + line + '\n');
      }
    });
  };
  forward(child.stdout);
  forward(child.stderr);

  child.on('exit', (code) => {
    if (shuttingDown) return;
    process.stdout.write(label + colour.warn + 'stopped (exit ' + code + ')' + colour.off + '\n');
    shutdown(code === null ? 1 : code);
  });
  return child;
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (process.platform === 'win32') {
      // nodemon and vite spawn their own children, so kill the whole tree.
      spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
  setTimeout(() => process.exit(code), 400);
}

process.on('SIGINT', () => {
  process.stdout.write('\nShutting down...\n');
  shutdown(0);
});
process.on('SIGTERM', () => shutdown(0));

(async () => {
  const nodemonBin = path.join(SERVER, 'node_modules', 'nodemon', 'bin', 'nodemon.js');
  const viteBin = path.join(CLIENT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(nodemonBin) || !fs.existsSync(viteBin)) {
    console.error('\n' + colour.warn + 'Dependencies are not installed yet.' + colour.off);
    console.error('Run this once, then try again:\n\n  npm run setup\n');
    process.exit(1);
  }

  const busy = [];
  if (await portInUse(API_PORT)) busy.push('API port ' + API_PORT);
  if (await portInUse(WEB_PORT)) busy.push('web port ' + WEB_PORT);
  if (busy.length) {
    console.error('\n' + colour.warn + busy.join(' and ') + ' already in use.' + colour.off);
    console.error('PathAura may already be running in another terminal - open http://localhost:5173 first.');
    console.error('To free the ports:  npm run stop\n');
    process.exit(1);
  }

  console.log('\n' + colour.bold + 'PathAura' + colour.off + colour.dim + ' - starting API and web app...' + colour.off + '\n');
  run('api', colour.api, nodemonBin, SERVER, ['src/server.js']);
  run('web', colour.web, viteBin, CLIENT);

  // Give both a moment to bind, then print the only thing you actually need.
  setTimeout(() => {
    if (shuttingDown) return;
    console.log([
      '',
      colour.bold + 'Open the app:' + colour.off + '   http://localhost:' + WEB_PORT,
      colour.dim + 'API health:' + colour.off + '     http://localhost:' + API_PORT + '/api/health',
      '',
      colour.bold + 'Demo logins' + colour.off + colour.dim + '  (password for all three: Demo1234)' + colour.off,
      '  seeker@demo.rw     job seeker',
      '  employer@demo.rw   employer',
      '  admin@demo.rw      administrator',
      '',
      colour.dim + 'Press Ctrl+C to stop both.' + colour.off,
      '',
    ].join('\n'));
  }, 3500);
})();
