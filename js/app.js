/**
 * SIP Wealth Calculator - Main Application Controller
 * Handles user interactions, state synchronization, PDF generation, CSV exports,
 * link sharing, and integration with Analytics & Ad engines.
 */

(function () {
  'use strict';

  // Application State
  const state = {
    mode: 'sip', // 'sip' | 'stepup' | 'lumpsum' | 'goal'
    currency: 'INR',
    monthlyInvestment: 15000,
    annualRate: 12,
    years: 15,
    stepUpPercent: 10,
    principal: 100000,
    targetGoal: 10000000, // 1 Crore default
    inflationRate: 6,
    includeInflation: false
  };

  // DOM Elements cache
  let dom = {};

  function initDOM() {
    dom = {
      // Currency Select
      currencySelector: document.getElementById('currencySelector'),
      // Mode Tabs
      tabSIP: document.getElementById('tabSIP'),
      tabStepUp: document.getElementById('tabStepUp'),
      tabLumpsum: document.getElementById('tabLumpsum'),
      tabGoal: document.getElementById('tabGoal'),

      // Input wrappers
      sipInputWrapper: document.getElementById('sipInputWrapper'),
      stepUpInputWrapper: document.getElementById('stepUpInputWrapper'),
      lumpsumInputWrapper: document.getElementById('lumpsumInputWrapper'),
      goalInputWrapper: document.getElementById('goalInputWrapper'),

      // Numeric inputs & sliders
      monthlyInput: document.getElementById('monthlyInput'),
      monthlySlider: document.getElementById('monthlySlider'),
      rateInput: document.getElementById('rateInput'),
      rateSlider: document.getElementById('rateSlider'),
      yearsInput: document.getElementById('yearsInput'),
      yearsSlider: document.getElementById('yearsSlider'),
      stepUpInput: document.getElementById('stepUpInput'),
      stepUpSlider: document.getElementById('stepUpSlider'),
      lumpsumInput: document.getElementById('lumpsumInput'),
      lumpsumSlider: document.getElementById('lumpsumSlider'),
      goalInput: document.getElementById('goalInput'),
      goalSlider: document.getElementById('goalSlider'),

      // Inflation toggle & slider
      inflationToggle: document.getElementById('inflationToggle'),
      inflationSection: document.getElementById('inflationSection'),
      inflationInput: document.getElementById('inflationInput'),
      inflationSlider: document.getElementById('inflationSlider'),

      // Metric Outputs
      outInvested: document.getElementById('outInvested'),
      outReturns: document.getElementById('outReturns'),
      outTotalValue: document.getElementById('outTotalValue'),
      outRealValue: document.getElementById('outRealValue'),
      realValueCard: document.getElementById('realValueCard'),
      outWealthMultiplier: document.getElementById('outWealthMultiplier'),
      outMonthlyNeeded: document.getElementById('outMonthlyNeeded'),
      monthlyNeededContainer: document.getElementById('monthlyNeededContainer'),

      // Badges & Counters
      globalVisitsCounter: document.getElementById('globalVisitsCounter'),
      globalCalcsCounter: document.getElementById('globalCalcsCounter'),
      milestonesContainer: document.getElementById('milestonesContainer'),
      comparisonTableBody: document.getElementById('comparisonTableBody'),
      scheduleTableBody: document.getElementById('scheduleTableBody'),

      // Actions
      btnShareLink: document.getElementById('btnShareLink'),
      btnShareWhatsApp: document.getElementById('btnShareWhatsApp'),
      btnDownloadPDF: document.getElementById('btnDownloadPDF'),
      btnDownloadCSV: document.getElementById('btnDownloadCSV'),
      btnQuickPreset5k: document.getElementById('preset5k'),
      btnQuickPreset10k: document.getElementById('preset10k'),
      btnQuickPreset25k: document.getElementById('preset25k'),
      btnQuickPreset50k: document.getElementById('preset50k'),

      // Toast Notification
      toast: document.getElementById('toastNotification'),
      toastMessage: document.getElementById('toastMessage')
    };
  }

  /**
   * Mathematically exact slider tick positioning & click snapping
   */
  function renderSliderTicks(slider, containerId, ticks) {
    const container = document.getElementById(containerId);
    if (!slider || !container) return;

    const min = Number(slider.min);
    const max = Number(slider.max);
    container.innerHTML = '';

    ticks.forEach(tick => {
      const val = tick.val;
      const label = tick.label;
      const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      // Position mathematically aligned with 22px thumb:
      btn.style.left = `calc(${pct}% * (1 - 22px / 100%) + 11px)`;
      btn.className = 'absolute -translate-x-1/2 top-0.5 hover:text-indigo-300 cursor-pointer font-medium transition-colors text-[10px] sm:text-[11px] whitespace-nowrap';
      if (tick.highlight) {
        btn.className += ' text-emerald-400 font-bold';
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        slider.value = val;
        slider.dispatchEvent(new Event('input'));
      });

      container.appendChild(btn);
    });
  }

  function updateSliderFill(slider) {
    if (!slider) return;
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;
    const val = Number(slider.value) || min;
    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    slider.style.background = `linear-gradient(to right, #6366f1 0%, #6366f1 ${pct}%, #1e293b ${pct}%, #1e293b 100%)`;
  }

  function setupAllTicks() {
    renderSliderTicks(dom.monthlySlider, 'monthlyTicks', [
      { val: 500, label: '₹500' },
      { val: 25000, label: '₹25k' },
      { val: 50000, label: '₹50k' },
      { val: 75000, label: '₹75k' },
      { val: 100000, label: '₹1 Lakh' }
    ]);

    renderSliderTicks(dom.rateSlider, 'rateTicks', [
      { val: 1, label: '1%' },
      { val: 7, label: 'FD: 7%' },
      { val: 12, label: 'Nifty: 12%', highlight: true },
      { val: 15, label: 'Midcap: 15%' },
      { val: 30, label: '30%' }
    ]);

    renderSliderTicks(dom.yearsSlider, 'yearsTicks', [
      { val: 1, label: '1 Yr' },
      { val: 5, label: '5 Y' },
      { val: 10, label: '10 Y' },
      { val: 15, label: '15 Y', highlight: true },
      { val: 25, label: '25 Y' },
      { val: 35, label: '35 Y' }
    ]);

    renderSliderTicks(dom.stepUpSlider, 'stepUpTicks', [
      { val: 1, label: '1%' },
      { val: 10, label: '10% (Rec)', highlight: true },
      { val: 25, label: '25%' },
      { val: 50, label: '50%' }
    ]);

    renderSliderTicks(dom.lumpsumSlider, 'lumpsumTicks', [
      { val: 5000, label: '₹5k' },
      { val: 500000, label: '₹5 Lakhs' },
      { val: 1000000, label: '₹10 Lakhs' },
      { val: 1800000, label: '₹18 Lakhs' },
      { val: 2500000, label: '₹25 Lakhs' }
    ]);

    renderSliderTicks(dom.goalSlider, 'goalTicks', [
      { val: 100000, label: '₹1L' },
      { val: 5000000, label: '₹50L' },
      { val: 10000000, label: '₹1 Crore', highlight: true },
      { val: 25000000, label: '₹2.5 Cr' },
      { val: 50000000, label: '₹5 Crore' }
    ]);
  }

  /**
   * Sync sliders and numeric inputs
   */
  function bindSliderInput(slider, input, key, min, max, step) {
    if (!slider || !input) return;

    slider.addEventListener('input', function () {
      const val = Number(slider.value);
      input.value = val;
      state[key] = val;
      updateSliderFill(slider);
      triggerRecalculate();
    });

    input.addEventListener('input', function () {
      let val = Number(input.value) || min;
      if (val > max) val = max;
      if (val < min) val = min;
      slider.value = val;
      state[key] = val;
      updateSliderFill(slider);
      triggerRecalculate();
    });

    updateSliderFill(slider);
  }

  /**
   * Show feedback toast
   */
  function showToast(message, duration = 3000) {
    if (!dom.toast || !dom.toastMessage) return;
    dom.toastMessage.textContent = message;
    dom.toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
    dom.toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      dom.toast.classList.remove('opacity-100', 'translate-y-0');
      dom.toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
    }, duration);
  }

  /**
   * Parse State from URL Hash
   */
  function loadStateFromHash() {
    try {
      const hash = window.location.hash.substring(1);
      if (!hash) return;
      const params = new URLSearchParams(hash);

      if (params.get('mode')) state.mode = params.get('mode');
      if (params.get('currency')) state.currency = params.get('currency');
      if (params.get('monthly')) state.monthlyInvestment = Number(params.get('monthly'));
      if (params.get('rate')) state.annualRate = Number(params.get('rate'));
      if (params.get('years')) state.years = Number(params.get('years'));
      if (params.get('stepup')) state.stepUpPercent = Number(params.get('stepup'));
      if (params.get('principal')) state.principal = Number(params.get('principal'));
      if (params.get('goal')) state.targetGoal = Number(params.get('goal'));
      if (params.get('inf')) {
        state.inflationRate = Number(params.get('inf'));
        state.includeInflation = true;
      }
    } catch (e) {
      console.warn('Could not parse hash parameters', e);
    }
  }

  /**
   * Save State to URL Hash
   */
  function syncStateToHash() {
    try {
      const params = new URLSearchParams();
      params.set('mode', state.mode);
      params.set('currency', state.currency);

      if (state.mode === 'sip') {
        params.set('monthly', state.monthlyInvestment);
      } else if (state.mode === 'stepup') {
        params.set('monthly', state.monthlyInvestment);
        params.set('stepup', state.stepUpPercent);
      } else if (state.mode === 'lumpsum') {
        params.set('principal', state.principal);
      } else if (state.mode === 'goal') {
        params.set('goal', state.targetGoal);
      }

      params.set('rate', state.annualRate);
      params.set('years', state.years);
      if (state.includeInflation) {
        params.set('inf', state.inflationRate);
      }

      history.replaceState(null, '', '#' + params.toString());
    } catch (e) {
      // Silent fail
    }
  }

  /**
   * Switch Active Mode Tab
   */
  function switchMode(newMode) {
    state.mode = newMode;

    const tabs = [
      { id: 'sip', btn: dom.tabSIP, wrapper: dom.sipInputWrapper },
      { id: 'stepup', btn: dom.tabStepUp, wrapper: dom.stepUpInputWrapper },
      { id: 'lumpsum', btn: dom.tabLumpsum, wrapper: dom.lumpsumInputWrapper },
      { id: 'goal', btn: dom.tabGoal, wrapper: dom.goalInputWrapper }
    ];

    tabs.forEach(tab => {
      const isActive = tab.id === newMode;
      if (tab.btn) {
        if (isActive) {
          tab.btn.className = 'tab-btn active px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2';
        } else {
          tab.btn.className = 'tab-btn px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 flex items-center gap-2';
        }
      }
      if (tab.wrapper) {
        tab.wrapper.classList.toggle('hidden', !isActive);
      }
    });

    // Special field visibility: for stepup mode, both monthly and stepup are active
    if (newMode === 'stepup') {
      dom.sipInputWrapper.classList.remove('hidden');
    }

    if (dom.monthlyNeededContainer) {
      dom.monthlyNeededContainer.classList.toggle('hidden', newMode !== 'goal');
    }

    triggerRecalculate();
  }

  /**
   * Recalculate Financial Results
   */
  let debounceTimer = null;
  function triggerRecalculate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      calculateAndRender();
      syncStateToHash();
    }, 40);
  }

  let currentCalculationResult = null;

  function calculateAndRender() {
    let result = null;

    if (state.mode === 'sip') {
      result = SIPCalculatorEngine.calculateStandardSIP(state.monthlyInvestment, state.annualRate, state.years);
    } else if (state.mode === 'stepup') {
      result = SIPCalculatorEngine.calculateStepUpSIP(state.monthlyInvestment, state.annualRate, state.years, state.stepUpPercent, 0);
    } else if (state.mode === 'lumpsum') {
      result = SIPCalculatorEngine.calculateLumpsum(state.principal, state.annualRate, state.years);
    } else if (state.mode === 'goal') {
      result = SIPCalculatorEngine.calculateTargetGoalSIP(state.targetGoal, state.annualRate, state.years, 0);
      if (dom.outMonthlyNeeded) {
        dom.outMonthlyNeeded.textContent = SIPCalculatorEngine.formatCurrency(result.monthlyInvestment, state.currency, false) + '/mo';
      }
    }

    currentCalculationResult = result;

    // Render Metric Cards
    if (dom.outInvested) {
      dom.outInvested.textContent = SIPCalculatorEngine.formatCurrency(result.totalInvested, state.currency, false);
    }
    if (dom.outReturns) {
      dom.outReturns.textContent = SIPCalculatorEngine.formatCurrency(result.estimatedReturns, state.currency, false);
    }
    if (dom.outTotalValue) {
      dom.outTotalValue.textContent = SIPCalculatorEngine.formatCurrency(result.totalValue, state.currency, false);
    }

    // Wealth Multiplier badge (e.g. 3.2x)
    if (dom.outWealthMultiplier) {
      const multiplier = result.totalInvested > 0 ? (result.totalValue / result.totalInvested).toFixed(2) : '1.0';
      dom.outWealthMultiplier.textContent = `${multiplier}x Wealth Multiplier`;
    }

    // Inflation Adjusted Real Value
    if (dom.realValueCard) {
      if (state.includeInflation) {
        dom.realValueCard.classList.remove('hidden');
        const realValue = SIPCalculatorEngine.calculateInflationAdjusted(result.totalValue, state.inflationRate, state.years);
        if (dom.outRealValue) {
          dom.outRealValue.textContent = SIPCalculatorEngine.formatCurrency(realValue, state.currency, false);
        }
      } else {
        dom.realValueCard.classList.add('hidden');
      }
    }

    // Update Interactive Charts
    SIPCharts.updateDonutChart('donutChart', result.totalInvested, result.estimatedReturns, state.currency);
    SIPCharts.updateGrowthChart('growthChart', result.schedule, state.includeInflation ? state.inflationRate : 0, state.currency);

    // Update Wealth Milestones
    renderMilestones(result.schedule);

    // Update Benchmark Comparisons
    renderBenchmarks();

    // Update Year-by-Year Schedule Table
    renderScheduleTable(result.schedule);

    // Record Telemetry
    if (window.SIPAnalytics) {
      SIPAnalytics.recordCalculation(state.mode, state, result);
    }
  }

  /**
   * Render Milestones
   */
  function renderMilestones(schedule) {
    if (!dom.milestonesContainer) return;
    const milestones = SIPCalculatorEngine.calculateMilestones(schedule, state.currency);

    if (milestones.length === 0) {
      dom.milestonesContainer.innerHTML = `
        <div class="col-span-full py-4 text-center text-slate-400 text-sm">
          Increase your investment amount or duration to unlock major wealth milestones!
        </div>
      `;
      return;
    }

    let html = '';
    milestones.forEach((m, idx) => {
      html += `
        <div class="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/50 transition-all duration-200">
          <div class="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
            Yr ${m.yearAchieved}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-medium text-slate-400 truncate">${m.label}</div>
            <div class="text-sm font-semibold text-slate-100">
              ${SIPCalculatorEngine.formatCurrency(m.amountAchieved, state.currency, false)}
            </div>
          </div>
        </div>
      `;
    });

    dom.milestonesContainer.innerHTML = html;
  }

  /**
   * Render Benchmark Comparison (SIP vs FD vs Gold vs Savings vs Cash)
   */
  function renderBenchmarks() {
    if (!dom.comparisonTableBody) return;
    const monthlyAmt = state.mode === 'lumpsum' ? (state.principal / (state.years * 12)) : state.monthlyInvestment;
    const benchmarks = SIPCalculatorEngine.calculateComparisonBenchmarks(monthlyAmt, state.years, state.annualRate, state.inflationRate);

    let html = '';
    benchmarks.forEach(item => {
      const isTop = item.badge === 'Recommended';
      html += `
        <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors ${isTop ? 'bg-emerald-950/20' : ''}">
          <td class="py-3 px-4 text-sm font-medium text-slate-200 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${item.color}"></span>
            ${item.name}
            <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ml-1 ${isTop ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}">
              ${item.badge}
            </span>
          </td>
          <td class="py-3 px-4 text-sm text-slate-300 text-right">${item.rate}%</td>
          <td class="py-3 px-4 text-sm font-semibold text-right ${isTop ? 'text-emerald-400 font-bold' : 'text-slate-200'}">
            ${SIPCalculatorEngine.formatCurrency(item.maturityAmount, state.currency, true)}
          </td>
          <td class="py-3 px-4 text-sm text-slate-400 text-right">
            ${SIPCalculatorEngine.formatCurrency(item.returns, state.currency, true)}
          </td>
          <td class="py-3 px-4 text-sm text-amber-400/90 text-right">
            ${SIPCalculatorEngine.formatCurrency(item.realValue, state.currency, true)}
          </td>
        </tr>
      `;
    });

    dom.comparisonTableBody.innerHTML = html;
  }

  /**
   * Render Year-by-Year Schedule Table
   */
  function renderScheduleTable(schedule) {
    if (!dom.scheduleTableBody) return;

    let html = '';
    schedule.forEach(row => {
      html += `
        <tr class="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors text-xs sm:text-sm">
          <td class="py-2.5 px-3 font-semibold text-slate-200 text-center">Yr ${row.year}</td>
          <td class="py-2.5 px-3 text-slate-300 text-right">${SIPCalculatorEngine.formatCurrency(row.yearlyInvested, state.currency, false)}</td>
          <td class="py-2.5 px-3 text-slate-400 text-right">${SIPCalculatorEngine.formatCurrency(row.totalInvested, state.currency, false)}</td>
          <td class="py-2.5 px-3 text-emerald-400 text-right font-medium">+${SIPCalculatorEngine.formatCurrency(row.interestEarned, state.currency, false)}</td>
          <td class="py-2.5 px-3 text-slate-100 text-right font-semibold">${SIPCalculatorEngine.formatCurrency(row.maturityAmount, state.currency, false)}</td>
        </tr>
      `;
    });

    dom.scheduleTableBody.innerHTML = html;
  }

  /**
   * Export Schedule Table to CSV
   */
  function exportScheduleCSV() {
    if (!currentCalculationResult || !currentCalculationResult.schedule) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Year,Annual Deposit,Cumulative Invested,Interest Earned In Year,Total Wealth Accumulated\n';

    currentCalculationResult.schedule.forEach(row => {
      csvContent += `${row.year},${row.yearlyInvested},${row.totalInvested},${row.interestEarned},${row.maturityAmount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIP-Investment-Plan-${state.years}Y.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📈 CSV Investment Schedule downloaded!');
    if (window.SIPAnalytics) {
      SIPAnalytics.recordAction('export_csv', { years: state.years });
    }
  }

  /**
   * Print / Save as PDF
   */
  function exportPDF() {
    window.print();
    if (window.SIPAnalytics) {
      SIPAnalytics.recordAction('export_pdf', { years: state.years });
    }
  }

  /**
   * Copy Shareable Link
   */
  function shareLink() {
    syncStateToHash();
    const fullUrl = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('🔗 Shareable link copied to clipboard!');
      }).catch(() => {
        prompt('Copy your customized SIP link below:', fullUrl);
      });
    } else {
      prompt('Copy your customized SIP link below:', fullUrl);
    }

    if (window.SIPAnalytics) {
      SIPAnalytics.recordAction('share_link', { url: fullUrl });
    }
  }

  /**
   * Share to WhatsApp
   */
  function shareWhatsApp() {
    syncStateToHash();
    const wealthFormatted = SIPCalculatorEngine.formatCurrency(currentCalculationResult.totalValue, state.currency, false);
    const text = encodeURIComponent(`💰 Check out my SIP Wealth Plan: Investing in mutual funds will build ${wealthFormatted} in ${state.years} years! Plan yours here: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');

    if (window.SIPAnalytics) {
      SIPAnalytics.recordAction('share_whatsapp');
    }
  }

  /**
   * Initialize Global Live Counters
   */
  async function initCounters() {
    if (!window.SIPAnalytics) return;

    // Record page view
    await SIPAnalytics.recordPageView('/');

    // Fetch and display live counters
    const counters = await SIPAnalytics.fetchGlobalCounters();
    if (dom.globalVisitsCounter) {
      dom.globalVisitsCounter.textContent = Number(counters.visits).toLocaleString();
    }
    if (dom.globalCalcsCounter) {
      dom.globalCalcsCounter.textContent = Number(counters.calculations).toLocaleString();
    }
  }

  /**
   * Setup Quick Presets
   */
  function setupPresets() {
    const presets = [
      { btn: dom.btnQuickPreset5k, val: 5000 },
      { btn: dom.btnQuickPreset10k, val: 10000 },
      { btn: dom.btnQuickPreset25k, val: 25000 },
      { btn: dom.btnQuickPreset50k, val: 50000 }
    ];

    presets.forEach(p => {
      if (p.btn) {
        p.btn.addEventListener('click', () => {
          state.monthlyInvestment = p.val;
          dom.monthlyInput.value = p.val;
          dom.monthlySlider.value = p.val;
          triggerRecalculate();
          showToast(`Set monthly investment to ${SIPCalculatorEngine.formatCurrency(p.val, state.currency, false)}`);
        });
      }
    });
  }

  /**
   * Setup Event Listeners
   */
  function setupEvents() {
    // Currency Switcher
    if (dom.currencySelector) {
      dom.currencySelector.value = state.currency;
      dom.currencySelector.addEventListener('change', (e) => {
        state.currency = e.target.value;
        triggerRecalculate();
        showToast(`Currency changed to ${state.currency}`);
      });
    }

    // Tab buttons
    if (dom.tabSIP) dom.tabSIP.addEventListener('click', () => switchMode('sip'));
    if (dom.tabStepUp) dom.tabStepUp.addEventListener('click', () => switchMode('stepup'));
    if (dom.tabLumpsum) dom.tabLumpsum.addEventListener('click', () => switchMode('lumpsum'));
    if (dom.tabGoal) dom.tabGoal.addEventListener('click', () => switchMode('goal'));

    // Binders
    bindSliderInput(dom.monthlySlider, dom.monthlyInput, 'monthlyInvestment', 500, 500000, 500);
    bindSliderInput(dom.rateSlider, dom.rateInput, 'annualRate', 1, 35, 0.5);
    bindSliderInput(dom.yearsSlider, dom.yearsInput, 'years', 1, 40, 1);
    bindSliderInput(dom.stepUpSlider, dom.stepUpInput, 'stepUpPercent', 1, 50, 1);
    bindSliderInput(dom.lumpsumSlider, dom.lumpsumInput, 'principal', 5000, 10000000, 5000);
    bindSliderInput(dom.goalSlider, dom.goalInput, 'targetGoal', 50000, 100000000, 50000);

    // Inflation Section
    if (dom.inflationToggle) {
      dom.inflationToggle.addEventListener('change', (e) => {
        state.includeInflation = e.target.checked;
        if (dom.inflationSection) {
          dom.inflationSection.classList.toggle('hidden', !state.includeInflation);
        }
        triggerRecalculate();
      });
    }
    bindSliderInput(dom.inflationSlider, dom.inflationInput, 'inflationRate', 1, 15, 0.5);

    // Action buttons
    if (dom.btnShareLink) dom.btnShareLink.addEventListener('click', shareLink);
    if (dom.btnShareWhatsApp) dom.btnShareWhatsApp.addEventListener('click', shareWhatsApp);
    if (dom.btnDownloadPDF) dom.btnDownloadPDF.addEventListener('click', exportPDF);
    if (dom.btnDownloadCSV) dom.btnDownloadCSV.addEventListener('click', exportScheduleCSV);

    setupPresets();
  }

  /**
   * Main Bootstrapper
   */
  function init() {
    initDOM();
    loadStateFromHash();
    setupEvents();
    setupAllTicks();
    switchMode(state.mode);
    calculateAndRender();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
