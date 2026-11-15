/**
 * SIP Wealth Calculator - Interactive Charting Engine
 * Powered by Chart.js with responsive gradients, dark/light theme support, and smooth transitions
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SIPCharts = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let donutChartInstance = null;
  let growthChartInstance = null;

  /**
   * Render or Update the Wealth Distribution Donut Chart
   */
  function updateDonutChart(canvasId, totalInvested, estimatedReturns, currency = 'INR') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const total = totalInvested + estimatedReturns;
    const investedPercent = total > 0 ? ((totalInvested / total) * 100).toFixed(1) : 0;
    const returnsPercent = total > 0 ? ((estimatedReturns / total) * 100).toFixed(1) : 0;

    const data = {
      labels: [`Invested (${investedPercent}%)`, `Estimated Wealth Gain (${returnsPercent}%)`],
      datasets: [{
        data: [totalInvested, estimatedReturns],
        backgroundColor: [
          '#6366F1', // Indigo / Brand Primary
          '#10B981'  // Emerald Green
        ],
        hoverBackgroundColor: [
          '#4F46E5',
          '#059669'
        ],
        borderWidth: 2,
        borderColor: '#1E293B' // Slate-800 dark border
      }]
    };

    if (donutChartInstance) {
      donutChartInstance.data = data;
      donutChartInstance.options.plugins.tooltip.callbacks.label = function (context) {
        const val = context.raw || 0;
        const formatted = SIPCalculatorEngine.formatCurrency(val, currency, false);
        return ` ${context.label.split(' ')[0]}: ${formatted}`;
      };
      donutChartInstance.update();
      return donutChartInstance;
    }

    donutChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 750
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94A3B8', // Slate 400
              font: { family: 'Inter, system-ui, sans-serif', size: 12, weight: '500' },
              padding: 18,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                const formatted = SIPCalculatorEngine.formatCurrency(val, currency, false);
                return ` ${context.label.split(' ')[0]}: ${formatted}`;
              }
            }
          }
        }
      }
    });

    return donutChartInstance;
  }

  /**
   * Render or Update the Multi-Year Wealth Trajectory Chart
   */
  function updateGrowthChart(canvasId, schedule, inflationRate = 0, currency = 'INR') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = schedule.map(item => `Yr ${item.year}`);
    const investedData = schedule.map(item => item.totalInvested);
    const returnsData = schedule.map(item => item.totalReturns);
    const maturityData = schedule.map(item => item.maturityAmount);

    // Compute inflation adjusted line if inflation rate > 0
    let inflationData = null;
    if (inflationRate > 0) {
      inflationData = schedule.map(item =>
        SIPCalculatorEngine.calculateInflationAdjusted(item.maturityAmount, inflationRate, item.year)
      );
    }

    // Chart datasets
    const datasets = [
      {
        type: 'bar',
        label: 'Invested Capital',
        data: investedData,
        backgroundColor: '#6366F1',
        borderRadius: 4,
        stack: 'wealth',
        order: 2
      },
      {
        type: 'bar',
        label: 'Estimated Returns',
        data: returnsData,
        backgroundColor: '#10B981',
        borderRadius: 4,
        stack: 'wealth',
        order: 2
      }
    ];

    if (inflationData) {
      datasets.push({
        type: 'line',
        label: `Real Value (${inflationRate}% Inflation)`,
        data: inflationData,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2.5,
        borderDash: [5, 5],
        pointRadius: 3,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.25,
        order: 1
      });
    }

    const data = {
      labels: labels,
      datasets: datasets
    };

    if (growthChartInstance) {
      growthChartInstance.data = data;
      growthChartInstance.options.scales.y.ticks.callback = function (value) {
        return SIPCalculatorEngine.formatCurrency(value, currency, true);
      };
      growthChartInstance.options.plugins.tooltip.callbacks.label = function (context) {
        const val = context.raw || 0;
        const formatted = SIPCalculatorEngine.formatCurrency(val, currency, false);
        return ` ${context.dataset.label}: ${formatted}`;
      };
      growthChartInstance.options.plugins.tooltip.callbacks.footer = function (tooltipItems) {
        let total = 0;
        for (const item of tooltipItems) {
          if (item.dataset.type === 'bar') {
            total += item.raw;
          }
        }
        if (total > 0) {
          return `Total Projected Value: ${SIPCalculatorEngine.formatCurrency(total, currency, false)}`;
        }
        return '';
      };
      growthChartInstance.update();
      return growthChartInstance;
    }

    growthChartInstance = new Chart(ctx, {
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94A3B8',
              font: { family: 'Inter, system-ui, sans-serif', size: 11 }
            }
          },
          y: {
            stacked: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94A3B8',
              font: { family: 'Inter, system-ui, sans-serif', size: 11 },
              callback: function (value) {
                return SIPCalculatorEngine.formatCurrency(value, currency, true);
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#CBD5E1',
              font: { family: 'Inter, system-ui, sans-serif', size: 12 },
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                const formatted = SIPCalculatorEngine.formatCurrency(val, currency, false);
                return ` ${context.dataset.label}: ${formatted}`;
              },
              footer: function (tooltipItems) {
                let total = 0;
                for (const item of tooltipItems) {
                  if (item.dataset.type === 'bar') {
                    total += item.raw;
                  }
                }
                if (total > 0) {
                  return `Total Projected Value: ${SIPCalculatorEngine.formatCurrency(total, currency, false)}`;
                }
                return '';
              }
            }
          }
        }
      }
    });

    return growthChartInstance;
  }

  return {
    updateDonutChart,
    updateGrowthChart
  };
});
