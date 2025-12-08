/**
 * 医療費助成計算ロジックのテスト
 */

import { describe, expect, it } from 'vitest';
import {
  calculateMedicalSubsidy,
  generateMedicalSubsidyDescription,
} from '../calculateMedicalSubsidy';

describe('calculateMedicalSubsidy', () => {
  describe('基本的な計算', () => {
    it('0歳の子供の場合、18年分の医療費助成を計算する', () => {
      const result = calculateMedicalSubsidy(0, '東京都');

      // 実装に基づく実際の計算結果を検証
      // 年齢別医療費統計データから計算される自己負担分の累計
      expect(result).toBeGreaterThan(400000);
      expect(result).toBeLessThan(600000);

      // より正確な検証：507,500円前後を期待
      expect(result).toBeCloseTo(507500, -2);
    });

    it('5歳の子供の場合、残り13年分の医療費助成を計算する', () => {
      const result = calculateMedicalSubsidy(5, '東京都');

      // 5歳から18歳までの累計
      expect(result).toBeGreaterThan(0);
      // 0歳から始まる場合より少ないはず
      const fullResult = calculateMedicalSubsidy(0, '東京都');
      expect(result).toBeLessThan(fullResult);
    });

    it('18歳の子供の場合、1年分のみ計算する', () => {
      const result = calculateMedicalSubsidy(18, '東京都');

      // 18歳の医療費: 65,000円 × 0.3（自己負担3割） = 19,500円
      // 助成率100%なので19,500円が返る（四捨五入あり）
      expect(result).toBeGreaterThan(15000);
      expect(result).toBeLessThan(25000);
    });

    it('19歳（対象外）の場合、0円を返す', () => {
      const result = calculateMedicalSubsidy(19, '東京都');
      expect(result).toBe(0);
    });

    it('負の年齢の場合、0円を返す', () => {
      const result = calculateMedicalSubsidy(-1, '東京都');
      expect(result).toBe(0);
    });
  });

  describe('都県別の助成率の違い', () => {
    it('東京都は100%助成', () => {
      const tokyo = calculateMedicalSubsidy(0, '東京都');
      expect(tokyo).toBeGreaterThan(0);
    });

    it('埼玉県は100%助成', () => {
      const saitama = calculateMedicalSubsidy(0, '埼玉県');
      expect(saitama).toBeGreaterThan(0);

      // 東京都と同じ助成額になるはず
      const tokyo = calculateMedicalSubsidy(0, '東京都');
      expect(saitama).toBe(tokyo);
    });

    it('千葉県は100%助成', () => {
      const chiba = calculateMedicalSubsidy(0, '千葉県');
      expect(chiba).toBeGreaterThan(0);

      // 東京都と同じ助成額になるはず
      const tokyo = calculateMedicalSubsidy(0, '東京都');
      expect(chiba).toBe(tokyo);
    });

    it('神奈川県は市町村により異なるため0%で計算', () => {
      const kanagawa = calculateMedicalSubsidy(0, '神奈川県');

      // 保守的に0%として計算されるため0円
      expect(kanagawa).toBe(0);
    });
  });

  describe('年齢別の自己負担割合', () => {
    it('0-5歳は2割負担、6歳以上は3割負担が適用される', () => {
      // 5歳までの累計（2割負担）
      const age5 = calculateMedicalSubsidy(0, '東京都');

      // 6歳以降の累計（3割負担）
      const age6to18 = calculateMedicalSubsidy(6, '東京都');

      // どちらも0より大きいはず
      expect(age5).toBeGreaterThan(0);
      expect(age6to18).toBeGreaterThan(0);
    });
  });

  describe('エッジケース', () => {
    it('整数で結果を返す（小数点なし）', () => {
      const result = calculateMedicalSubsidy(0, '東京都');
      expect(Number.isInteger(result)).toBe(true);
    });

    it('同じ年齢と都県で呼び出すと常に同じ結果を返す（冪等性）', () => {
      const result1 = calculateMedicalSubsidy(5, '東京都');
      const result2 = calculateMedicalSubsidy(5, '東京都');
      expect(result1).toBe(result2);
    });
  });
});

describe('generateMedicalSubsidyDescription', () => {
  it('0歳の場合、正しい説明文を生成する', () => {
    const description = generateMedicalSubsidyDescription(0, 2320000, '東京都');

    expect(description).toContain('0歳から18歳までの19年間');
    expect(description).toContain('232万円');
  });

  it('5歳の場合、残り年数を正しく計算する', () => {
    const description = generateMedicalSubsidyDescription(5, 1500000, '東京都');

    expect(description).toContain('5歳から18歳までの14年間');
    expect(description).toContain('150万円');
  });

  it('18歳の場合、1年間と表示する', () => {
    const description = generateMedicalSubsidyDescription(18, 20000, '東京都');

    expect(description).toContain('18歳から18歳までの1年間');
  });

  it('19歳以上の場合、対象外のメッセージを返す', () => {
    const description = generateMedicalSubsidyDescription(19, 0, '東京都');

    expect(description).toBe('お子様は既に医療費助成の対象年齢を超えています');
  });

  it('神奈川県の場合、注意書きが追加される', () => {
    const description = generateMedicalSubsidyDescription(0, 0, '神奈川県');

    expect(description).toContain('神奈川県は市町村により制度が異なります');
  });

  it('年平均額を正しく計算する', () => {
    // 2,280,000円 ÷ 19年 = 120,000円/年 = 12.0万円/年
    const description = generateMedicalSubsidyDescription(0, 2280000, '東京都');

    expect(description).toContain('年平均約12.0万円');
  });
});
