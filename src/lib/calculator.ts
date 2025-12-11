/**
 * 補助金計算エンジン
 *
 * 世帯年収と子供の情報から、各都県の補助金総額を計算します。
 */

import type {
  AgeRangeInfo,
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

// ==========================================
// 定数
// ==========================================

/**
 * 児童手当の第3子以降の月額（円）
 */
const CHILDCARE_ALLOWANCE_THIRD_CHILD_MONTHLY = 30000;

// ==========================================
// 年齢ベース計算のヘルパー関数
// ==========================================

/**
 * 現在年齢から制度上限年齢までの該当年数を計算
 *
 * @param currentAge - 子供の現在年齢（歳）
 * @param minAge - 制度の最小年齢（歳）
 * @param maxAge - 制度の最大年齢（歳）
 * @returns 該当年数（年）
 *
 * @example
 * // 5歳の子供、制度は6-14歳が対象
 * calculateYearsFromCurrentAge(5, 6, 14);
 * // => 9年（6歳から14歳まで）
 *
 * @example
 * // 15歳の子供、制度は6-14歳が対象
 * calculateYearsFromCurrentAge(15, 6, 14);
 * // => 0年（既に対象年齢を超えている）
 */
export function calculateYearsFromCurrentAge(
  currentAge: number,
  minAge: number,
  maxAge: number
): number {
  // 現在年齢が制度上限年齢を超えている場合は0年
  if (currentAge > maxAge) {
    return 0;
  }

  // 現在年齢が制度開始年齢未満の場合は、制度開始年齢から計算
  const startAge = Math.max(currentAge, minAge);

  // 該当年数 = 制度上限年齢 - 開始年齢 + 1
  return maxAge - startAge + 1;
}

/**
 * 年齢範囲情報を生成（表示用）
 *
 * @param currentAge - 子供の現在年齢（歳）
 * @param minAge - 制度の最小年齢（歳）
 * @param maxAge - 制度の最大年齢（歳）
 * @returns 年齢範囲情報
 */
export function calculateAgeRangeInfo(
  currentAge: number,
  minAge: number,
  maxAge: number
): AgeRangeInfo {
  const fromAge = Math.max(currentAge, minAge);
  const toAge = maxAge;
  const years = calculateYearsFromCurrentAge(currentAge, minAge, maxAge);

  return { fromAge, toAge, years };
}

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

  // 残り受給予定額（totalAmount）でソート（降順）してランキングを付与
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

  // 5. 満額の合計を計算（0歳から18歳まで）
  const totalMaxAmount = appliedPolicies.reduce((sum, policy) => {
    return sum + (policy.maxAmount ?? policy.calculatedAmount);
  }, 0);

  return {
    prefecture,
    appliedPolicies,
    totalAmount, // 残り受給予定額
    totalMaxAmount, // 満額（0歳から18歳まで）
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
 * 子供が条件に合致するかチェック（0-18歳の期間で該当するか）
 *
 * 施策のフィルタリング時は、子供が0-18歳の期間中に該当する可能性があれば true を返します。
 * これにより、現在の年齢に関係なく、将来または過去に適用される施策も含まれます。
 *
 * @param child - 子供の情報
 * @param condition - 子供の条件
 * @returns 合致すればtrue（0-18歳の期間中に該当する場合）
 */
function matchesChildCondition(child: ChildInfo, condition: ChildCondition): boolean {
  // 出生順チェック（これは変わらない）
  if (condition.birthOrder && condition.birthOrder !== 'any') {
    if (condition.birthOrder !== child.birthOrder) {
      return false;
    }
  }

  // 年齢チェック：0-18歳の期間中に施策の対象年齢と重なるか
  // 施策の対象年齢が0-18歳の範囲と重なれば、いずれかの時点で適用される
  const childMinAge = 0;
  const childMaxAge = 18;
  const policyMinAge = condition.minAge ?? 0;
  const policyMaxAge = condition.maxAge ?? 18;

  // 期間の重なりをチェック
  // 重ならない条件: 子供の最大年齢 < 施策の最小年齢 OR 子供の最小年齢 > 施策の最大年齢
  if (childMaxAge < policyMinAge || childMinAge > policyMaxAge) {
    return false;
  }

  return true;
}

/**
 * 満額を計算（0歳から制度上限年齢まで）
 *
 * @param subsidy - 補助金制度
 * @param children - 子供の情報の配列
 * @returns 満額（円）
 */
function calculateMaxAmount(
  subsidy: Subsidy | VariableAmountSubsidy,
  children: ChildInfo[]
): number {
  // 変動金額の場合（児童手当など）
  if (isVariableAmountSubsidy(subsidy)) {
    let total = 0;
    for (const child of children) {
      if (subsidy.type === 'childcare_allowance' && child.birthOrder === 'third_or_more') {
        // 第3子以降: 0-18歳まで月3万円
        const annualAmount = CHILDCARE_ALLOWANCE_THIRD_CHILD_MONTHLY * 12;
        total += annualAmount * 19; // 0-18歳 = 19年
      } else {
        // 年齢別金額を0歳から満額計算
        for (const ageRange of subsidy.ageBasedAmounts) {
          const years = ageRange.maxAge - ageRange.minAge + 1;
          const annualAmount = calculateAmountByFrequency(ageRange.amount, ageRange.frequency);
          total += annualAmount * years;
        }
      }
    }
    return total;
  } else {
    // 固定金額の場合
    if (subsidy.amount === 'variable') {
      return 0;
    }

    // 医療費助成の特別処理
    if (subsidy.type === 'medical_expense') {
      return calculateMaxMedicalExpenseSubsidy(subsidy, children);
    }

    // 保育料無償化の特別処理
    if (subsidy.type === 'childcare_fee') {
      return calculateMaxChildcareFeeSubsidy(subsidy, children);
    }

    // 高校授業料の特別処理
    if (subsidy.type === 'high_school_tuition') {
      return calculateMaxHighSchoolTuition(subsidy, children);
    }

    const { minAge = 0, maxAge = 18 } = subsidy.conditions.childCondition;

    // 満額計算では birthOrder のみをチェック（年齢は無視）
    const eligibleChildren = children.filter((child) => {
      const { birthOrder } = subsidy.conditions.childCondition;
      if (birthOrder && birthOrder !== 'any') {
        return birthOrder === child.birthOrder;
      }
      return true;
    });

    if (eligibleChildren.length === 0) {
      return 0;
    }

    const annualAmount = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);

    // 一時金の場合
    if (subsidy.frequency === 'once') {
      return annualAmount * eligibleChildren.length;
    }

    // 継続給付の場合（0歳から上限年齢まで）
    const years = maxAge - minAge + 1;
    return annualAmount * years * eligibleChildren.length;
  }
}

/**
 * 医療費助成の満額を計算
 */
function calculateMaxMedicalExpenseSubsidy(subsidy: Subsidy, children: ChildInfo[]): number {
  // birthOrderのみをチェック
  const eligibleChildren = children.filter((child) => {
    const { birthOrder } = subsidy.conditions.childCondition;
    if (birthOrder && birthOrder !== 'any') {
      return birthOrder === child.birthOrder;
    }
    return true;
  });

  if (eligibleChildren.length === 0) {
    return 0;
  }

  let total = 0;
  // 各子供について0歳から18歳までの医療費助成額を計算
  for (let i = 0; i < eligibleChildren.length; i++) {
    const subsidyAmount = calculateMedicalSubsidy(0, subsidy.prefecture);
    total += subsidyAmount;
  }

  return total;
}

/**
 * 保育料無償化の満額を計算
 */
function calculateMaxChildcareFeeSubsidy(subsidy: Subsidy, children: ChildInfo[]): number {
  if (subsidy.amount === 'variable') {
    return 0;
  }

  // birthOrderのみをチェック
  const eligibleChildren = children.filter((child) => {
    const { birthOrder } = subsidy.conditions.childCondition;
    if (birthOrder && birthOrder !== 'any') {
      return birthOrder === child.birthOrder;
    }
    return true;
  });

  if (eligibleChildren.length === 0) {
    return 0;
  }

  const { minAge = 0, maxAge = 5 } = subsidy.conditions.childCondition;
  const annualAmount = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);
  const years = maxAge - minAge + 1;

  return annualAmount * years * eligibleChildren.length;
}

