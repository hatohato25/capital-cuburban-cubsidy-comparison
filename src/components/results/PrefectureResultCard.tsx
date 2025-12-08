'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PREFECTURE_CARD_STYLES } from '@/lib/constants';
import { formatAmountInManYen } from '@/lib/utils';
import type { CalculationResult } from '@/types/subsidy';

interface PrefectureResultCardProps {
  result: CalculationResult;
  rank: number;
  onDetailClick: () => void;
}

/**
 * ランキングバッジのスタイル
 */
const rankStyles = [
  'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white', // 1位: ゴールド
  'bg-gradient-to-br from-gray-300 to-gray-400 text-white', // 2位: シルバー
  'bg-gradient-to-br from-amber-600 to-amber-800 text-white', // 3位: ブロンズ
  'bg-gray-100 text-gray-700', // 4位
];

/**
 * 都県別結果カードコンポーネント
 *
 * 大胆な数字と都県カラーで視覚的なインパクトを与える
 */
export function PrefectureResultCard({ result, rank, onDetailClick }: PrefectureResultCardProps) {
  const colors = PREFECTURE_CARD_STYLES[result.prefecture];
  const rankStyle = rankStyles[rank - 1] || rankStyles[3];

  return (
    <Card
      className={`p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-l-4 ${colors.border} ${colors.bg}`}
    >
      <div className="space-y-4">
        {/* ヘッダー: 都県名 + ランキング */}
        <div className="flex justify-between items-start">
          <h3 className={`text-2xl font-bold ${colors.text}`}>{result.prefecture}</h3>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${rankStyle} shadow-md`}>
            {rank}位
          </span>
        </div>

        {/* 補助金総額 - 巨大な数字で主役に */}
        <div className="py-6">
          <p className="text-sm text-gray-600 mb-2 font-medium">総補助金額</p>
          <p className={`text-5xl md:text-6xl font-bold tracking-tight font-mono ${colors.text}`}>
            {formatAmountInManYen(result.totalAmount)}
          </p>
        </div>

        {/* 適用施策数 */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {result.appliedPolicies.length}件の補助金が適用されます
          </p>
          <Button
            onClick={onDetailClick}
            variant="outline"
            size="sm"
            className={`${colors.text} ${colors.border} hover:${colors.bg}`}
          >
            詳細を見る
          </Button>
        </div>
      </div>
    </Card>
  );
}
