/**
 * 補助金データローダー
 *
 * 各都県のJSONデータを安全に読み込み、型チェックを行います。
 */

import { subsidyData } from '@/data';
import type { Prefecture, PrefectureData } from '@/types/subsidy';

/**
 * 指定された都県の補助金データを取得
 *
 * @param prefecture - 都県名
 * @returns 都県の補助金データ
 * @throws データが見つからない場合はエラーをスロー
 *
 * @example
 * const data = loadPrefectureData('東京都');
 * console.log(data.policies.length); // 東京都の補助金制度数
 */
export function loadPrefectureData(prefecture: Prefecture): PrefectureData {
  let data: PrefectureData | null = null;

  switch (prefecture) {
    case '東京都':
      data = subsidyData.tokyo;
      break;
    case '埼玉県':
      data = subsidyData.saitama;
      break;
    case '千葉県':
      data = subsidyData.chiba;
      break;
    case '神奈川県':
      data = subsidyData.kanagawa;
      break;
    default:
      throw new Error(`未対応の都県です: ${prefecture}`);
  }

  if (!data) {
    throw new Error(`データが見つかりません: ${prefecture}`);
  }

  return data;
}

/**
 * 全都県の補助金データを取得
 *
 * @returns 都県をキーとした補助金データのマップ
 *
 * @example
 * const allData = loadAllPrefectureData();
 * Object.keys(allData).forEach(prefecture => {
 *   console.log(`${prefecture}: ${allData[prefecture].policies.length}件`);
 * });
 */
export function loadAllPrefectureData(): Record<Prefecture, PrefectureData> {
  return {
    東京都: subsidyData.tokyo,
    埼玉県: subsidyData.saitama,
    千葉県: subsidyData.chiba,
    神奈川県: subsidyData.kanagawa,
  };
}

/**
 * 全都県のリストを取得
 *
 * @returns 都県名の配列
 */
export function getAllPrefectures(): Prefecture[] {
  return ['東京都', '埼玉県', '千葉県', '神奈川県'];
}