/**
 * 高校授業料の満額を計算
 */
function calculateMaxHighSchoolTuition(subsidy: Subsidy, children: ChildInfo[]): number {
  if (subsidy.amount === 'variable') {
    return 0;
  }

  // birthOrderのみをチェック
  const eligibleChildren = children.filter((child) => {
    const { birthOrder } = subsidy.conditions.childCondition;
    if (birthOrder && birthOrder !== 'any') {
      return birthOrder === child.birthOrder;
    }
    return true;
  });

  if (eligibleChildren.length === 0) {
    return 0;
  }

  const { minAge = 15, maxAge = 18 } = subsidy.conditions.childCondition;
  const years = maxAge - minAge + 1;

  // 段階的所得制限の場合は最大金額を使用
  const { incomeLimit } = subsidy.conditions;
  let amountPerYear = 0;

  if (incomeLimit.type === 'tiered' && incomeLimit.tiers && incomeLimit.tiers.length > 0) {
    // 最大金額（最初の階層）を使用
    amountPerYear = incomeLimit.tiers[0].amount;
  } else {
    amountPerYear = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);
  }

  return amountPerYear * years * eligibleChildren.length;
}

/**
 * 受給済み額を計算（0歳から現在年齢-1歳まで）
 *
 * @param subsidy - 補助金制度
 * @param children - 子供の情報の配列
 * @returns 受給済み額（円）
 */
