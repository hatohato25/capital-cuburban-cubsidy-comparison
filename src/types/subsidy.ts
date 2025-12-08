/**
 * 補助金制度の型定義
 *
 * このファイルは首都圏4都県の子育て補助金データの型定義を管理します。
 * subsidy_research.mdの調査結果に基づき、すべての補助金制度を正確に表現できるよう設計されています。
 */

// ==========================================
// 基本型定義
// ==========================================

/**
 * 対象都県
 */
export type Prefecture = '東京都' | '埼玉県' | '千葉県' | '神奈川県';

/**
 * 補助金制度のタイプ
 */
export type SubsidyType =
  | 'childbirth_support' // 出産支援
  | 'childcare_allowance' // 児童手当
  | 'medical_expense' // 医療費助成
  | 'school_lunch' // 給食費補助
  | 'childcare_fee' // 保育料補助
  | 'high_school_tuition' // 高校授業料支援
  | 'university_tuition' // 大学授業料支援
  | '018_support' // 018サポート（東京都独自）
  | 'other';

/**
 * 補助金のカテゴリ（表示用）
 */
export type SubsidyCategory =
  | '現金給付'
  | '教育費補助'
  | '医療費補助'
  | '出産・育児支援'
  | 'その他';

// ==========================================
// 所得制限関連の型
// ==========================================

/**
 * 所得制限のタイプ
 */
export type IncomeLimitType = 'none' | 'single' | 'tiered';

/**
 * 段階的所得制限の階層
 *
 * @example
 * // 埼玉県の高校授業料（年収に応じて段階的に金額が変わる）
 * {
 *   threshold: 5000000,    // 年収500万円未満
 *   amount: 200000,        // 施設費20万円
 *   description: '年収500万円未満'
 * }
 */
export interface IncomeTier {
  threshold: number; // 所得閾値（円）
  amount: number; // この階層での補助金額（円/年）
  description?: string; // 階層の説明
}

/**
 * 所得制限条件
 *
 * @example
 * // 所得制限なし
 * { type: 'none' }
 *
 * @example
 * // 単一の上限値
 * { type: 'single', threshold: 9100000 }
 *
 * @example
 * // 段階的な制限（埼玉県の高校授業料など）
 * {
 *   type: 'tiered',
 *   tiers: [
 *     { threshold: 5000000, amount: 200000, description: '年収500万円未満' },
 *     { threshold: 5900000, amount: 14000, description: '年収590万円未満' }
 *   ]
 * }
 */
export interface IncomeLimit {
  type: IncomeLimitType;
  threshold?: number; // 単一閾値（円）※type='single'の場合
  tiers?: IncomeTier[]; // 段階的閾値 ※type='tiered'の場合
}

// ==========================================
// 子供の条件関連の型
// ==========================================

/**
 * 子供の条件
 */
export interface ChildCondition {
  minAge?: number; // 最小年齢（歳）
  maxAge?: number; // 最大年齢（歳）
  birthOrder?: 'first' | 'second' | 'third_or_more' | 'any'; // 第何子
}

/**
 * 多子世帯条件
 *
 * @example
 * // 第3子以降は補助金2倍
 * {
 *   totalChildren: 3,
 *   targetChildBirthOrder: 3,
 *   subsidyMultiplier: 2
 * }
 */
export interface MultiChildCondition {
  totalChildren: number; // 総子供数
  targetChildBirthOrder: number; // 対象の子供（第何子）
  subsidyMultiplier?: number; // 補助金倍率（例: 第3子は2倍）
}

// ==========================================
// 年齢別変動金額の型
// ==========================================

/**
 * 年齢別金額
 *
 * @example
 * // 児童手当（0-2歳は月15,000円）
 * {
 *   minAge: 0,
 *   maxAge: 2,
 *   amount: 15000,
 *   description: '0-2歳（月額）'
 * }
 */
export interface AgeBasedAmount {
  minAge: number; // 最小年齢（歳）
  maxAge: number; // 最大年齢（歳）
  amount: number; // 金額（円/月 または 円/年）
  frequency: 'monthly' | 'yearly'; // 支給頻度
  description?: string; // 説明
}

