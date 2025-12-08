'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { PREFECTURE_CHART_COLORS } from '@/lib/constants';
import { formatAmountInManYen } from '@/lib/utils';
import type { CalculationResult, Prefecture } from '@/types/subsidy';

interface ComparisonChartProps {
  results: CalculationResult[];
}

/**
 * カスタムツールチップ用のデータ型
 */
interface TooltipPayload {
  payload: {
    prefecture: Prefecture;
    totalAmount: number;
    rank: number;
    policyCount: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

/**
 * カスタムツールチップ
 */
function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <p className="font-bold text-gray-900 mb-1">{data.prefecture}</p>
      <p className="text-sm text-gray-600">
        総額:{' '}
        <span className="font-mono font-bold text-cyan-600">
          {formatAmountInManYen(data.totalAmount)}
        </span>
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {data.rank}位 / {data.policyCount}件の補助金
      </p>
    </div>
  );
}

/**
 * 比較グラフコンポーネント
 *
 * 横棒グラフで都県間の補助金総額を視覚的に比較
 */
export function ComparisonChart({ results }: ComparisonChartProps) {
  // グラフ用データを準備
  const chartData = results.map((result) => ({
    prefecture: result.prefecture,
    totalAmount: result.totalAmount,
    displayAmount: Math.round(result.totalAmount / 10000), // 万円単位
    rank: result.rank,
    policyCount: result.appliedPolicies.length,
  }));

  return (
    <Card className="p-6 backdrop-blur-sm bg-white/90 border-gray-200/50 shadow-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">都県別補助金額の比較</h2>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" tickFormatter={(value) => `${value}万円`} stroke="#6B7280" />
          <YAxis type="category" dataKey="prefecture" stroke="#6B7280" width={80} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }} />
          <Bar dataKey="displayAmount" radius={[0, 8, 8, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.prefecture}
                fill={PREFECTURE_CHART_COLORS[entry.prefecture as Prefecture]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-sm text-gray-600 text-center mt-4">
        金額が大きいほど、子育て支援が手厚い自治体です
      </p>
    </Card>
  );
}