function calculateReceivedAmount(
  subsidy: Subsidy | VariableAmountSubsidy,
  children: ChildInfo[]
): number {
  // 変動金額の場合（児童手当など）
  if (isVariableAmountSubsidy(subsidy)) {
    let total = 0;
    for (const child of children) {
      if (child.age === 0) {
        continue; // 0歳の場合は受給済みなし
      }

      if (subsidy.type === 'childcare_allowance' && child.birthOrder === 'third_or_more') {
        // 第3子以降: 0歳から現在年齢-1歳まで月3万円
        const annualAmount = CHILDCARE_ALLOWANCE_THIRD_CHILD_MONTHLY * 12;
        total += annualAmount * child.age; // 0歳から現在年齢-1歳まで
      } else {
        // 年齢別金額を0歳から現在年齢-1歳まで計算
        for (const ageRange of subsidy.ageBasedAmounts) {
          if (child.age <= ageRange.minAge) {
            continue; // まだ対象年齢に達していない
          }

          // 受給済み期間の計算
          const receivedStartAge = ageRange.minAge;
          const receivedEndAge = Math.min(child.age - 1, ageRange.maxAge);

          if (receivedEndAge >= receivedStartAge) {
            const years = receivedEndAge - receivedStartAge + 1;
            const annualAmount = calculateAmountByFrequency(ageRange.amount, ageRange.frequency);
            total += annualAmount * years;
          }
        }
      }
    }
    return total;
  } else {
    // 固定金額の場合
    if (subsidy.amount === 'variable') {
      return 0;
    }

    // 医療費助成の特別処理
    if (subsidy.type === 'medical_expense') {
      return calculateReceivedMedicalExpenseSubsidy(subsidy, children);
    }

    // 保育料無償化の特別処理
    if (subsidy.type === 'childcare_fee') {
      return calculateReceivedChildcareFeeSubsidy(subsidy, children);
    }

    // 高校授業料の特別処理
    if (subsidy.type === 'high_school_tuition') {
      return calculateReceivedHighSchoolTuition(subsidy, children);
    }

    const { minAge = 0, maxAge = 18 } = subsidy.conditions.childCondition;

    // birthOrder のみでフィルタ（年齢は無視）
    const eligibleChildren = children.filter((child) => {
      const { birthOrder } = subsidy.conditions.childCondition;
      if (birthOrder && birthOrder !== 'any') {
        return birthOrder === child.birthOrder;
      }
      return true;
    });

    if (eligibleChildren.length === 0) {
      return 0;
    }

    const annualAmount = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);

    // 一時金の場合
    if (subsidy.frequency === 'once') {
      // 既に対象年齢を過ぎている子供の人数を数える
      const receivedCount = eligibleChildren.filter((child) => child.age > maxAge).length;
      return annualAmount * receivedCount;
    }

    // 継続給付の場合
    let total = 0;
    for (const child of eligibleChildren) {
      if (child.age === 0) {
        continue; // 0歳の場合は受給済みなし
      }

      if (child.age > maxAge) {
        // 既に対象年齢を超えている場合は全期間受給済み
        const years = maxAge - minAge + 1;
        total += annualAmount * years;
      } else if (child.age > minAge) {
        // 一部受給済み
        const years = child.age - minAge;
        total += annualAmount * years;
      }
    }
    return total;
  }
}

