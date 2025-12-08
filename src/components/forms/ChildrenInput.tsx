'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ChildInfo } from '@/types/subsidy';

interface ChildrenInputProps {
  childInfoList: ChildInfo[];
  onChange: (childInfoList: ChildInfo[]) => void;
}

/**
 * 子供情報入力コンポーネント
 *
 * 動的に子供を追加/削除でき、出生順序は自動で判定
 */
export function ChildrenInput({ childInfoList, onChange }: ChildrenInputProps) {
  const addChild = () => {
    const birthOrder: ChildInfo['birthOrder'] =
      childInfoList.length === 0
        ? 'first'
        : childInfoList.length === 1
          ? 'second'
          : 'third_or_more';

    onChange([...childInfoList, { age: 0, birthOrder }]);
  };

  const updateChild = (index: number, age: number) => {
    const updated = [...childInfoList];
    updated[index] = { ...updated[index], age };
    onChange(updated);
  };

  const removeChild = (index: number) => {
    const updated = childInfoList.filter((_, i) => i !== index);

    // 削除後、出生順序を再割り当て
    const reordered = updated.map((child, i) => ({
      ...child,
      birthOrder: (i === 0
        ? 'first'
        : i === 1
          ? 'second'
          : 'third_or_more') as ChildInfo['birthOrder'],
    }));

    onChange(reordered);
  };

  const getBirthOrderLabel = (index: number): string => {
    if (index === 0) return '第1子';
    if (index === 1) return '第2子';
    return `第${index + 1}子`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold text-gray-800">お子さんの年齢</Label>
        <Button
          onClick={addChild}
          variant="outline"
          size="sm"
          className="text-cyan-600 border-cyan-600 hover:bg-cyan-50"
        >
          + 追加
        </Button>
      </div>

      {childInfoList.map((child, index) => (
        <div
          key={`${child.birthOrder}-${index}`}
          className="flex gap-3 items-center p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-cyan-300 transition-colors"
        >
          <span className="text-sm font-medium text-gray-600 w-16 flex-shrink-0">
            {getBirthOrderLabel(index)}
          </span>
          <div className="flex-1 flex items-center gap-2">
            <Input
              type="number"
              value={child.age}
              onChange={(e) => updateChild(index, Number(e.target.value))}
              className="font-mono text-lg h-10"
              placeholder="0"
              min={0}
              max={18}
            />
            <span className="text-sm text-gray-600 w-8">歳</span>
          </div>
          <Button
            onClick={() => removeChild(index)}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            削除
          </Button>
        </div>
      ))}

      {childInfoList.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm">「+ 追加」ボタンでお子さんを追加してください</p>
        </div>
      )}

      <p className="text-sm text-gray-600">第3子以降は児童手当の金額が異なります</p>
    </div>
  );
}
