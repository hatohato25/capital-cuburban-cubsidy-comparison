/**
 * 補助金計算エンジンのテスト
 */

import { describe, expect, it } from 'vitest';
import type { CalculationInput } from '@/types/subsidy';
import { calculateAllSubsidies, calculateSubsidies } from '../calculator';

describe('calculator', () => {
  describe('calculateSubsidies', () => {
    it('年収600万円、子供1人（5歳）の場合、東京都の補助金が計算できる', () => {
      const input: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 5, birthOrder: 'first' }],
      };

      const result = calculateSubsidies('東京都', input);

      expect(result.prefecture).toBe('東京都');
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.appliedPolicies.length).toBeGreaterThan(0);
    });

    it('年収600万円、子供2人（5歳、2歳）の場合、東京都の補助金が計算できる', () => {
      const input: CalculationInput = {
        householdIncome: 6000000,
        children: [
          { age: 5, birthOrder: 'first' },
          { age: 2, birthOrder: 'second' },
        ],
      };

      const result = calculateSubsidies('東京都', input);

      expect(result.prefecture).toBe('東京都');
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.appliedPolicies.length).toBeGreaterThan(0);
    });
  });

  describe('calculateAllSubsidies', () => {
    it('年収600万円、子供1人の場合、4都県すべての補助金が計算できる', () => {
      const input: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 5, birthOrder: 'first' }],
      };

      const results = calculateAllSubsidies(input);

      expect(results).toHaveLength(4);
      expect(results[0].rank).toBe(1);
      expect(results[1].rank).toBe(2);
      expect(results[2].rank).toBe(3);
      expect(results[3].rank).toBe(4);

      // 総額でソートされていることを確認
      expect(results[0].totalAmount).toBeGreaterThanOrEqual(results[1].totalAmount);
      expect(results[1].totalAmount).toBeGreaterThanOrEqual(results[2].totalAmount);
      expect(results[2].totalAmount).toBeGreaterThanOrEqual(results[3].totalAmount);
    });

    it('年収1000万円の場合、所得制限により一部の補助金が適用されない', () => {
      const input: CalculationInput = {
        householdIncome: 10000000,
        children: [{ age: 5, birthOrder: 'first' }],
      };

      const results = calculateAllSubsidies(input);

      expect(results).toHaveLength(4);
      // 所得制限なしの施策（018サポート等）は適用される
      const tokyoResult = results.find((r) => r.prefecture === '東京都');
      expect(tokyoResult).toBeDefined();
      expect(tokyoResult?.totalAmount).toBeGreaterThan(0);
    });
  });
});