/**
 * 医療費助成の受給済み額を計算
 */
function calculateReceivedMedicalExpenseSubsidy(subsidy: Subsidy, children: ChildInfo[]): number {
  // birthOrderのみをチェック
  const eligibleChildren = children.filter((child) => {
    const { birthOrder } = subsidy.conditions.childCondition;
    if (birthOrder && birthOrder !== 'any') {
      return birthOrder === child.birthOrder;
    }
    return true;
  });

  if (eligibleChildren.length === 0) {
    return 0;
  }

  let total = 0;
  for (const child of eligibleChildren) {
    if (child.age === 0) {
      continue; // 0歳の場合は受給済みなし
    }

    // 0歳から現在年齢-1歳までの医療費助成額を計算
    const maxSubsidy = calculateMedicalSubsidy(0, subsidy.prefecture);
    const remainingSubsidy = calculateMedicalSubsidy(child.age, subsidy.prefecture);
    const received = maxSubsidy - remainingSubsidy;
    total += received;
  }

  return total;
}

/**
 * 保育料無償化の受給済み額を計算
 */
function calculateReceivedChildcareFeeSubsidy(subsidy: Subsidy, children: ChildInfo[]): number {
  if (subsidy.amount === 'variable') {
    return 0;
  }

  // birthOrderのみをチェック
  const eligibleChildren = children.filter((child) => {
    const { birthOrder } = subsidy.conditions.childCondition;
    if (birthOrder && birthOrder !== 'any') {
      return birthOrder === child.birthOrder;
    }
    return true;
  });

  if (eligibleChildren.length === 0) {
    return 0;
  }

  const { minAge = 0, maxAge = 5 } = subsidy.conditions.childCondition;
  const annualAmount = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);

  let total = 0;
  for (const child of eligibleChildren) {
    if (child.age === 0) {
      continue; // 0歳の場合は受給済みなし
    }

    if (child.age > maxAge) {
      // 既に対象年齢を超えている場合は全期間受給済み
      const years = maxAge - minAge + 1;
      total += annualAmount * years;
    } else if (child.age > minAge) {
      // 一部受給済み
      const years = child.age - minAge;
      total += annualAmount * years;
    }
  }

  return total;
}

/**
 * 高校授業料の受給済み額を計算
 */
function calculateReceivedHighSchoolTuition(subsidy: Subsidy, children: ChildInfo[]): number {
  if (subsidy.amount === 'variable') {
    return 0;
  }

  // birthOrderのみをチェック
  const eligibleChildren = children.filter((child) => {
    const { birthOrder } = subsidy.conditions.childCondition;
    if (birthOrder && birthOrder !== 'any') {
      return birthOrder === child.birthOrder;
    }
    return true;
  });

  if (eligibleChildren.length === 0) {
    return 0;
  }

  const { minAge = 15, maxAge = 18 } = subsidy.conditions.childCondition;

  // 段階的所得制限の場合は最大金額を使用
  const { incomeLimit } = subsidy.conditions;
  let amountPerYear = 0;

  if (incomeLimit.type === 'tiered' && incomeLimit.tiers && incomeLimit.tiers.length > 0) {
    amountPerYear = incomeLimit.tiers[0].amount;
  } else {
    amountPerYear = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);
  }

  let total = 0;
  for (const child of eligibleChildren) {
    if (child.age === 0 || child.age <= minAge) {
      continue; // 対象年齢に達していない
    }

    if (child.age > maxAge) {
      // 既に対象年齢を超えている場合は全期間受給済み
      const years = maxAge - minAge + 1;
      total += amountPerYear * years;
    } else {
      // 一部受給済み
      const years = child.age - minAge;
      total += amountPerYear * years;
    }
  }

  return total;
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
  let ageRange: AgeRangeInfo | undefined;

  // 変動金額の場合（児童手当など）
  if (isVariableAmountSubsidy(subsidy)) {
    // 児童手当の特別処理（第3子以降の加算）
    if (subsidy.type === 'childcare_allowance') {
      totalAmount = calculateChildcareAllowance(subsidy, input.children);
    } else {
      totalAmount = calculateVariableAmount(subsidy, input.children);
    }

    // 年齢範囲情報を生成（変動金額の場合は最大範囲を使用）
    if (input.children.length > 0 && subsidy.ageBasedAmounts.length > 0) {
      const child = input.children[0];
      const minAge = Math.min(...subsidy.ageBasedAmounts.map((r) => r.minAge));
      const maxAge = Math.max(...subsidy.ageBasedAmounts.map((r) => r.maxAge));
      ageRange = calculateAgeRangeInfo(child.age, minAge, maxAge);
      yearsApplied = ageRange.years;
    }
  } else {
    // 固定金額の場合
    const result = calculateFixedAmount(subsidy, input);
    totalAmount = result.amount;
    yearsApplied = result.years;
    ageRange = result.ageRange;
  }

  // 満額と受給済み額を計算
  const maxAmount = calculateMaxAmount(subsidy, input.children);
  const receivedAmount = calculateReceivedAmount(subsidy, input.children);

  return {
    policy: subsidy,
    calculatedAmount: totalAmount,
    yearsApplied,
    ageRange,
    maxAmount,
    receivedAmount,
  };
}

