import '@testing-library/jest-dom/vitest';
import fs from 'fs';
import path from 'path';

// Minimal env file loader (avoids adding dotenv dependency while npm is unstable)
function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!process.env[key] && val) process.env[key] = val;
  });
}

loadEnvFile(path.resolve('.env.local'));
loadEnvFile(path.resolve('.env'));

const isUnitTest = process.env.UNIT_TESTS === '1';
const isIntegration = process.env.INTEGRATION_TESTS === '1';

if (process.env.DEBUG_TESTS) {
  console.log('[vitest.setup] Mode:', isIntegration ? 'INTEGRATION' : isUnitTest ? 'UNIT/MOCK' : 'DEFAULT');
}

console.log('[vitest.setup] Test environment initialized');