import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // jsdom環境でReactコンポーネントのテストを実行
    environment: 'jsdom',
    // テストファイルのパターン
    include: ['**/*.{test,spec}.{ts,tsx}'],
    // グローバルなテストAPI（describe, it, expectなど）を自動でインポート
    globals: true,
    // セットアップファイル
    setupFiles: ['./vitest.setup.ts'],
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'out/',
        '**/*.config.{ts,js}',
        '**/types/**',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      // Next.jsのパスエイリアス(@/)に対応
      '@': path.resolve(__dirname, './src'),
    },
  },
});
