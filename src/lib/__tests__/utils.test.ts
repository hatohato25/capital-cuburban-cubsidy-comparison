/**
 * ユーティリティ関数のテスト
 */

import { describe, expect, it } from 'vitest';
import { calculateAmountByFrequency, formatAmountInManYen, validateIncome } from '../utils';

describe('utils', () => {
  describe('formatAmountInManYen', () => {
    it('金額を正しく万円単位でフォーマットする', () => {
      expect(formatAmountInManYen(4560000)).toBe('456万円');
      expect(formatAmountInManYen(1000000)).toBe('100万円');
      expect(formatAmountInManYen(10000)).toBe('1万円');
      expect(formatAmountInManYen(0)).toBe('0万円');
    });

    it('四捨五入が正しく行われる', () => {
      // 4,999円 → 0万円（切り捨て）
      expect(formatAmountInManYen(4999)).toBe('0万円');
      // 5,000円 → 1万円（切り上げ）
      expect(formatAmountInManYen(5000)).toBe('1万円');
      // 14,999円 → 1万円（切り捨て）
      expect(formatAmountInManYen(14999)).toBe('1万円');
      // 15,000円 → 2万円（切り上げ）
      expect(formatAmountInManYen(15000)).toBe('2万円');
    });

    it('カンマ区切りが正しく表示される', () => {
      expect(formatAmountInManYen(45600000)).toBe('4,560万円');
      expect(formatAmountInManYen(123456789)).toBe('12,346万円');
    });

    it('負の値を処理できる', () => {
      expect(formatAmountInManYen(-1000000)).toBe('-100万円');
    });
  });

  describe('validateIncome', () => {
    it('正常な収入値を検証する', () => {
      const result = validateIncome(6000000);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('0円は有効な収入として扱う', () => {
      const result = validateIncome(0);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('負の値を拒否する', () => {
      const result = validateIncome(-1000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('0以上の値を入力してください');
    });

    it('NaNを拒否する', () => {
      const result = validateIncome(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('数値を入力してください');
    });

    it('上限値（9,999万円）を超える値を拒否する', () => {
      const result = validateIncome(100000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('9,999万円以下の値を入力してください');
    });

    it('境界値（9,999万円）は有効', () => {
      const result = validateIncome(99990000);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('calculateAmountByFrequency', () => {
    it('月額を年額に変換する', () => {
      expect(calculateAmountByFrequency(5000, 'monthly')).toBe(60000);
      expect(calculateAmountByFrequency(10000, 'monthly')).toBe(120000);
    });

    it('年額はそのまま返す', () => {
      expect(calculateAmountByFrequency(100000, 'yearly')).toBe(100000);
    });

    it('一度きりの金額はそのまま返す', () => {
      expect(calculateAmountByFrequency(50000, 'once')).toBe(50000);
    });

    it('0円を正しく処理する', () => {
      expect(calculateAmountByFrequency(0, 'monthly')).toBe(0);
      expect(calculateAmountByFrequency(0, 'yearly')).toBe(0);
      expect(calculateAmountByFrequency(0, 'once')).toBe(0);
    });
  });
});
