#!/usr/bin/env node
/**
 * PathAura — free the development ports.
 *
 * Use this when a previous run was closed abruptly and port 4000 or 5173 is
 * still held by an orphaned process.
 */

const { execSync } = require('node:child_process');

const PORTS = [4000, 5173];

function pidsOnPort(port) {
  try {
    if (process.platform !== 'win32') {
      const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' });
      return out.split(/\r?\n/).filter(Boolean);
    }

    // No "-p tcp": that shows IPv4 only, and Vite listens on [::1] (IPv6).
    const out = execSync('netstat -ano', { encoding: 'utf8' });
    const found = new Set();
    for (const line of out.split(/\r?\n/)) {
      // Columns: proto, local address, foreign address, state, pid.
      const cols = line.trim().split(/\s+/);
      if (cols.length < 5 || !cols[0].startsWith('TCP') || cols[3] !== 'LISTENING') continue;
      // Handles 0.0.0.0:4000, 127.0.0.1:4000 and [::1]:5173 alike.
      const local = cols[1];
      if (Number(local.slice(local.lastIndexOf(':') + 1)) !== port) continue;
      const pid = cols[4];
      if (pid && pid !== '0') found.add(pid);
    }
    return [...found];
  } catch {
    return [];
  }
}

let killed = 0;
for (const port of PORTS) {
  for (const pid of pidsOnPort(port)) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore' });
      } else {
        process.kill(Number(pid), 'SIGKILL');
      }
      console.log(`Stopped process ${pid} on port ${port}.`);
      killed += 1;
    } catch {
      console.log(`Could not stop process ${pid} on port ${port} — try a new terminal.`);
    }
  }
}

console.log(killed ? '\nPorts are free. Run "npm start" to launch PathAura.' : 'Nothing was running on ports 4000 or 5173.');
