/**
 * 補助金データの統合インデックス
 *
 * 各都県のJSONデータを統合して、アプリケーション全体で使用できるようにします。
 */

import type { PrefectureData } from '@/types/subsidy';
import chibaData from './chiba.json';
import kanagawaData from './kanagawa.json';
import saitamaData from './saitama.json';
import tokyoData from './tokyo.json';

/**
 * 補助金データの統合オブジェクト
 *
 * 各都県のデータをPrefecture型でアクセス可能にします。
 *
 * @example
 * import { subsidyData } from '@/data';
 * const tokyoPolicies = subsidyData.tokyo.policies;
 */
export const subsidyData = {
  tokyo: tokyoData as PrefectureData,
  saitama: saitamaData as PrefectureData,
  chiba: chibaData as PrefectureData,
  kanagawa: kanagawaData as PrefectureData,
};
