import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');
const frontend = path.join(root, 'frontend');

execSync('npm run build', {
  cwd: frontend,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_BASE_URL: process.env.DESKTOP_API_URL ?? 'http://127.0.0.1:3000',
  },
});
