const { spawn } = require('node:child_process');

const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npm run dev -- --port 3000']
  : ['run', 'dev', '--', '--port', '3000'];
const child = spawn(command, args, {
  env: {
    ...process.env,
    // Must match tests/ui/fixtures.ts. This is synthetic test data only.
    SESSION_SECRET: 'f'.repeat(64),
    BACKEND_URL: process.env.BACKEND_URL || 'http://127.0.0.1:3001',
  },
  stdio: 'inherit',
});

const stop = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
