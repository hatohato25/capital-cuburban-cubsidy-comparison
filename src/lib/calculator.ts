/**
 * 補助金計算エンジン
 *
 * 世帯年収と子供の情報から、各都県の補助金総額を計算します。
 */

import type {
  AppliedPolicy,
  CalculationInput,
  CalculationResult,
  ChildCondition,
  ChildInfo,
  IncomeTier,
  Prefecture,
  Subsidy,
  VariableAmountSubsidy,
} from '@/types/subsidy';
import { isVariableAmountSubsidy } from '@/types/subsidy';
import { calculateMedicalSubsidy } from './calculateMedicalSubsidy';
import { getAllPrefectures, loadPrefectureData } from './dataLoader';
import { calculateAmountByFrequency } from './utils';

/**
 * すべての都県の補助金を計算し、ランキング付きで返す
 *
 * @param input - 計算入力パラメータ（世帯年収、子供の情報）
 * @returns 都県別の計算結果（総額降順でソート済み、ランキング付き）
 *
 * @example
 * const results = calculateAllSubsidies({
 *   householdIncome: 6000000,
 *   children: [
 *     { age: 5, birthOrder: 'first' },
 *     { age: 2, birthOrder: 'second' }
 *   ]
 * });
 */
export function calculateAllSubsidies(input: CalculationInput): CalculationResult[] {
  const prefectures = getAllPrefectures();

  const results = prefectures.map((prefecture) => calculateSubsidies(prefecture, input));

  // 総額でソート（降順）してランキングを付与
  return results
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
}

/**
 * メイン計算関数: 指定された都県の補助金を計算
 *
 * @param prefecture - 都県名
 * @param input - 計算入力パラメータ
 * @returns 計算結果
 */
export function calculateSubsidies(
  prefecture: Prefecture,
  input: CalculationInput
): CalculationResult {
  const data = loadPrefectureData(prefecture);

  // 1. 所得制限でフィルタリング
  const eligibleSubsidies = filterByIncomeLimit(data.policies, input.householdIncome);

  // 2. 子供の条件でフィルタリング
  const applicableSubsidies = filterByChildConditions(eligibleSubsidies, input.children);

  // 3. 各補助金の金額を計算
  const appliedPolicies = applicableSubsidies.map((subsidy) =>
    calculateSubsidyAmount(subsidy, input)
  );

  // 4. 合計金額を計算
  const totalAmount = appliedPolicies.reduce((sum, policy) => sum + policy.calculatedAmount, 0);

  return {
    prefecture,
    appliedPolicies,
    totalAmount,
    calculatedAt: new Date().toISOString(),
    rank: 0, // ランキングは後で設定
  };
}

/**
 * 所得制限による補助金のフィルタリング
 *
 * @param subsidies - 補助金リスト
 * @param householdIncome - 世帯年収（円）
 * @returns 所得制限を満たす補助金のリスト
 */
function filterByIncomeLimit(
  subsidies: (Subsidy | VariableAmountSubsidy)[],
  householdIncome: number
): (Subsidy | VariableAmountSubsidy)[] {
  return subsidies.filter((subsidy) => {
    const { incomeLimit } = subsidy.conditions;

    // 所得制限なし
    if (incomeLimit.type === 'none') {
      return true;
    }

    // 単一閾値の所得制限
    if (incomeLimit.type === 'single' && incomeLimit.threshold) {
      return householdIncome < incomeLimit.threshold;
    }

    // 段階的所得制限
    if (incomeLimit.type === 'tiered') {
      return checkTieredIncomeLimit(householdIncome, incomeLimit.tiers);
    }

    return false;
  });
}

/**
 * 段階的所得制限のチェック
 *
 * @param householdIncome - 世帯年収（円）
 * @param tiers - 所得階層の配列
 * @returns いずれかの階層に該当すればtrue
 */
function checkTieredIncomeLimit(householdIncome: number, tiers?: IncomeTier[]): boolean {
  if (!tiers || tiers.length === 0) return false;

  // いずれかの階層に該当すればtrue
  return tiers.some((tier) => householdIncome < tier.threshold);
}

/**
 * 子供の条件による補助金のフィルタリング
 *
 * @param subsidies - 補助金リスト
 * @param children - 子供の情報の配列
 * @returns 条件を満たす補助金のリスト
 */
function filterByChildConditions(
  subsidies: (Subsidy | VariableAmountSubsidy)[],
  children: ChildInfo[]
): (Subsidy | VariableAmountSubsidy)[] {
  return subsidies.filter((subsidy) => {
    const { childCondition } = subsidy.conditions;

    // 条件に合う子供が少なくとも1人いればOK
    return children.some((child) => matchesChildCondition(child, childCondition));
  });
}

