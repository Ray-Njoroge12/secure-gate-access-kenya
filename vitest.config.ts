import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'supabase/functions/**/*.test.ts',
      'tests/**/*.test.ts',
      'tests/**/system-integrity-tests.ts'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '**/*.e2e.{test,spec}.{js,ts,jsx,tsx}'
    ],
    testTimeout: 30000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'supabase/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/test/setup.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
  },
  resolve: {
    alias: {
      '@supabase_shared/': '/supabase/functions/_shared/',
      '@/': '/src/',
      '@': '/src',
      '@/components': '/src/components',
      '@/pages': '/src/pages',
      '@/hooks': '/src/hooks',
      '@/lib': '/src/lib',
      '@/integrations': '/src/integrations'
    },
  },
});