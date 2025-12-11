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
      expect(result.totalMaxAmount).toBeGreaterThan(0);
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
      expect(result.totalMaxAmount).toBeGreaterThan(0);
      expect(result.appliedPolicies.length).toBeGreaterThan(0);
    });

    it('totalMaxAmountがtotalAmount以上であることを確認', () => {
      const input: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 5, birthOrder: 'first' }],
      };

      const result = calculateSubsidies('東京都', input);

      // totalMaxAmount（0-18歳）はtotalAmount（5-18歳）以上であるはず
      expect(result.totalMaxAmount).toBeGreaterThanOrEqual(result.totalAmount);
    });

    it('0歳の場合、totalMaxAmountとtotalAmountが同じ値になる', () => {
      const input: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 0, birthOrder: 'first' }],
      };

      const result = calculateSubsidies('東京都', input);

      // 0歳の場合、満額と残り受給予定額は同じはず
      expect(result.totalMaxAmount).toBe(result.totalAmount);
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

      // 残り受給予定額（totalAmount）でソートされていることを確認
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

    it('各年齢での総補助金額が正しく計算される', () => {
      // 0歳の場合: 0-18歳の全期間の補助金
      const input0Age: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 0, birthOrder: 'first' }],
      };
      const results0Age = calculateAllSubsidies(input0Age);
      const totalAmount0Age = results0Age[0].totalAmount;

      // 5歳の場合: 5-18歳の残り期間の補助金
      const input5Age: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 5, birthOrder: 'first' }],
      };
      const results5Age = calculateAllSubsidies(input5Age);
      const totalAmount5Age = results5Age[0].totalAmount;

      // 18歳の場合: 18歳のみの補助金
      const input18Age: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 18, birthOrder: 'first' }],
      };
      const results18Age = calculateAllSubsidies(input18Age);
      const totalAmount18Age = results18Age[0].totalAmount;

      // 年齢が上がるごとに総補助金額が減少することを確認
      expect(totalAmount0Age).toBeGreaterThan(totalAmount5Age);
      expect(totalAmount5Age).toBeGreaterThan(totalAmount18Age);

      // 各施策にmaxAmount（0歳からの満額）とreceivedAmount（受給済み額）が設定されていることを確認
      const firstPolicy = results5Age[0].appliedPolicies[0];
      expect(firstPolicy.maxAmount).toBeDefined();
      expect(firstPolicy.receivedAmount).toBeDefined();
    });

    it('各年齢でのランキングが正しく計算される', () => {
      // 0歳の場合のランキング
      const input0Age: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 0, birthOrder: 'first' }],
      };
      const results0Age = calculateAllSubsidies(input0Age);

      // 5歳の場合のランキング
      const input5Age: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 5, birthOrder: 'first' }],
      };
      const results5Age = calculateAllSubsidies(input5Age);

      // 18歳の場合のランキング
      const input18Age: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 18, birthOrder: 'first' }],
      };
      const results18Age = calculateAllSubsidies(input18Age);

      // 各年齢でランキングが1-4位で設定されていることを確認
      expect(results0Age.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
      expect(results5Age.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
      expect(results18Age.map((r) => r.rank)).toEqual([1, 2, 3, 4]);

      // ランキングは残り受給予定額（totalAmount）でソートされるため、年齢により異なる可能性がある
      // 各年齢で正しくソートされていることのみ確認
      expect(results0Age[0].totalAmount).toBeGreaterThanOrEqual(results0Age[1].totalAmount);
      expect(results5Age[0].totalAmount).toBeGreaterThanOrEqual(results5Age[1].totalAmount);
      expect(results18Age[0].totalAmount).toBeGreaterThanOrEqual(results18Age[1].totalAmount);
    });

    it('totalMaxAmountは年齢によらず一定である', () => {
      // 0歳の場合
      const input0Age: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 0, birthOrder: 'first' }],
      };
      const results0Age = calculateAllSubsidies(input0Age);

      // 5歳の場合
      const input5Age: CalculationInput = {
        householdIncome: 6000000,
        children: [{ age: 5, birthOrder: 'first' }],
      };
      const results5Age = calculateAllSubsidies(input5Age);

      // totalMaxAmount（満額）は年齢によらず同じはず
      results0Age.forEach((result0) => {
        const result5 = results5Age.find((r) => r.prefecture === result0.prefecture);
        expect(result5).toBeDefined();
        if (result5) {
          expect(result0.totalMaxAmount).toBe(result5.totalMaxAmount);
        }
      });
    });
  });
});