/**
 * 子供が条件に合致するかチェック
 *
 * @param child - 子供の情報
 * @param condition - 子供の条件
 * @returns 合致すればtrue
 */
function matchesChildCondition(child: ChildInfo, condition: ChildCondition): boolean {
  // 年齢チェック（最小年齢）
  if (condition.minAge !== undefined && child.age < condition.minAge) {
    return false;
  }

  // 年齢チェック（最大年齢）
  if (condition.maxAge !== undefined && child.age > condition.maxAge) {
    return false;
  }

  // 出生順チェック
  if (condition.birthOrder && condition.birthOrder !== 'any') {
    if (condition.birthOrder !== child.birthOrder) {
      return false;
    }
  }

  return true;
}

/**
 * 補助金の金額を計算
 *
 * @param subsidy - 補助金制度
 * @param input - 計算入力パラメータ
 * @returns 適用された施策の情報
 */
function calculateSubsidyAmount(
  subsidy: Subsidy | VariableAmountSubsidy,
  input: CalculationInput
): AppliedPolicy {
  let totalAmount = 0;
  let yearsApplied = 0;

  // 変動金額の場合（児童手当など）
  if (isVariableAmountSubsidy(subsidy)) {
    // 児童手当の特別処理（第3子以降の加算）
    if (subsidy.type === 'childcare_allowance') {
      totalAmount = calculateChildcareAllowance(subsidy, input.children);
    } else {
      totalAmount = calculateVariableAmount(subsidy, input.children);
    }

    // 年数は最大年齢範囲で計算（概算）
    const maxAgeRange = subsidy.ageBasedAmounts.reduce(
      (max, range) => Math.max(max, range.maxAge - range.minAge + 1),
      0
    );
    yearsApplied = maxAgeRange;
  } else {
    // 固定金額の場合
    const result = calculateFixedAmount(subsidy, input);
    totalAmount = result.amount;
    yearsApplied = result.years;
  }

  return {
    policy: subsidy,
    calculatedAmount: totalAmount,
    yearsApplied,
  };
}

/**
 * 年齢別変動金額の計算
 *
 * 子供が0歳から最大年齢まで受け取れる累計金額を計算します。
 *
 * @param subsidy - 変動金額型の補助金
 * @param children - 子供の情報の配列
 * @returns 合計金額（円）
 */
function calculateVariableAmount(subsidy: VariableAmountSubsidy, children: ChildInfo[]): number {
  let total = 0;

  // 各子供について累計金額を計算
  for (let i = 0; i < children.length; i++) {
    // 各年齢範囲の累計金額を計算
    for (const ageRange of subsidy.ageBasedAmounts) {
      // 対象年齢範囲の年数を計算
      const years = ageRange.maxAge - ageRange.minAge + 1;
      const annualAmount = calculateAmountByFrequency(ageRange.amount, ageRange.frequency);
      total += annualAmount * years;
    }
  }

  return total;
}

/**
 * 児童手当の計算（第3子以降の加算対応）
 *
 * 子供が0歳から18歳まで受け取れる累計金額を計算します。
 * 第3子以降は全年齢で月3万円に増額されます。
 *
 * @param subsidy - 児童手当の補助金制度
 * @param children - 子供の情報の配列
 * @returns 合計金額（円）
 */
function calculateChildcareAllowance(
  subsidy: VariableAmountSubsidy,
  children: ChildInfo[]
): number {
  let total = 0;

  for (const child of children) {
    // 第3子以降は月3万円（0-18歳すべて）
    if (child.birthOrder === 'third_or_more') {
      const years = 19; // 0歳から18歳まで
      const annualAmount = 30000 * 12; // 月3万円 × 12ヶ月
      total += annualAmount * years;
    } else {
      // 第1子・第2子は年齢別金額
      for (const ageRange of subsidy.ageBasedAmounts) {
        const years = ageRange.maxAge - ageRange.minAge + 1;
        const annualAmount = calculateAmountByFrequency(ageRange.amount, ageRange.frequency);
        total += annualAmount * years;
      }
    }
  }

  return total;
}

/**
 * 固定金額の計算
 *
 * @param subsidy - 固定金額型の補助金
 * @param input - 計算入力パラメータ
 * @returns 金額と適用年数
 */
