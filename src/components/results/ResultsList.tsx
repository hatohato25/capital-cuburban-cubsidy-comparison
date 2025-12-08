'use client';

import { useState } from 'react';
import type { CalculationResult, Prefecture } from '@/types/subsidy';
import { DetailModal } from '../detail/DetailModal';
import { PrefectureResultCard } from './PrefectureResultCard';

interface ResultsListProps {
  results: CalculationResult[];
}

/**
 * 結果一覧コンポーネント
 *
 * 降順でソートされた結果を表示し、
 * 詳細モーダルの開閉を管理
 */
export function ResultsList({ results }: ResultsListProps) {
  const [selectedPrefecture, setSelectedPrefecture] = useState<Prefecture | null>(null);

  const selectedResult = results.find((r) => r.prefecture === selectedPrefecture);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((result) => (
          <div
            key={result.prefecture}
            className="animate-fadeIn"
            style={{
              animationDelay: `${(result.rank - 1) * 100}ms`,
            }}
          >
            <PrefectureResultCard
              result={result}
              rank={result.rank}
              onDetailClick={() => setSelectedPrefecture(result.prefecture)}
            />
          </div>
        ))}
      </div>

      {/* 詳細モーダル */}
      {selectedPrefecture && selectedResult && (
        <DetailModal result={selectedResult} onClose={() => setSelectedPrefecture(null)} />
      )}
    </>
  );
}
