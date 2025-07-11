import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@supabase_shared/': '/supabase/functions/_shared/',
      '@/': '/src/',
    },
  },
});