'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatAmountInManYen } from '@/lib/utils';
import type { CalculationResult } from '@/types/subsidy';

interface DetailModalProps {
  result: CalculationResult;
  onClose: () => void;
}

/**
 * カテゴリごとのアイコン
 */
const categoryIcons: Record<string, string> = {
  現金給付: '💰',
  教育費補助: '🎓',
  医療費補助: '🏥',
  '出産・育児支援': '🍼',
  その他: '📋',
};

/**
 * 詳細モーダルコンポーネント
 *
 * 補助金の内訳を施策別に表示し、
 * 出典情報と免責事項を明記
 */
export function DetailModal({ result, onClose }: DetailModalProps) {
  // 残り受給予定額が0円より大きい施策のみフィルタリング
  const activePolicies = result.appliedPolicies.filter((applied) => applied.calculatedAmount > 0);

  // カテゴリごとにグループ化
  const groupedPolicies = activePolicies.reduce(
    (acc, applied) => {
      const category = applied.policy.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(applied);
      return acc;
    },
    {} as Record<string, typeof activePolicies>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{result.prefecture} - 補助金詳細</DialogTitle>
          <DialogDescription className="text-base">
            総額:{' '}
            <span className="font-bold text-2xl text-cyan-600">
              {formatAmountInManYen(result.totalAmount)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedPolicies).map(([category, policies]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <span>{categoryIcons[category] || '📋'}</span>
                {category}
              </h3>

              {policies.map((applied) => (
                <div
                  key={applied.policy.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors"
                >
                  {/* 残り受給予定額（メイン表示） */}
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900">{applied.policy.name}</h4>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">💰 残り受給予定額</div>
                      <span className="font-mono font-bold text-cyan-600 text-xl">
                        {formatAmountInManYen(applied.calculatedAmount)}
                      </span>
                    </div>
                  </div>

                  {/* 年齢範囲情報の表示 */}
                  {applied.ageRange && applied.ageRange.years > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        <strong>対象期間:</strong> {applied.ageRange.fromAge}歳から
                        {applied.ageRange.toAge}歳まで（
                        {applied.ageRange.years}年間）
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        ※お子様の現在年齢から制度上限年齢までの金額です
                      </p>
                    </div>
                  )}

                  {/* 参考情報: 満額・受給済み額 */}
                  {applied.maxAmount !== undefined && applied.receivedAmount !== undefined && (
                    <div className="bg-gray-100 rounded p-3 mb-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">📊 参考情報</div>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>
                            ・満額（0歳〜{applied.policy.conditions?.childCondition?.maxAge ?? 18}
                            歳）:
                          </span>
                          <span className="font-mono font-semibold">
                            {formatAmountInManYen(applied.maxAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>・受給済み（0歳〜現在まで）:</span>
                          <span className="font-mono font-semibold">
                            {formatAmountInManYen(applied.receivedAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-2">{applied.policy.description}</p>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-white rounded border border-gray-300">
                      制度対象年齢: {applied.policy.conditions?.childCondition?.minAge ?? 0}〜
                      {applied.policy.conditions?.childCondition?.maxAge ?? 18}歳
                    </span>
                  </div>

                  {applied.policy.metadata?.sourceUrl && (
                    <a
                      href={applied.policy.metadata.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-600 hover:underline mt-2 inline-block"
                    >
                      公式サイトで詳細を確認 →
                    </a>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* 免責事項 */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">⚠️ 免責事項</h4>
            <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
              <li>計算結果は参考値です。実際の金額とは異なる場合があります。</li>
              <li>補助金の適用条件は個別の状況により異なります。</li>
              <li>最新の情報は必ず各自治体の公式サイトでご確認ください。</li>
              <li>本サイトは公式な行政サービスではありません。</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
