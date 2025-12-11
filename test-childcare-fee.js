// 保育料無償化の計算テスト
const { calculateSubsidies } = require('./src/lib/calculator.ts');

console.log('=== 保育料無償化の計算テスト ===\n');

// テストケース1: 0歳の子供（東京都・第1子）
console.log('【テスト1】0歳の子供（東京都・第1子）');
const result1 = calculateSubsidies('東京都', {
  householdIncome: 6000000,
  children: [{ age: 0, birthOrder: 'first' }],
});

const childcareFee1 = result1.appliedPolicies.find(p => p.policy.type === 'childcare_fee');
if (childcareFee1) {
  console.log(`  - 制度名: ${childcareFee1.policy.name}`);
  console.log(`  - 計算金額: ${childcareFee1.calculatedAmount.toLocaleString()}円`);
  console.log(`  - 適用年数: ${childcareFee1.yearsApplied}年`);
  console.log(`  - 年齢範囲: ${childcareFee1.ageRange?.fromAge}歳〜${childcareFee1.ageRange?.toAge}歳`);
} else {
  console.log('  ❌ 保育料無償化が見つかりませんでした');
}

// テストケース2: 2歳の子供（東京都・第1子）
console.log('\n【テスト2】2歳の子供（東京都・第1子）');
const result2 = calculateSubsidies('東京都', {
  householdIncome: 6000000,
  children: [{ age: 2, birthOrder: 'first' }],
});

const childcareFee2 = result2.appliedPolicies.find(p => p.policy.type === 'childcare_fee');
if (childcareFee2) {
  console.log(`  - 制度名: ${childcareFee2.policy.name}`);
  console.log(`  - 計算金額: ${childcareFee2.calculatedAmount.toLocaleString()}円`);
  console.log(`  - 適用年数: ${childcareFee2.yearsApplied}年`);
  console.log(`  - 年齢範囲: ${childcareFee2.ageRange?.fromAge}歳〜${childcareFee2.ageRange?.toAge}歳`);
} else {
  console.log('  ❌ 保育料無償化が見つかりませんでした');
}

// テストケース3: 3歳の子供（東京都・第1子）
console.log('\n【テスト3】3歳の子供（東京都・第1子）');
const result3 = calculateSubsidies('東京都', {
  householdIncome: 6000000,
  children: [{ age: 3, birthOrder: 'first' }],
});

const childcareFee3 = result3.appliedPolicies.find(p => p.policy.type === 'childcare_fee');
if (childcareFee3) {
  console.log(`  - 制度名: ${childcareFee3.policy.name}`);
  console.log(`  - 計算金額: ${childcareFee3.calculatedAmount.toLocaleString()}円`);
  console.log(`  - 適用年数: ${childcareFee3.yearsApplied}年`);
  console.log(`  - 年齢範囲: ${childcareFee3.ageRange?.fromAge}歳〜${childcareFee3.ageRange?.toAge}歳`);
} else {
  console.log('  ❌ 保育料無償化が見つかりませんでした');
}

// テストケース4: 5歳の子供（東京都・第1子）
console.log('\n【テスト4】5歳の子供（東京都・第1子）');
const result4 = calculateSubsidies('東京都', {
  householdIncome: 6000000,
  children: [{ age: 5, birthOrder: 'first' }],
});

const childcareFee4 = result4.appliedPolicies.find(p => p.policy.type === 'childcare_fee');
if (childcareFee4) {
  console.log(`  - 制度名: ${childcareFee4.policy.name}`);
  console.log(`  - 計算金額: ${childcareFee4.calculatedAmount.toLocaleString()}円`);
  console.log(`  - 適用年数: ${childcareFee4.yearsApplied}年`);
  console.log(`  - 年齢範囲: ${childcareFee4.ageRange?.fromAge}歳〜${childcareFee4.ageRange?.toAge}歳`);
} else {
  console.log('  ❌ 保育料無償化が見つかりませんでした');
}

// テストケース5: 0歳の子供（千葉県・第2子）
console.log('\n【テスト5】0歳の子供（千葉県・第2子）※半額');
const result5 = calculateSubsidies('千葉県', {
  householdIncome: 6000000,
  children: [{ age: 0, birthOrder: 'second' }],
});

const childcareFee5 = result5.appliedPolicies.find(
  p => p.policy.type === 'childcare_fee' && p.policy.id === 'chiba_hoikuryo_0_2_second'
);
if (childcareFee5) {
  console.log(`  - 制度名: ${childcareFee5.policy.name}`);
  console.log(`  - 計算金額: ${childcareFee5.calculatedAmount.toLocaleString()}円`);
  console.log(`  - 適用年数: ${childcareFee5.yearsApplied}年`);
  console.log(`  - 年齢範囲: ${childcareFee5.ageRange?.fromAge}歳〜${childcareFee5.ageRange?.toAge}歳`);
} else {
  console.log('  ❌ 保育料軽減が見つかりませんでした');
}

console.log('\n=== テスト完了 ===');