// ==========================================
// メタデータの型
// ==========================================

/**
 * 補助金制度のメタデータ
 */
export interface SubsidyMetadata {
  sourceUrl: string; // 出典URL
  sourceName: string; // 出典名
  lastUpdated: string; // 最終更新日（YYYY-MM-DD）
  disclaimer?: string; // 免責事項
  notes?: string; // 補足情報
}

// ==========================================
// 補助金制度の型
// ==========================================

/**
 * 補助金制度（基本）
 */
export interface Subsidy {
  id: string; // 一意のID（例: tokyo_018_support）
  name: string; // 制度名
  type: SubsidyType; // 補助金タイプ
  category: SubsidyCategory; // カテゴリ
  prefecture: Prefecture; // 対象都県
  amount: number | 'variable'; // 金額（固定額の場合は数値、変動する場合は'variable'）
  frequency: 'once' | 'monthly' | 'yearly'; // 支給頻度
  conditions: {
    incomeLimit: IncomeLimit;
    childCondition: ChildCondition;
    multiChildCondition?: MultiChildCondition;
  };
  description: string; // 説明
  calculationMethod?: string; // 計算方法の説明
  metadata: SubsidyMetadata;
}

/**
 * 変動金額型の補助金
 *
 * 年齢によって金額が変わる補助金（例: 児童手当）に使用
 */
export interface VariableAmountSubsidy extends Omit<Subsidy, 'amount'> {
  amount: 'variable';
  ageBasedAmounts: AgeBasedAmount[];
}

// ==========================================
// 都県データの型
// ==========================================

/**
 * 都県別の補助金データ
 */
export interface PrefectureData {
  prefecture: Prefecture;
  lastUpdated: string; // 最終更新日（YYYY-MM-DD）
  officialUrl: string; // 公式サイトURL
  policies: (Subsidy | VariableAmountSubsidy)[];
}

// ==========================================
// 計算結果の型
// ==========================================

/**
 * 適用された施策
 */
export interface AppliedPolicy {
  policy: Subsidy | VariableAmountSubsidy;
  calculatedAmount: number; // 計算された金額（円）
  yearsApplied: number; // 適用年数
}

/**
 * 計算結果
 */
export interface CalculationResult {
  prefecture: Prefecture;
  totalAmount: number; // 補助金総額（円）
  appliedPolicies: AppliedPolicy[];
  rank: number; // 順位（1-4）
  calculatedAt: string; // 計算日時（ISO 8601形式）
}

// ==========================================
// ユーティリティ型
// ==========================================

/**
 * 子供の情報
 */
export interface ChildInfo {
  age: number; // 年齢（歳）
  birthOrder: 'first' | 'second' | 'third_or_more'; // 第何子
}

/**
 * 補助金計算の入力パラメータ
 */
export interface CalculationInput {
  householdIncome: number; // 世帯年収（円）
  children: ChildInfo[]; // 子供の情報の配列
}

// ==========================================
// 医療費助成関連の型
// ==========================================

/**
 * 年齢別医療費データ
 */
export interface AgeMedicalCost {
  age: number; // 年齢（歳）
  annualCost: number; // 年間医療費（円）
  description: string; // 説明
}

/**
 * 医療費統計データ全体
 */
export interface MedicalCostData {
  dataSource: {
    name: string; // データソース名
    url: string; // 出典URL
    year: number; // データ年度
    lastUpdated: string; // 最終更新日（YYYY-MM-DD）
    notes: string; // 注意事項
  };
  ageMedicalCosts: AgeMedicalCost[]; // 年齢別医療費の配列
  disclaimer: string[]; // 免責事項
}

// ==========================================
// ユーティリティ型ガード
// ==========================================

/**
 * 型ガード: VariableAmountSubsidy かどうかを判定
 */
export function isVariableAmountSubsidy(
  subsidy: Subsidy | VariableAmountSubsidy
): subsidy is VariableAmountSubsidy {
  return subsidy.amount === 'variable';
}
