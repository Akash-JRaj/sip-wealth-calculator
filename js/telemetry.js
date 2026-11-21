/**
 * Smart SIP Calculator - OpenTelemetry Client Telemetry Module
 * Connects browser user interactions, calculations, and security events to the
 * local Grafana LGTM stack (Loki, Grafana, Tempo, Mimir/Prometheus) via OTLP/HTTP.
 *
 * Resilient & Fail-Safe: Gracefully degrades to no-op if OTel collector is offline.
 */

(function () {
  'use strict';

  const DEFAULT_COLLECTOR_URL = 'http://localhost:4318';
  const SERVICE_NAME = 'sip-calculator';
  const SERVICE_VERSION = '1.0.0';

  const isHttps = window.location.protocol === 'https:';

  let isCollectorAlive = false;
  let checkInProgress = false;
  let calculationDebounceTimer = null;

  // Cumulative metric counters
  const counters = {
    calculationsTotal: {},
    currencySwitchesTotal: {},
    authAttemptsTotal: {},
    pageViewsTotal: {}
  };

  /**
   * Generates a 32-hex character trace ID (16 bytes)
   */
  function generateTraceId() {
    const bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates a 16-hex character span ID (8 bytes)
   */
  function generateSpanId() {
    const bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Returns current timestamp in Unix nanoseconds as string
   */
  function getUnixNano() {
    return (BigInt(Date.now()) * 1000000n).toString();
  }

  /**
   * Checks if local OTel collector is reachable
   */
  async function testCollectorHealth() {
    if (checkInProgress) return isCollectorAlive;
    checkInProgress = true;

    // Mixed content protection: If running on HTTPS (e.g. GitHub Pages or Vercel),
    // modern browsers forbid plain HTTP fetch to localhost.
    if (isHttps && DEFAULT_COLLECTOR_URL.startsWith('http://')) {
      isCollectorAlive = false;
      checkInProgress = false;
      updateUiBadge('https_warning');
      return false;
    }

    try {
      // Lightweight pre-flight probe
      const res = await fetch(`${DEFAULT_COLLECTOR_URL}/v1/traces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceSpans: [] }),
        signal: AbortSignal.timeout(1200)
      });
      isCollectorAlive = res.status < 500;
    } catch (e) {
      isCollectorAlive = false;
    } finally {
      checkInProgress = false;
      updateUiBadge(isCollectorAlive ? 'active' : 'offline');
    }
    return isCollectorAlive;
  }

  /**
   * Send JSON payload to OTLP endpoint safely
   */
  async function sendOtlp(endpoint, payload) {
    if (!isCollectorAlive || isHttps) return;
    try {
      await fetch(`${DEFAULT_COLLECTOR_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // If collector drops offline, flag it silently
      isCollectorAlive = false;
      updateUiBadge('offline');
    }
  }

  /**
   * Updates visual telemetry badge in UI if container exists
   */
  function updateUiBadge(status) {
    const badge = document.getElementById('otelTelemetryBadge');
    if (!badge) return;

    if (status === 'active' || isCollectorAlive) {
      badge.classList.remove('hidden', 'bg-slate-900', 'text-slate-400', 'border-slate-800');
      badge.classList.add('flex', 'bg-emerald-950/80', 'text-emerald-400', 'border-emerald-500/40');
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>LGTM Telemetry Active</span>
        <a href="http://localhost:3000/d/smart-sip-lgtm/smart-sip-full-lgtm-observability-dashboard" target="_blank" class="ml-1 underline text-[10px] text-emerald-300 hover:text-white" title="Open Grafana">Grafana ↗</a>
      `;
    } else if (status === 'https_warning' || isHttps) {
      badge.classList.remove('hidden', 'bg-emerald-950/80', 'text-emerald-400', 'border-emerald-500/40');
      badge.classList.add('flex', 'bg-slate-900/90', 'text-slate-400', 'border-slate-700/80');
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
        <span>Local LGTM: Run <code>npm start</code> for live browser telemetry</span>
      `;
    } else {
      badge.classList.add('hidden');
    }
  }

  // ================= TELEMETRY EMITTERS =================

  /**
   * Emits distributed trace, metrics, and structured log for a calculation
   */
  async function recordCalculation(params) {
    if (!isCollectorAlive) return;

    // Debounce high-frequency slider changes (send final settled value within 250ms)
    clearTimeout(calculationDebounceTimer);
    calculationDebounceTimer = setTimeout(async () => {
      const traceId = generateTraceId();
      const rootSpanId = generateSpanId();
      const calcSpanId = generateSpanId();
      const renderSpanId = generateSpanId();

      const startTimeNano = getUnixNano();
      const startMs = performance.now();

      const mode = params.mode || 'standard';
      const currency = params.currency || 'INR';
      const totalWealth = Number(params.totalValue || 0);
      const totalInvested = Number(params.totalInvested || 0);
      const returns = Number(params.estimatedReturns || 0);
      const monthly = Number(params.monthlyInvestment || params.principal || 0);
      const tenure = Number(params.years || 0);
      const rate = Number(params.annualRate || 0);
      const stepUp = Number(params.stepUpPercent || 0);

      const endTimeNano = (BigInt(startTimeNano) + 12000000n).toString(); // ~12ms simulated calc+render window

      // 1. EMIT TRACE (Tempo)
      const tracePayload = {
        resourceSpans: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: SERVICE_NAME } },
              { key: 'service.version', value: { stringValue: SERVICE_VERSION } },
              { key: 'environment', value: { stringValue: 'development' } }
            ]
          },
          scopeSpans: [{
            scope: { name: 'sip-calculator-engine', version: SERVICE_VERSION },
            spans: [
              {
                traceId: traceId,
                spanId: rootSpanId,
                name: 'calculate_wealth_workflow',
                kind: 1, // INTERNAL
                startTimeUnixNano: startTimeNano,
                endTimeUnixNano: endTimeNano,
                attributes: [
                  { key: 'calculation.mode', value: { stringValue: mode } },
                  { key: 'calculation.currency', value: { stringValue: currency } },
                  { key: 'calculation.monthly_amount', value: { doubleValue: monthly } },
                  { key: 'calculation.tenure_years', value: { intValue: tenure } },
                  { key: 'calculation.rate_percent', value: { doubleValue: rate } },
                  { key: 'calculation.step_up_percent', value: { doubleValue: stepUp } },
                  { key: 'calculation.projected_wealth', value: { doubleValue: totalWealth } }
                ],
                status: { code: 1 }
              },
              {
                traceId: traceId,
                spanId: calcSpanId,
                parentSpanId: rootSpanId,
                name: 'compute_compounding_schedule',
                kind: 1,
                startTimeUnixNano: startTimeNano,
                endTimeUnixNano: (BigInt(startTimeNano) + 5000000n).toString(),
                attributes: [
                  { key: 'calculation.mode', value: { stringValue: mode } },
                  { key: 'calculation.invested', value: { doubleValue: totalInvested } },
                  { key: 'calculation.returns', value: { doubleValue: returns } }
                ],
                status: { code: 1 }
              },
              {
                traceId: traceId,
                spanId: renderSpanId,
                parentSpanId: rootSpanId,
                name: 'render_growth_visualizations',
                kind: 1,
                startTimeUnixNano: (BigInt(startTimeNano) + 5000000n).toString(),
                endTimeUnixNano: endTimeNano,
                attributes: [
                  { key: 'chart.type', value: { stringValue: 'growth_area_and_donut' } }
                ],
                status: { code: 1 }
              }
            ]
          }]
        }]
      };

      // 2. EMIT METRICS (Mimir / Prometheus)
      const metricKey = `${mode}_${currency}`;
      counters.calculationsTotal[metricKey] = (counters.calculationsTotal[metricKey] || 0) + 1;

      const metricsPayload = {
        resourceMetrics: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: SERVICE_NAME } }
            ]
          },
          scopeMetrics: [{
            scope: { name: 'sip-calculator-metrics', version: SERVICE_VERSION },
            metrics: [
              {
                name: 'sip_calculations_total',
                description: 'Total number of wealth calculations performed',
                sum: {
                  aggregationTemporality: 2, // CUMULATIVE
                  isMonotonic: true,
                  dataPoints: [{
                    asInt: String(counters.calculationsTotal[metricKey]),
                    startTimeUnixNano: startTimeNano,
                    timeUnixNano: endTimeNano,
                    attributes: [
                      { key: 'mode', value: { stringValue: mode } },
                      { key: 'currency', value: { stringValue: currency } },
                      { key: 'step_up_active', value: { stringValue: stepUp > 0 ? 'true' : 'false' } }
                    ]
                  }]
                }
              },
              {
                name: 'sip_projected_wealth',
                description: 'Latest projected corpus value from calculations',
                gauge: {
                  dataPoints: [{
                    asDouble: totalWealth,
                    timeUnixNano: endTimeNano,
                    attributes: [
                      { key: 'mode', value: { stringValue: mode } },
                      { key: 'currency', value: { stringValue: currency } }
                    ]
                  }]
                }
              },
              {
                name: 'sip_monthly_investment_amount',
                description: 'Monthly investment input amount',
                gauge: {
                  dataPoints: [{
                    asDouble: monthly,
                    timeUnixNano: endTimeNano,
                    attributes: [
                      { key: 'currency', value: { stringValue: currency } }
                    ]
                  }]
                }
              }
            ]
          }]
        }]
      };

      // 3. EMIT STRUCTURED LOG (Loki with Trace Correlation)
      const logBody = `Executed ${mode.toUpperCase()} calculation: ${currency} ${monthly}/mo over ${tenure}y @ ${rate}% -> Total ${currency} ${Math.round(totalWealth).toLocaleString()}`;
      const logsPayload = {
        resourceLogs: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: SERVICE_NAME } },
              { key: 'app.env', value: { stringValue: 'local-dev' } }
            ]
          },
          scopeLogs: [{
            scope: { name: 'sip-calculator-audit' },
            logRecords: [{
              timeUnixNano: endTimeNano,
              severityNumber: 9, // INFO
              severityText: 'INFO',
              body: { stringValue: logBody },
              attributes: [
                { key: 'event_type', value: { stringValue: 'calculation_completed' } },
                { key: 'mode', value: { stringValue: mode } },
                { key: 'currency', value: { stringValue: currency } },
                { key: 'projected_wealth', value: { doubleValue: totalWealth } },
                { key: 'trace_id', value: { stringValue: traceId } },
                { key: 'span_id', value: { stringValue: rootSpanId } }
              ],
              traceId: traceId,
              spanId: rootSpanId
            }]
          }]
        }]
      };

      // Fire in parallel
      await Promise.allSettled([
        sendOtlp('/v1/traces', tracePayload),
        sendOtlp('/v1/metrics', metricsPayload),
        sendOtlp('/v1/logs', logsPayload)
      ]);
    }, 250);
  }

  /**
   * Records currency switch event
   */
  async function recordCurrencySwitch(fromCurrency, toCurrency) {
    if (!isCollectorAlive) return;
    const traceId = generateTraceId();
    const spanId = generateSpanId();
    const nowNano = getUnixNano();

    const switchKey = `${fromCurrency}_to_${toCurrency}`;
    counters.currencySwitchesTotal[switchKey] = (counters.currencySwitchesTotal[switchKey] || 0) + 1;

    const logBody = `User switched active currency from ${fromCurrency} to ${toCurrency}`;

    await Promise.allSettled([
      sendOtlp('/v1/metrics', {
        resourceMetrics: [{
          resource: { attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }] },
          scopeMetrics: [{
            scope: { name: 'sip-calculator-metrics' },
            metrics: [{
              name: 'sip_currency_switches_total',
              description: 'Total number of currency switch actions',
              sum: {
                aggregationTemporality: 2,
                isMonotonic: true,
                dataPoints: [{
                  asInt: String(counters.currencySwitchesTotal[switchKey]),
                  startTimeUnixNano: nowNano,
                  timeUnixNano: nowNano,
                  attributes: [
                    { key: 'from_currency', value: { stringValue: fromCurrency } },
                    { key: 'to_currency', value: { stringValue: toCurrency } }
                  ]
                }]
              }
            }]
          }]
        }]
      }),
      sendOtlp('/v1/logs', {
        resourceLogs: [{
          resource: { attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }] },
          scopeLogs: [{
            scope: { name: 'sip-calculator-audit' },
            logRecords: [{
              timeUnixNano: nowNano,
              severityNumber: 9,
              severityText: 'INFO',
              body: { stringValue: logBody },
              attributes: [
                { key: 'event_type', value: { stringValue: 'currency_changed' } },
                { key: 'from_currency', value: { stringValue: fromCurrency } },
                { key: 'to_currency', value: { stringValue: toCurrency } },
                { key: 'trace_id', value: { stringValue: traceId } },
                { key: 'span_id', value: { stringValue: spanId } }
              ],
              traceId: traceId,
              spanId: spanId
            }]
          }]
        }]
      })
    ]);
  }

  /**
   * Records analytics master passcode authentication attempt (Security Audit)
   */
  async function recordAuthAttempt(status, reason) {
    if (!isCollectorAlive) return;
    const traceId = generateTraceId();
    const spanId = generateSpanId();
    const nowNano = getUnixNano();

    const authKey = status || 'unknown';
    counters.authAttemptsTotal[authKey] = (counters.authAttemptsTotal[authKey] || 0) + 1;

    const isSuccess = status === 'success';
    const severityNumber = isSuccess ? 9 : 13; // INFO vs WARN
    const severityText = isSuccess ? 'INFO' : 'WARN';
    const logBody = isSuccess
      ? 'Owner master passcode authentication successful for /analytics.html'
      : `Master passcode authentication failed: ${reason || 'Invalid secret hash'}`;

    await Promise.allSettled([
      sendOtlp('/v1/metrics', {
        resourceMetrics: [{
          resource: { attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }] },
          scopeMetrics: [{
            scope: { name: 'sip-calculator-metrics' },
            metrics: [{
              name: 'sip_analytics_auth_attempts_total',
              description: 'Master password authentication attempts',
              sum: {
                aggregationTemporality: 2,
                isMonotonic: true,
                dataPoints: [{
                  asInt: String(counters.authAttemptsTotal[authKey]),
                  startTimeUnixNano: nowNano,
                  timeUnixNano: nowNano,
                  attributes: [
                    { key: 'status', value: { stringValue: status } }
                  ]
                }]
              }
            }]
          }]
        }]
      }),
      sendOtlp('/v1/logs', {
        resourceLogs: [{
          resource: { attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }] },
          scopeLogs: [{
            scope: { name: 'sip-security-audit' },
            logRecords: [{
              timeUnixNano: nowNano,
              severityNumber: severityNumber,
              severityText: severityText,
              body: { stringValue: logBody },
              attributes: [
                { key: 'event_type', value: { stringValue: 'security_auth' } },
                { key: 'status', value: { stringValue: status } },
                { key: 'trace_id', value: { stringValue: traceId } },
                { key: 'span_id', value: { stringValue: spanId } }
              ],
              traceId: traceId,
              spanId: spanId
            }]
          }]
        }]
      })
    ]);
  }

  /**
   * Records initial page load event
   */
  async function recordPageView(pageName) {
    if (!isCollectorAlive) return;
    const traceId = generateTraceId();
    const spanId = generateSpanId();
    const nowNano = getUnixNano();

    const pageKey = pageName || 'index';
    counters.pageViewsTotal[pageKey] = (counters.pageViewsTotal[pageKey] || 0) + 1;

    await Promise.allSettled([
      sendOtlp('/v1/metrics', {
        resourceMetrics: [{
          resource: { attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }] },
          scopeMetrics: [{
            scope: { name: 'sip-calculator-metrics' },
            metrics: [{
              name: 'sip_page_views_total',
              description: 'Total page visits',
              sum: {
                aggregationTemporality: 2,
                isMonotonic: true,
                dataPoints: [{
                  asInt: String(counters.pageViewsTotal[pageKey]),
                  startTimeUnixNano: nowNano,
                  timeUnixNano: nowNano,
                  attributes: [{ key: 'page', value: { stringValue: pageKey } }]
                }]
              }
            }]
          }]
        }]
      }),
      sendOtlp('/v1/traces', {
        resourceSpans: [{
          resource: { attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }] },
          scopeSpans: [{
            scope: { name: 'sip-web-lifecycle' },
            spans: [{
              traceId: traceId,
              spanId: spanId,
              name: `page_view_${pageKey}`,
              kind: 1,
              startTimeUnixNano: nowNano,
              endTimeUnixNano: (BigInt(nowNano) + 2000000n).toString(),
              attributes: [
                { key: 'page', value: { stringValue: pageKey } },
                { key: 'user_agent', value: { stringValue: navigator.userAgent.substring(0, 80) } }
              ],
              status: { code: 1 }
            }]
          }]
        }]
      })
    ]);
  }

  // Public Singleton
  window.SIPTelemetry = {
    testCollectorHealth,
    recordCalculation,
    recordCurrencySwitch,
    recordAuthAttempt,
    recordPageView,
    isAvailable: () => isCollectorAlive
  };

  // Auto-probe collector on DOM content ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      testCollectorHealth();
    });
  } else {
    testCollectorHealth();
  }

})();
