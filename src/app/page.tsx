'use client';

import { useCallback, useState } from 'react';
import { ComparisonChart } from '@/components/charts/ComparisonChart';
import { SubsidyCalculatorForm } from '@/components/forms/SubsidyCalculatorForm';
import { PageLayout } from '@/components/layout/PageLayout';
import { ResultsList } from '@/components/results/ResultsList';
import { calculateAllSubsidies } from '@/lib/calculator';
import type { CalculationInput, CalculationResult } from '@/types/subsidy';

/**
 * メインページ
 *
 * 入力フォーム → 計算 → グラフ表示 → 結果カード表示の流れを統合
 */
export default function Home() {
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // handleCalculateをメモ化して、無限ループを防ぐ
  const handleCalculate = useCallback((input: CalculationInput) => {
    setIsCalculating(true);

    // 計算処理（非同期風に少し遅延）
    setTimeout(() => {
      try {
        const calculatedResults = calculateAllSubsidies(input);
        setResults(calculatedResults);
      } catch (error) {
        console.error('計算エラー:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, []); // 依存配列は空 - setStateは常に安定している

  return (
    <PageLayout>
      <div className="space-y-12">
        {/* 入力フォーム */}
        <section>
          <SubsidyCalculatorForm onCalculate={handleCalculate} />
        </section>

        {/* 計算中のローディング */}
        {isCalculating && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">計算中...</p>
          </div>
        )}

        {/* 結果表示 */}
        {!isCalculating && results.length > 0 && (
          <>
            {/* カード一覧セクション */}
            <section className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">都県別の詳細</h2>
              <ResultsList results={results} />
            </section>

            {/* グラフセクション */}
            <section>
              <ComparisonChart results={results} />
            </section>
          </>
        )}

        {/* 初期状態のメッセージ */}
        {!isCalculating && results.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-6 rounded-full bg-gradient-to-br from-cyan-100 to-orange-100 mb-4">
              <svg
                className="w-12 h-12 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              世帯年収とお子さんの情報を入力してください
            </h3>
            <p className="text-gray-600">入力すると、自動で各都県の補助金総額を計算します</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