/**
 * 年齢別変動金額の計算（年齢ベース）
 *
 * 子供の現在年齢から制度上限年齢まで受け取れる累計金額を計算します。
 *
 * @param subsidy - 変動金額型の補助金
 * @param children - 子供の情報の配列
 * @returns 合計金額（円）
 */
function calculateVariableAmount(subsidy: VariableAmountSubsidy, children: ChildInfo[]): number {
  let total = 0;

  // 各子供について累計金額を計算
  for (const child of children) {
    // 各年齢範囲の累計金額を計算
    for (const ageRange of subsidy.ageBasedAmounts) {
      // 現在年齢から該当年数を計算
      const years = calculateYearsFromCurrentAge(child.age, ageRange.minAge, ageRange.maxAge);

      if (years > 0) {
        const annualAmount = calculateAmountByFrequency(ageRange.amount, ageRange.frequency);
        total += annualAmount * years;
      }
    }
  }

  return total;
}

/**
 * 児童手当の計算（年齢ベース + 第3子対応）
 *
 * 子供の現在年齢から18歳まで受け取れる累計金額を計算します。
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
      // 現在年齢から18歳までの年数で計算
      const years = calculateYearsFromCurrentAge(child.age, 0, 18);
      const annualAmount = CHILDCARE_ALLOWANCE_THIRD_CHILD_MONTHLY * 12; // 月3万円 × 12ヶ月
      total += annualAmount * years;
    } else {
      // 第1子・第2子は年齢別金額
      for (const ageRange of subsidy.ageBasedAmounts) {
        // 現在年齢から該当年数を計算
        const years = calculateYearsFromCurrentAge(child.age, ageRange.minAge, ageRange.maxAge);

        if (years > 0) {
          const annualAmount = calculateAmountByFrequency(ageRange.amount, ageRange.frequency);
          total += annualAmount * years;
        }
      }
    }
  }

  return total;
}

/**
 * 固定金額の計算（年齢ベース）
 *
 * @param subsidy - 固定金額型の補助金
 * @param input - 計算入力パラメータ
 * @returns 金額と適用年数、年齢範囲情報
 */
function calculateFixedAmount(
  subsidy: Subsidy,
  input: CalculationInput
): { amount: number; years: number; ageRange?: AgeRangeInfo } {
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

  // 対象年齢に該当する子供を抽出
  const eligibleChildren = input.children.filter((child) =>
    matchesChildCondition(child, subsidy.conditions.childCondition)
  );

  if (eligibleChildren.length === 0) {
    return { amount: 0, years: 0 };
  }

  const { minAge = 0, maxAge = 18 } = subsidy.conditions.childCondition;
  const annualAmount = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);

  let totalAmount = 0;
  let maxYears = 0;

  // 各子供について計算
  for (const child of eligibleChildren) {
    // 現在年齢から該当年数を計算
    const years = calculateYearsFromCurrentAge(child.age, minAge, maxAge);

    if (years > 0) {
      // 一時金の場合は1回のみ
      if (subsidy.frequency === 'once') {
        // 将来適用される場合も含める（まだ対象年齢に達していない場合も含む）
        totalAmount += annualAmount;
        maxYears = Math.max(maxYears, 1);
      } else {
        totalAmount += annualAmount * years;
        maxYears = Math.max(maxYears, years);
      }
    }
  }

  // 年齢範囲情報を生成（表示用）
  const ageRange =
    eligibleChildren.length > 0
      ? calculateAgeRangeInfo(eligibleChildren[0].age, minAge, maxAge)
      : undefined;

  return { amount: totalAmount, years: maxYears, ageRange };
}

