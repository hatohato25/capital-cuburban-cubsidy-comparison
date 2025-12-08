import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 頻度に応じた年間金額を計算
 *
 * @param amount - 金額（円）
 * @param frequency - 支給頻度
 * @returns 年間金額（円）
 *
 * @example
 * calculateAmountByFrequency(5000, 'monthly') // 60000（月5000円 × 12ヶ月）
 */
export function calculateAmountByFrequency(
  amount: number,
  frequency: 'once' | 'monthly' | 'yearly'
): number {
  switch (frequency) {
    case 'once':
      return amount;
    case 'monthly':
      return amount * 12;
    case 'yearly':
      return amount;
    default:
      return amount;
  }
}

/**
 * 金額を万円単位でフォーマット
 *
 * @param amount - 金額（円）
 * @returns フォーマットされた金額文字列（万円単位）
 *
 * @example
 * formatAmountInManYen(4560000) // "456万円"
 */
export function formatAmountInManYen(amount: number): string {
  const manYen = Math.round(amount / 10000);
  return `${manYen.toLocaleString()}万円`;
}

/**
 * 収入のバリデーション
 *
 * @note 将来のフォームバリデーション機能で使用予定
 *
 * @param income - 世帯年収（円）
 * @returns バリデーション結果
 */
export function validateIncome(income: number): {
  isValid: boolean;
  error?: string;
} {
  if (Number.isNaN(income)) {
    return { isValid: false, error: '数値を入力してください' };
  }

  if (income < 0) {
    return { isValid: false, error: '0以上の値を入力してください' };
  }

  if (income > 99990000) {
    return { isValid: false, error: '9,999万円以下の値を入力してください' };
  }

  return { isValid: true };
}
