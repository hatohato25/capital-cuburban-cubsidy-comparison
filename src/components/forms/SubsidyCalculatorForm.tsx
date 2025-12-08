'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { CalculationInput } from '@/types/subsidy';
import { ChildrenInput } from './ChildrenInput';
import { IncomeInput } from './IncomeInput';

interface SubsidyCalculatorFormProps {
  onCalculate: (input: CalculationInput) => void;
}

/**
 * 補助金計算フォーム統合コンポーネント
 *
 * 入力完了検知（debounce 500ms）により、
 * ユーザーが入力を止めた後に自動計算を開始
 */
export function SubsidyCalculatorForm({ onCalculate }: SubsidyCalculatorFormProps) {
  const [input, setInput] = useState<CalculationInput>({
    householdIncome: 0,
    children: [],
  });

  // デバウンス処理（500ms）
  // onCalculateは親コンポーネントでuseCallbackでメモ化されているため安全
  useEffect(() => {
    // 年収が0の場合は計算しない
    if (input.householdIncome === 0) return;

    const timer = setTimeout(() => {
      onCalculate(input);
    }, 500);

    return () => clearTimeout(timer);
  }, [input, onCalculate]);

  return (
    <Card className="p-8 backdrop-blur-sm bg-white/90 border-gray-200/50 shadow-xl">
      <div className="space-y-8">
        <IncomeInput
          value={input.householdIncome}
          onChange={(value) => setInput((prev) => ({ ...prev, householdIncome: value }))}
        />

        <div className="border-t border-gray-200 pt-8">
          <ChildrenInput
            childInfoList={input.children}
            onChange={(children) => setInput((prev) => ({ ...prev, children }))}
          />
        </div>
      </div>
    </Card>
  );
}
