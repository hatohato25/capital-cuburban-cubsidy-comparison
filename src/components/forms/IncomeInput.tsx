'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IncomeInputProps {
  value: number;
  onChange: (value: number) => void;
}

/**
 * 世帯年収入力コンポーネント
 *
 * 大きなフォントサイズと明確なラベルで、
 * 入力が視覚的な焦点となるよう設計
 */
export function IncomeInput({ value, onChange }: IncomeInputProps) {
  // valueは円単位で受け取り、表示は万円単位に変換
  const manYenValue = value === 0 ? 0 : Math.round(value / 10000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const manYen = e.target.value === '' ? 0 : Number(e.target.value);
    // 万円を円に変換して親に渡す（例: 1500万円 → 15000000円）
    const yen = manYen * 10000;
    onChange(yen);
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="income" className="text-lg font-semibold text-gray-800">
        世帯年収（万円）
      </Label>
      <div className="relative">
        <Input
          id="income"
          type="number"
          value={manYenValue === 0 ? '' : manYenValue}
          onChange={handleChange}
          className="text-3xl font-mono h-16 pr-20 text-right font-semibold"
          placeholder="例: 600"
          min={0}
          max={9999}
        />
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl text-gray-500 font-medium">
          万円
        </span>
      </div>
      <p className="text-sm text-gray-600">世帯の合計年収を入力してください（税込）</p>
    </div>
  );
}
