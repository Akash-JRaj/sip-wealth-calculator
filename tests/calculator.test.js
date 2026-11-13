const assert = require('assert');
const engine = require('../js/calculator.js');

console.log('🧪 Running SIP Calculator Engine Unit Tests...\n');

// Test 1: Standard SIP
// ₹10,000 / month at 12% for 10 years
// Formula gives: M = 10000 * (((1 + 0.01)^120 - 1) / 0.01) * 1.01 = 2,323,391
const test1 = engine.calculateStandardSIP(10000, 12, 10);
assert.strictEqual(test1.totalInvested, 1200000, 'Total invested must be 12,00,000');
assert(Math.abs(test1.totalValue - 2323391) <= 2, `Expected ~2,323,391, got ${test1.totalValue}`);
assert.strictEqual(test1.estimatedReturns, test1.totalValue - test1.totalInvested);
console.log('✅ Test 1 Passed: Standard SIP calculation matches standard financial formulas');

// Test 2: Step-up SIP
// ₹10,000 / month, 12%, 10 years, 10% annual step-up
const test2 = engine.calculateStepUpSIP(10000, 12, 10, 10);
assert(test2.totalInvested > 1200000, 'Step-up total invested must be greater than flat SIP');
assert(test2.totalValue > test1.totalValue, 'Step-up total maturity must be substantially higher');
console.log(`✅ Test 2 Passed: 10% Step-Up yields ₹${test2.totalValue.toLocaleString('en-IN')} vs flat ₹${test1.totalValue.toLocaleString('en-IN')}`);

// Test 3: Lumpsum
// ₹1,00,000 at 12% for 10 years: 100000 * (1.12)^10 = 310,585
const test3 = engine.calculateLumpsum(100000, 12, 10);
assert.strictEqual(test3.totalInvested, 100000);
assert(Math.abs(test3.totalValue - 310585) <= 2, `Expected ~310,585, got ${test3.totalValue}`);
console.log('✅ Test 3 Passed: Lumpsum CAGR matches 10-year compound interest formula');

// Test 4: Target Goal (Reverse SIP)
// Goal: ₹1 Crore (10,000,000) in 15 years at 12%
const targetGoal = 10000000;
const test4 = engine.calculateTargetGoalSIP(targetGoal, 12, 15);
assert(Math.abs(test4.totalValue - targetGoal) < 20000, `Target goal should be ~1 Cr, got ${test4.totalValue}`);
console.log(`✅ Test 4 Passed: Reverse SIP finds required monthly investment ₹${test4.monthlyInvestment.toLocaleString('en-IN')} for ₹1 Cr`);

// Test 5: Inflation Adjustment
// ₹1 Crore in 20 years at 6% inflation: 10000000 / (1.06)^20 = 3,118,047
const realValue = engine.calculateInflationAdjusted(10000000, 6, 20);
assert(Math.abs(realValue - 3118047) <= 2, `Expected ~3,118,047, got ${realValue}`);
console.log(`✅ Test 5 Passed: Inflation adjusted purchasing power accurate (₹1 Cr in 20y is ₹${realValue.toLocaleString('en-IN')} today)`);

// Test 6: Benchmarks & Milestones
const benchmarks = engine.calculateComparisonBenchmarks(10000, 15, 12, 6);
assert.strictEqual(benchmarks.length, 5, 'Should have 5 benchmark asset classes');
const milestones = engine.calculateMilestones(test1.schedule, 'INR');
assert(milestones.length >= 2, 'Should achieve at least 10L and 25L milestones');
console.log('✅ Test 6 Passed: Asset class comparisons & milestone detection functional');

// Test 7: Currency formatting
assert.strictEqual(engine.formatCurrency(12500000, 'INR', true), '₹1.25 Cr');
assert.strictEqual(engine.formatCurrency(500000, 'INR', true), '₹5.00 L');
assert.strictEqual(engine.formatCurrency(1500000, 'USD', true), '$1.50M');
console.log('✅ Test 7 Passed: Multi-currency & compact Indian numbering format functional\n');

console.log('🎉 All 7 unit test suites passed perfectly!');