function calculateFixedAmount(
  subsidy: Subsidy,
  input: CalculationInput
): { amount: number; years: number } {
  if (subsidy.amount === 'variable') {
    throw new Error('固定金額の計算に変動金額型が渡されました');
  }

  // 医療費助成の特別処理（動的計算）
  if (subsidy.type === 'medical_expense') {
    return calculateMedicalExpenseSubsidy(subsidy, input);
  }

  // 保育料無償化の特別処理（多子世帯対応）
  if (subsidy.type === 'childcare_fee') {
    return calculateChildcareFeeSubsidy(subsidy, input);
  }

  // 高校授業料の特別処理（段階的所得制限対応）
  if (subsidy.type === 'high_school_tuition') {
    return calculateHighSchoolTuition(subsidy, input);
  }

  // 対象年齢に該当する子供の数をカウント
  const eligibleChildren = input.children.filter((child) =>
    matchesChildCondition(child, subsidy.conditions.childCondition)
  );

  const count = eligibleChildren.length;
  const { minAge = 0, maxAge = 18 } = subsidy.conditions.childCondition;
  const years = maxAge - minAge + 1;

  // 金額 = 年間金額 × 年数 × 対象子供数
  const annualAmount = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);
  const amount = annualAmount * years * count;

  return { amount, years };
}

/**
 * 医療費助成の計算（動的計算）
 *
 * 年齢別の医療費統計データを基に、助成額を動的に計算します。
 *
 * @param subsidy - 医療費助成の補助金制度
 * @param input - 計算入力パラメータ
 * @returns 金額と適用年数
 */
function calculateMedicalExpenseSubsidy(
  subsidy: Subsidy,
  input: CalculationInput
): { amount: number; years: number } {
  // 対象年齢に該当する子供を抽出
  const eligibleChildren = input.children.filter((child) =>
    matchesChildCondition(child, subsidy.conditions.childCondition)
  );

  if (eligibleChildren.length === 0) {
    return { amount: 0, years: 0 };
  }

  let totalAmount = 0;

  // 各子供について医療費助成額を計算
  for (const child of eligibleChildren) {
    // 子供の年齢から18歳までの累計助成額を計算
    const subsidyAmount = calculateMedicalSubsidy(child.age, subsidy.prefecture);
    totalAmount += subsidyAmount;
  }

  const { minAge = 0, maxAge = 18 } = subsidy.conditions.childCondition;
  const years = maxAge - minAge + 1;

  return { amount: totalAmount, years };
}

/**
 * 保育料無償化の計算（多子世帯対応）
 *
 * @param subsidy - 保育料無償化の補助金制度
 * @param input - 計算入力パラメータ
 * @returns 金額と適用年数
 */
function calculateChildcareFeeSubsidy(
  subsidy: Subsidy,
  input: CalculationInput
): { amount: number; years: number } {
  if (subsidy.amount === 'variable') {
    throw new Error('固定金額の計算に変動金額型が渡されました');
  }

  // 対象年齢（0-5歳）の子供を抽出
  const eligibleChildren = input.children.filter((child) =>
    matchesChildCondition(child, subsidy.conditions.childCondition)
  );

  const { minAge = 0, maxAge = 5 } = subsidy.conditions.childCondition;
  const years = maxAge - minAge + 1;
  const annualAmount = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);

  let total = 0;

  // 東京都: 2025年9月から第1子も無償化
  if (subsidy.prefecture === '東京都') {
    // 全員無料（全額助成）
    total = annualAmount * years * eligibleChildren.length;
  } else {
    // 埼玉・千葉・神奈川: 第2子半額、第3子以降無料
    for (const child of eligibleChildren) {
      if (child.birthOrder === 'first') {
        total += annualAmount * years;
      } else if (child.birthOrder === 'second') {
        total += annualAmount * years * 0.5;
      }
      // 第3子以降は無料なので加算しない
    }
  }

  return { amount: total, years };
}

/**
 * 高校授業料の計算（段階的所得制限対応）
 *
 * @param subsidy - 高校授業料の補助金制度
 * @param input - 計算入力パラメータ
 * @returns 金額と適用年数
 */
function calculateHighSchoolTuition(
  subsidy: Subsidy,
  input: CalculationInput
): { amount: number; years: number } {
  if (subsidy.amount === 'variable') {
    throw new Error('固定金額の計算に変動金額型が渡されました');
  }

  const { incomeLimit, childCondition } = subsidy.conditions;

  // 対象年齢（15-18歳）の子供を抽出
  const eligibleChildren = input.children.filter((child) =>
    matchesChildCondition(child, childCondition)
  );

  if (eligibleChildren.length === 0) {
    return { amount: 0, years: 0 };
  }

  let amountPerYear = 0;

  // 段階的所得制限の場合
  if (incomeLimit.type === 'tiered' && incomeLimit.tiers) {
    // 所得に応じた金額を取得（最初に該当する階層）
    const tier = incomeLimit.tiers.find((t) => input.householdIncome < t.threshold);

    if (tier) {
      amountPerYear = tier.amount;
    }
  } else {
    // 通常の固定金額
    amountPerYear = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);
  }

  const { minAge = 15, maxAge = 18 } = childCondition;
  const years = maxAge - minAge + 1;

  // 金額 = 年間金額 × 年数 × 対象子供数
  const totalAmount = amountPerYear * years * eligibleChildren.length;

  return { amount: totalAmount, years };
}
