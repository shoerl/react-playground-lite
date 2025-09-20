import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx'],
    exclude: [
      // Don't treat fixture sources as test files
      'packages/**/test/fixtures/**',
    ],
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@rplite/plugin/manifest': path.resolve(
        rootDir,
        'packages/plugin/src/manifest.ts',
      ),
      '@rplite/plugin': path.resolve(rootDir, 'packages/plugin/src/index.ts'),
    },
  },
});
