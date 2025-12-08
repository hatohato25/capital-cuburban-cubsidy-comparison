import type { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
}

/**
 * ページ全体のレイアウトコンポーネント
 *
 * Optimistic Editorialデザインコンセプトに基づき、
 * グラデーション背景とグレインテクスチャで洗練された雰囲気を演出
 */
export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 relative">
      {/* グレインテクスチャ - 微細なノイズで質感を追加 */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ヘッダー */}
      <header className="relative z-10 border-b border-gray-200/50 backdrop-blur-sm bg-white/80">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-orange-500 bg-clip-text text-transparent">
            首都圏子育て補助金比較
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            東京・埼玉・千葉・神奈川の補助金を一目で比較
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="relative z-10 container mx-auto px-6 py-12">{children}</main>

      {/* フッター */}
      <footer className="relative z-10 border-t border-gray-200/50 mt-24 backdrop-blur-sm bg-white/80">
        <div className="container mx-auto px-6 py-8 text-sm text-gray-600">
          <p className="mb-2">
            <strong>免責事項:</strong>{' '}
            本サイトの計算結果は参考値です。正確な情報は各自治体の公式サイトでご確認ください。
          </p>
          <p className="text-xs text-gray-500">
            最終更新日: 2025年12月 | データは各自治体の公式発表に基づきます
          </p>
        </div>
      </footer>
    </div>
  );
}
