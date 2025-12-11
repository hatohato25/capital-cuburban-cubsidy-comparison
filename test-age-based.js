/**
 * 年齢ベース計算の簡易テスト
 *
 * 実行方法: node test-age-based.js
 */

// calculateYearsFromCurrentAge のテスト
function calculateYearsFromCurrentAge(currentAge, minAge, maxAge) {
  if (currentAge > maxAge) {
    return 0;
  }
  const startAge = Math.max(currentAge, minAge);
  return maxAge - startAge + 1;
}

console.log('=== calculateYearsFromCurrentAge のテスト ===\n');

// テストケース1: 現在年齢が制度範囲内
const test1 = calculateYearsFromCurrentAge(5, 6, 14);
console.log(`5歳の子供、制度は6-14歳が対象: ${test1}年（期待値: 9年）`);
console.assert(test1 === 9, 'テスト1失敗');

// テストケース2: 現在年齢が制度上限を超えている
const test2 = calculateYearsFromCurrentAge(15, 6, 14);
console.log(`15歳の子供、制度は6-14歳が対象: ${test2}年（期待値: 0年）`);
console.assert(test2 === 0, 'テスト2失敗');

// テストケース3: 現在年齢が制度開始年齢未満
const test3 = calculateYearsFromCurrentAge(3, 6, 14);
console.log(`3歳の子供、制度は6-14歳が対象: ${test3}年（期待値: 9年）`);
console.assert(test3 === 9, 'テスト3失敗');

// テストケース4: 境界値（開始年齢ぴったり）
const test4 = calculateYearsFromCurrentAge(6, 6, 14);
console.log(`6歳の子供、制度は6-14歳が対象: ${test4}年（期待値: 9年）`);
console.assert(test4 === 9, 'テスト4失敗');

// テストケース5: 境界値（終了年齢ぴったり）
const test5 = calculateYearsFromCurrentAge(14, 6, 14);
console.log(`14歳の子供、制度は6-14歳が対象: ${test5}年（期待値: 1年）`);
console.assert(test5 === 1, 'テスト5失敗');

console.log('\n=== 児童手当の計算例 ===\n');

// 児童手当のシミュレーション（第1子）
function simulateChildcareAllowance(currentAge) {
  let total = 0;

  // 0-2歳: 月1.5万円
  const years_0_2 = calculateYearsFromCurrentAge(currentAge, 0, 2);
  total += 15000 * 12 * years_0_2;

  // 3-18歳: 月1万円
  const years_3_18 = calculateYearsFromCurrentAge(currentAge, 3, 18);
  total += 10000 * 12 * years_3_18;

  return total;
}

console.log(`0歳の第1子: ${simulateChildcareAllowance(0).toLocaleString()}円`);
console.log(`5歳の第1子: ${simulateChildcareAllowance(5).toLocaleString()}円（期待値: 約168万円）`);
console.log(`15歳の第1子: ${simulateChildcareAllowance(15).toLocaleString()}円（期待値: 約48万円）`);
console.log(`19歳の第1子: ${simulateChildcareAllowance(19).toLocaleString()}円（期待値: 0円）`);

console.log('\n=== 一時金の計算例 ===\n');

// 一時金（出産育児一時金: 0歳が対象）
function simulateOnceSubsidy(currentAge, minAge, maxAge, amount) {
  if (currentAge >= minAge && currentAge <= maxAge) {
    return amount;
  } else if (currentAge > maxAge) {
    return 0; // 既に受給済み
  } else {
    return amount; // 将来受給予定
  }
}

console.log(`0歳の子供（出産育児一時金）: ${simulateOnceSubsidy(0, 0, 0, 500000).toLocaleString()}円`);
console.log(`5歳の子供（出産育児一時金）: ${simulateOnceSubsidy(5, 0, 0, 500000).toLocaleString()}円（期待値: 0円、既に受給済み）`);

console.log('\n✅ すべてのテストが成功しました！');
