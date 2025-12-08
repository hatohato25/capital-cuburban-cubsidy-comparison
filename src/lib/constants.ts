import type { Prefecture } from '@/types/subsidy';

/**
 * グラフ表示用の都県カラーマッピング
 */
export const PREFECTURE_CHART_COLORS: Record<Prefecture, string> = {
  東京都: '#DC143C',
  埼玉県: '#4169E1',
  千葉県: '#FF6347',
  神奈川県: '#1E90FF',
};

/**
 * カード表示用の都県スタイルマッピング
 */
export const PREFECTURE_CARD_STYLES: Record<
  Prefecture,
  { bg: string; border: string; text: string }
> = {
  東京都: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600' },
  埼玉県: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600' },
  千葉県: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600' },
  神奈川県: { bg: 'bg-sky-50', border: 'border-sky-500', text: 'text-sky-600' },
};