/**
 * 医療費助成の計算（動的計算、年齢ベース）
 *
 * 年齢別の医療費統計データを基に、助成額を動的に計算します。
 *
 * @param subsidy - 医療費助成の補助金制度
 * @param input - 計算入力パラメータ
 * @returns 金額と適用年数、年齢範囲情報
 */
function calculateMedicalExpenseSubsidy(
  subsidy: Subsidy,
  input: CalculationInput
): { amount: number; years: number; ageRange?: AgeRangeInfo } {
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
    // 子供の現在年齢から18歳までの累計助成額を計算（既に年齢ベース対応済み）
    const subsidyAmount = calculateMedicalSubsidy(child.age, subsidy.prefecture);
    totalAmount += subsidyAmount;
  }

  const { minAge = 0, maxAge = 18 } = subsidy.conditions.childCondition;

  // 年齢範囲情報を生成（表示用）
  const ageRange =
    eligibleChildren.length > 0
      ? calculateAgeRangeInfo(eligibleChildren[0].age, minAge, maxAge)
      : undefined;

  return { amount: totalAmount, years: ageRange?.years ?? 0, ageRange };
}

/**
 * 保育料無償化の計算（年齢ベース + 多子世帯対応）
 *
 * @param subsidy - 保育料無償化の補助金制度
 * @param input - 計算入力パラメータ
 * @returns 金額と適用年数、年齢範囲情報
 */
function calculateChildcareFeeSubsidy(
  subsidy: Subsidy,
  input: CalculationInput
): { amount: number; years: number; ageRange?: AgeRangeInfo } {
  if (subsidy.amount === 'variable') {
    throw new Error('固定金額の計算に変動金額型が渡されました');
  }

  // 対象年齢（0-5歳）の子供を抽出
  const eligibleChildren = input.children.filter((child) =>
    matchesChildCondition(child, subsidy.conditions.childCondition)
  );

  if (eligibleChildren.length === 0) {
    return { amount: 0, years: 0 };
  }

  const { minAge = 0, maxAge = 5 } = subsidy.conditions.childCondition;
  const annualAmount = calculateAmountByFrequency(subsidy.amount, subsidy.frequency);

  let total = 0;
  let maxYears = 0;

  // 各子供について年齢ベースで計算
  // データ側で birthOrder によって異なる金額が設定されているため、
  // コード側では birthOrder を考慮せずに annualAmount をそのまま使用
  for (const child of eligibleChildren) {
    const years = calculateYearsFromCurrentAge(child.age, minAge, maxAge);
    if (years > 0) {
      total += annualAmount * years;
      maxYears = Math.max(maxYears, years);
    }
  }

  // 年齢範囲情報を生成（表示用）
  const ageRange =
    eligibleChildren.length > 0
      ? calculateAgeRangeInfo(eligibleChildren[0].age, minAge, maxAge)
      : undefined;

  return { amount: total, years: maxYears, ageRange };
}

/**
 * 高校授業料の計算（年齢ベース + 段階的所得制限対応）
 *
 * @param subsidy - 高校授業料の補助金制度
 * @param input - 計算入力パラメータ
 * @returns 金額と適用年数、年齢範囲情報
 */
function calculateHighSchoolTuition(
  subsidy: Subsidy,
  input: CalculationInput
): { amount: number; years: number; ageRange?: AgeRangeInfo } {
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
  let totalAmount = 0;
  let maxYears = 0;

  // 各子供について年齢ベースで計算
  for (const child of eligibleChildren) {
    const years = calculateYearsFromCurrentAge(child.age, minAge, maxAge);
    if (years > 0) {
      totalAmount += amountPerYear * years;
      maxYears = Math.max(maxYears, years);
    }
  }

  // 年齢範囲情報を生成（表示用）
  const ageRange =
    eligibleChildren.length > 0
      ? calculateAgeRangeInfo(eligibleChildren[0].age, minAge, maxAge)
      : undefined;

  return { amount: totalAmount, years: maxYears, ageRange };
}
