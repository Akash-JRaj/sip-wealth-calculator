/**
 * SIP Wealth Calculator - Core Financial Engine
 * Mathematically rigorous calculations for:
 * 1. Standard SIP (Monthly Compounding Annuity Due)
 * 2. Step-Up (Top-Up) SIP (Annual % or Fixed Amount Step-up)
 * 3. Lumpsum Investment (Annual CAGR / Compounded)
 * 4. Reverse SIP (Target Goal Wealth Solver)
 * 5. Inflation Adjustment (Real Purchasing Power)
 * 6. Alternative Investment Benchmark Comparison (SIP vs FD vs Gold vs Savings)
 * 7. Year-by-Year Schedule Generator
 * 8. Wealth Milestone Detector
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SIPCalculatorEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Standard SIP Calculation (Mutual Fund formula - Annuity Due)
   * Formula: M = P * [((1 + i)^n - 1) / i] * (1 + i)
   * @param {number} monthlyInvestment - Amount invested per month (P)
   * @param {number} annualRate - Expected return rate in % (e.g. 12 for 12%)
   * @param {number} years - Time period in years
   * @returns {Object} { totalInvested, estimatedReturns, totalValue, schedule }
   */
  function calculateStandardSIP(monthlyInvestment, annualRate, years) {
    monthlyInvestment = Math.max(0, Number(monthlyInvestment) || 0);
    annualRate = Math.max(0, Number(annualRate) || 0);
    years = Math.max(0.1, Number(years) || 1);

    const totalMonths = Math.round(years * 12);
    const i = annualRate / 100 / 12; // Monthly rate

    let totalValue = 0;
    if (i === 0) {
      totalValue = monthlyInvestment * totalMonths;
    } else {
      totalValue = monthlyInvestment * ((Math.pow(1 + i, totalMonths) - 1) / i) * (1 + i);
    }

    const totalInvested = monthlyInvestment * totalMonths;
    const estimatedReturns = Math.max(0, totalValue - totalInvested);

    const schedule = generateSIPSchedule(monthlyInvestment, annualRate, years, 0, 0);

    return {
      monthlyInvestment,
      annualRate,
      years,
      totalMonths,
      totalInvested: Math.round(totalInvested),
      estimatedReturns: Math.round(estimatedReturns),
      totalValue: Math.round(totalValue),
      schedule
    };
  }

  /**
   * Step-Up (Top-Up) SIP Calculation
   * Investor increases SIP amount annually by stepUpPercent (%) or stepUpAmount (fixed)
   * @param {number} initialMonthly - Starting monthly investment
   * @param {number} annualRate - Annual expected return %
   * @param {number} years - Time period in years
   * @param {number} stepUpPercent - Annual % increase (e.g. 10 for 10% step-up)
   * @param {number} stepUpFixedAmount - Optional fixed annual addition (e.g. 1000)
   * @returns {Object}
   */
  function calculateStepUpSIP(initialMonthly, annualRate, years, stepUpPercent = 0, stepUpFixedAmount = 0) {
    initialMonthly = Math.max(0, Number(initialMonthly) || 0);
    annualRate = Math.max(0, Number(annualRate) || 0);
    years = Math.max(0.1, Number(years) || 1);
    stepUpPercent = Math.max(0, Number(stepUpPercent) || 0);
    stepUpFixedAmount = Math.max(0, Number(stepUpFixedAmount) || 0);

    const schedule = generateSIPSchedule(initialMonthly, annualRate, years, stepUpPercent, stepUpFixedAmount);
    const finalYear = schedule[schedule.length - 1] || { totalInvested: 0, maturityAmount: 0, totalReturns: 0 };

    return {
      initialMonthly,
      annualRate,
      years,
      stepUpPercent,
      stepUpFixedAmount,
      totalInvested: Math.round(finalYear.totalInvested),
      estimatedReturns: Math.round(finalYear.totalReturns),
      totalValue: Math.round(finalYear.maturityAmount),
      schedule
    };
  }

  /**
   * Lumpsum (One-Time) Investment Calculation
   * Formula: A = P * (1 + r/100)^t
   * @param {number} principal - One-time investment amount
   * @param {number} annualRate - Expected return rate in %
   * @param {number} years - Investment horizon in years
   * @returns {Object}
   */
  function calculateLumpsum(principal, annualRate, years) {
    principal = Math.max(0, Number(principal) || 0);
    annualRate = Math.max(0, Number(annualRate) || 0);
    years = Math.max(0.1, Number(years) || 1);

    const r = annualRate / 100;
    const totalValue = principal * Math.pow(1 + r, years);
    const estimatedReturns = Math.max(0, totalValue - principal);

    const schedule = [];
    let currentBalance = principal;
    const fullYears = Math.ceil(years);

    for (let y = 1; y <= fullYears; y++) {
      const yearFraction = (y > years) ? (years - (y - 1)) : 1;
      const openingBalance = currentBalance;
      const interestEarned = openingBalance * Math.pow(1 + r, yearFraction) - openingBalance;
      currentBalance = openingBalance + interestEarned;

      schedule.push({
        year: y,
        monthlyAmount: 0,
        yearlyInvested: 0,
        totalInvested: Math.round(principal),
        interestEarned: Math.round(interestEarned),
        totalReturns: Math.round(currentBalance - principal),
        maturityAmount: Math.round(currentBalance)
      });
    }

    return {
      principal: Math.round(principal),
      annualRate,
      years,
      totalInvested: Math.round(principal),
      estimatedReturns: Math.round(estimatedReturns),
      totalValue: Math.round(totalValue),
      schedule
    };
  }

  /**
   * Reverse SIP: Calculates required monthly SIP to reach a Target Goal
   * @param {number} targetGoal - Target accumulated wealth
   * @param {number} annualRate - Expected annual return %
   * @param {number} years - Target duration in years
   * @param {number} stepUpPercent - Optional annual step-up percentage
   * @returns {Object}
   */
  function calculateTargetGoalSIP(targetGoal, annualRate, years, stepUpPercent = 0) {
    targetGoal = Math.max(1, Number(targetGoal) || 1000000);
    annualRate = Math.max(0.1, Number(annualRate) || 12);
    years = Math.max(0.5, Number(years) || 10);
    stepUpPercent = Math.max(0, Number(stepUpPercent) || 0);

    // If no step up: closed-form solution
    if (stepUpPercent === 0) {
      const totalMonths = Math.round(years * 12);
      const i = annualRate / 100 / 12;
      const denominator = ((Math.pow(1 + i, totalMonths) - 1) / i) * (1 + i);
      const requiredMonthly = targetGoal / denominator;
      return calculateStandardSIP(Math.round(requiredMonthly), annualRate, years);
    }

    // With step-up: binary search for starting monthly investment
    let low = 100;
    let high = targetGoal;
    let bestSIP = low;

    for (let iter = 0; iter < 45; iter++) {
      const mid = (low + high) / 2;
      const res = calculateStepUpSIP(mid, annualRate, years, stepUpPercent, 0);
      if (res.totalValue < targetGoal) {
        low = mid;
      } else {
        high = mid;
        bestSIP = mid;
      }
    }

    const finalResult = calculateStepUpSIP(Math.round(bestSIP), annualRate, years, stepUpPercent, 0);
    finalResult.targetGoal = targetGoal;
    return finalResult;
  }

  /**
   * Calculate Inflation-Adjusted (Real) Purchasing Power
   * Real Value = Future Nominal Value / (1 + inflationRate / 100)^years
   * @param {number} futureValue - Nominal future value
   * @param {number} inflationRate - Expected annual inflation rate (e.g. 6)
   * @param {number} years - Time period
   */
  function calculateInflationAdjusted(futureValue, inflationRate, years) {
    inflationRate = Math.max(0, Number(inflationRate) || 0);
    years = Math.max(0, Number(years) || 0);
    const discountFactor = Math.pow(1 + inflationRate / 100, years);
    return Math.round(futureValue / discountFactor);
  }

  /**
   * Year-by-Year Schedule Generator
   * Calculates monthly balance compounding and rolls up into annual schedule
   */
  function generateSIPSchedule(initialMonthly, annualRate, years, stepUpPercent, stepUpFixedAmount) {
    const schedule = [];
    const fullYears = Math.ceil(years);
    const monthlyRate = annualRate / 100 / 12;

    let currentBalance = 0;
    let totalInvestedSoFar = 0;
    let currentMonthly = initialMonthly;

    for (let y = 1; y <= fullYears; y++) {
      let yearlyInvested = 0;
      const startBalanceOfYear = currentBalance;

      const monthsInThisYear = (y === fullYears && years % 1 !== 0)
        ? Math.round((years % 1) * 12)
        : 12;

      for (let m = 1; m <= monthsInThisYear; m++) {
        // Month start deposit (annuity due)
        currentBalance += currentMonthly;
        yearlyInvested += currentMonthly;
        totalInvestedSoFar += currentMonthly;

        // Compounding interest for the month
        currentBalance += currentBalance * monthlyRate;
      }

      const interestThisYear = currentBalance - startBalanceOfYear - yearlyInvested;
      const totalReturns = currentBalance - totalInvestedSoFar;

      schedule.push({
        year: y,
        monthlyAmount: Math.round(currentMonthly),
        yearlyInvested: Math.round(yearlyInvested),
        totalInvested: Math.round(totalInvestedSoFar),
        interestEarned: Math.round(interestThisYear),
        totalReturns: Math.round(totalReturns),
        maturityAmount: Math.round(currentBalance)
      });

      // Apply step-up for next year
      if (stepUpPercent > 0) {
        currentMonthly = currentMonthly * (1 + stepUpPercent / 100);
      } else if (stepUpFixedAmount > 0) {
        currentMonthly = currentMonthly + stepUpFixedAmount;
      }
    }

    return schedule;
  }

  /**
   * Comparative Benchmark: Compare SIP vs Traditional Options
   * 1. Equity Mutual Fund SIP (user rate, default 12%)
   * 2. Bank Fixed Deposit (default 6.8%)
   * 3. Gold / Safe Assets (default 8.5%)
   * 4. Savings Bank Account (default 3.5%)
   * 5. Cash (0% growth, depreciates with inflation)
   */
  function calculateComparisonBenchmarks(monthlyInvestment, years, sipRate = 12, inflationRate = 6) {
    const totalInvested = monthlyInvestment * years * 12;

    const sipRes = calculateStandardSIP(monthlyInvestment, sipRate, years);
    const fdRes = calculateStandardSIP(monthlyInvestment, 6.8, years);
    const goldRes = calculateStandardSIP(monthlyInvestment, 8.5, years);
    const savingsRes = calculateStandardSIP(monthlyInvestment, 3.5, years);

    const cashNominal = totalInvested;
    const cashReal = calculateInflationAdjusted(totalInvested, inflationRate, years);

    return [
      {
        name: 'Equity SIP (Mutual Funds)',
        rate: sipRate,
        totalInvested,
        maturityAmount: sipRes.totalValue,
        returns: sipRes.estimatedReturns,
        realValue: calculateInflationAdjusted(sipRes.totalValue, inflationRate, years),
        color: '#10B981', // Emerald green
        badge: 'Recommended'
      },
      {
        name: 'Gold / Precious Metals',
        rate: 8.5,
        totalInvested,
        maturityAmount: goldRes.totalValue,
        returns: goldRes.estimatedReturns,
        realValue: calculateInflationAdjusted(goldRes.totalValue, inflationRate, years),
        color: '#F59E0B', // Amber
        badge: 'Hedge'
      },
      {
        name: 'Bank Fixed Deposit (FD)',
        rate: 6.8,
        totalInvested,
        maturityAmount: fdRes.totalValue,
        returns: fdRes.estimatedReturns,
        realValue: calculateInflationAdjusted(fdRes.totalValue, inflationRate, years),
        color: '#3B82F6', // Blue
        badge: 'Low Risk'
      },
      {
        name: 'Savings Bank Account',
        rate: 3.5,
        totalInvested,
        maturityAmount: savingsRes.totalValue,
        returns: savingsRes.estimatedReturns,
        realValue: calculateInflationAdjusted(savingsRes.totalValue, inflationRate, years),
        color: '#8B5CF6', // Purple
        badge: 'Liquid'
      },
      {
        name: 'Cash (Mattress / Drawer)',
        rate: 0,
        totalInvested,
        maturityAmount: cashNominal,
        returns: 0,
        realValue: cashReal,
        color: '#EF4444', // Red
        badge: 'Loses Value'
      }
    ];
  }

  /**
   * Wealth Milestones: Detect when user reaches critical financial milestones
   * e.g., 10L, 25L, 50L, 1 Crore, 2 Crore, 5 Crore
   * @param {Array} schedule - Schedule returned from SIP calculation
   * @param {string} currency - 'INR' | 'USD' | 'EUR' | 'GBP'
   */
  function calculateMilestones(schedule, currency = 'INR') {
    let targets = [];
    if (currency === 'INR') {
      targets = [
        { label: '₹5 Lakhs (First Milestone)', value: 500000 },
        { label: '₹10 Lakhs (Double Digit Lakhs)', value: 1000000 },
        { label: '₹25 Lakhs (Quarter Crore)', value: 2500000 },
        { label: '₹50 Lakhs (Half Crore)', value: 5000000 },
        { label: '₹1 Crore (The Crorepati Club)', value: 10000000 },
        { label: '₹2.5 Crores (Financial Freedom)', value: 25000000 },
        { label: '₹5 Crores (Fat FIRE)', value: 50000000 },
        { label: '₹10 Crores (Generational Wealth)', value: 100000000 }
      ];
    } else {
      targets = [
        { label: '$25,000 (Starter Fund)', value: 25000 },
        { label: '$50,000 (Emergency Safety)', value: 50000 },
        { label: '$100,000 (The Hardest First $100k)', value: 100000 },
        { label: '$250,000 (Solid Foundation)', value: 250000 },
        { label: '$500,000 (Half Millionaire)', value: 500000 },
        { label: '$1,000,000 (Millionaire Status)', value: 1000000 },
        { label: '$2,500,000 (Coast FIRE)', value: 2500000 },
        { label: '$5,000,000 (Financial Independence)', value: 5000000 }
      ];
    }

    const achieved = [];
    for (const target of targets) {
      const yearAchieved = schedule.find(item => item.maturityAmount >= target.value);
      if (yearAchieved) {
        achieved.push({
          label: target.label,
          targetValue: target.value,
          yearAchieved: yearAchieved.year,
          amountAchieved: yearAchieved.maturityAmount,
          investedAtThatPoint: yearAchieved.totalInvested
        });
      }
    }
    return achieved;
  }

  /**
   * Currency Formatter utility
   */
  function formatCurrency(amount, currency = 'INR', compact = false) {
    amount = Math.round(amount || 0);

    if (currency === 'INR') {
      if (compact) {
        if (Math.abs(amount) >= 10000000) {
          return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
        }
        if (Math.abs(amount) >= 100000) {
          return '₹' + (amount / 100000).toFixed(2) + ' L';
        }
        if (Math.abs(amount) >= 1000) {
          return '₹' + (amount / 1000).toFixed(1) + ' k';
        }
      }
      return '₹' + amount.toLocaleString('en-IN');
    }

    const symbolMap = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      AED: 'AED '
    };
    const symbol = symbolMap[currency] || '$';

    if (compact) {
      if (Math.abs(amount) >= 1000000000) {
        return symbol + (amount / 1000000000).toFixed(2) + 'B';
      }
      if (Math.abs(amount) >= 1000000) {
        return symbol + (amount / 1000000).toFixed(2) + 'M';
      }
      if (Math.abs(amount) >= 1000) {
        return symbol + (amount / 1000).toFixed(1) + 'k';
      }
    }

    return symbol + amount.toLocaleString('en-US');
  }

  return {
    calculateStandardSIP,
    calculateStepUpSIP,
    calculateLumpsum,
    calculateTargetGoalSIP,
    calculateInflationAdjusted,
    generateSIPSchedule,
    calculateComparisonBenchmarks,
    calculateMilestones,
    formatCurrency
  };
});
