/**
 * 医療費助成計算ロジック
 *
 * 年齢別の医療費統計データを基に、各都県の医療費助成制度による累計助成額を推定計算します。
 */

import medicalCostData from '@/data/medical-costs.json';
import type { AgeMedicalCost, MedicalCostData, Prefecture } from '@/types/subsidy';

/**
 * 医療費助成の累計額を計算
 *
 * 子供が0歳から18歳までに受けられる医療費助成の累計額を計算します。
 * 計算式: Σ(年齢別医療費 × 自己負担割合 × 助成率)
 *
 * @param currentAge - 子供の現在年齢（0-18歳）※現在は0歳固定で使用
 * @param prefecture - 都道府県名
 * @returns 助成累計額（円）
 *
 * @example
 * // 0歳の子供が東京都で18歳まで受けられる医療費助成
 * const totalSubsidy = calculateMedicalSubsidy(0, '東京都');
 * // => 約232万円
 */
export function calculateMedicalSubsidy(currentAge: number, prefecture: Prefecture): number {
  // 年齢が範囲外の場合は0円
  if (currentAge < 0 || currentAge > 18) {
    return 0;
  }

  const data = medicalCostData as MedicalCostData;
  const maxAge = getAssistanceAge(prefecture);

  // 既に助成対象年齢を超えている場合は0円
  if (currentAge > maxAge) {
    return 0;
  }

  let totalSubsidy = 0;

  // 現在年齢から助成対象年齢上限まで累計
  for (let age = currentAge; age <= maxAge; age++) {
    const medicalCost = getMedicalCostByAge(data.ageMedicalCosts, age);
    if (medicalCost) {
      // 自己負担割合を取得（0-5歳: 2割、6歳以上: 3割）
      const selfPaymentRate = getSelfPaymentRate(age);

      // 自己負担額 = 年間医療費 × 自己負担割合
      const selfPayment = medicalCost.annualCost * selfPaymentRate;

      // 都県別助成率を取得
      const assistanceRate = getAssistanceRate(prefecture);

      // 助成額 = 自己負担額 × 助成率
      totalSubsidy += selfPayment * assistanceRate;
    }
  }

  return Math.round(totalSubsidy);
}

/**
 * 都県別の助成対象年齢上限を取得
 *
 * @param prefecture - 都道府県名
 * @returns 助成対象年齢の上限（歳）
 */
function getAssistanceAge(prefecture: Prefecture): number {
  // すべての都県で18歳まで助成（年度末まで）
  switch (prefecture) {
    case '東京都':
    case '埼玉県':
    case '千葉県':
    case '神奈川県':
      return 18;
    default:
      return 18;
  }
}

/**
 * 都県別の助成率を取得
 *
 * @param prefecture - 都道府県名
 * @returns 助成率（0.0 - 1.0）
 */
function getAssistanceRate(prefecture: Prefecture): number {
  switch (prefecture) {
    case '東京都':
    case '埼玉県':
    case '千葉県':
      // 100%助成（自己負担分を全額助成）
      return 1.0;
    case '神奈川県':
      // 市町村により異なるため、保守的に0%として計算
      // ※横浜市など一部自治体は18歳まで助成あり
      return 0.0;
    default:
      return 0.0;
  }
}

/**
 * 年齢に応じた自己負担割合を取得
 *
 * @param age - 年齢（歳）
 * @returns 自己負担割合（0.0 - 1.0）
 */
function getSelfPaymentRate(age: number): number {
  if (age <= 5) {
    // 0-5歳（小学校入学前）: 2割負担
    return 0.2;
  } else {
    // 6歳以上: 3割負担
    return 0.3;
  }
}

/**
 * 年齢から医療費データを取得
 *
 * @param data - 年齢別医療費データの配列
 * @param age - 年齢（歳）
 * @returns 該当する医療費データ、なければundefined
 */
function getMedicalCostByAge(data: AgeMedicalCost[], age: number): AgeMedicalCost | undefined {
  return data.find((item) => item.age === age);
}

/**
 * 医療費助成の説明文を生成
 *
 * @param currentAge - 子供の現在年齢（0-18歳）
 * @param totalSubsidy - 累計助成額（円）
 * @param prefecture - 都道府県名
 * @returns 説明文
 *
 * @example
 * const description = generateMedicalSubsidyDescription(0, 2320000, '東京都');
 * // => "0歳から18歳までの19年間で、約232万円の医療費助成が見込まれます（年平均約12.2万円）"
 */
export function generateMedicalSubsidyDescription(
  currentAge: number,
  totalSubsidy: number,
  prefecture: Prefecture
): string {
  if (currentAge > 18) {
    return 'お子様は既に医療費助成の対象年齢を超えています';
  }

  const maxAge = getAssistanceAge(prefecture);
  const yearsRemaining = maxAge - currentAge + 1;
  const avgPerYear = Math.round(totalSubsidy / yearsRemaining);

  let description = `${currentAge}歳から${maxAge}歳までの${yearsRemaining}年間で、約${(totalSubsidy / 10000).toFixed(0)}万円の医療費助成が見込まれます（年平均約${(avgPerYear / 10000).toFixed(1)}万円）`;

  // 神奈川県の場合は注意書きを追加
  if (prefecture === '神奈川県') {
    description +=
      ' ※神奈川県は市町村により制度が異なります。横浜市など一部自治体では18歳まで助成がありますが、本計算では保守的に0円としています。';
  }

  return description;
}
