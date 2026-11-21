#!/usr/bin/env node
/**
 * Smart SIP Calculator - Realistic Observability Traffic Generator
 * Emits continuous OpenTelemetry Traces, Metrics, and Logs to local OTel Collector (http://localhost:4318)
 * for exploring the Grafana LGTM stack (Loki, Grafana, Tempo, Mimir/Prometheus).
 *
 * Usage:
 *   node scripts/traffic-generator.js          # Runs 25 simulated user actions
 *   node scripts/traffic-generator.js --loop   # Runs continuously (1 event every 1.5s)
 *   node scripts/traffic-generator.js --burst 50
 */

const http = require('http');

const COLLECTOR_HOST = '127.0.0.1';
const COLLECTOR_PORT = 4318;
const SERVICE_NAME = 'sip-calculator';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const MODES = ['sip', 'stepup', 'lumpsum', 'goal'];
const TENURES = [5, 10, 15, 20, 25, 30];
const RATES = [10.5, 12.0, 13.5, 14.0, 15.0];
const STEP_UPS = [5, 10, 15, 20];

// Helper to generate IDs
function randomHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes; i++) {
    s += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return s;
}

function getUnixNano() {
  return (BigInt(Date.now()) * 1000000n).toString();
}

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: COLLECTOR_HOST,
        port: COLLECTOR_PORT,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 2000
      },
      (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
}

// Financial math approximation for simulation
function simulateSIP(monthly, annualRate, years, stepUpPercent = 0) {
  const r = annualRate / 12 / 100;
  let totalInvested = 0;
  let totalValue = 0;
  let currentMonthly = monthly;

  for (let y = 1; y <= years; y++) {
    for (let m = 1; m <= 12; m++) {
      totalInvested += currentMonthly;
      totalValue = (totalValue + currentMonthly) * (1 + r);
    }
    if (stepUpPercent > 0) {
      currentMonthly += Math.round(currentMonthly * (stepUpPercent / 100));
    }
  }
  return { totalInvested, totalValue: Math.round(totalValue), estimatedReturns: Math.round(totalValue - totalInvested) };
}

// Event generation
let eventCount = 0;

async function generateSingleEvent() {
  eventCount++;
  const mode = MODES[Math.floor(Math.random() * MODES.length)];
  const currency = CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
  const years = TENURES[Math.floor(Math.random() * TENURES.length)];
  const rate = RATES[Math.floor(Math.random() * RATES.length)];
  const stepUp = mode === 'stepup' ? STEP_UPS[Math.floor(Math.random() * STEP_UPS.length)] : 0;

  let monthly = 10000;
  if (currency === 'INR') {
    monthly = [5000, 10000, 15000, 25000, 50000][Math.floor(Math.random() * 5)];
  } else {
    monthly = [100, 250, 500, 1000, 2000][Math.floor(Math.random() * 5)];
  }

  const { totalInvested, totalValue, estimatedReturns } = simulateSIP(monthly, rate, years, stepUp);

  const traceId = randomHex(16);
  const rootSpanId = randomHex(8);
  const childSpanId = randomHex(8);
  const nowNano = getUnixNano();
  const latencyMs = Math.floor(Math.random() * 25) + 5; // 5ms - 30ms realistic computation
  const endNano = (BigInt(nowNano) + BigInt(latencyMs * 1000000)).toString();

  // 1. TRACE
  const tracePayload = {
    resourceSpans: [{
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: SERVICE_NAME } },
          { key: 'telemetry.sdk.language', value: { stringValue: 'javascript' } },
          { key: 'traffic.source', value: { stringValue: 'traffic-generator' } }
        ]
      },
      scopeSpans: [{
        scope: { name: 'sip-traffic-engine' },
        spans: [
          {
            traceId,
            spanId: rootSpanId,
            name: `execute_${mode}_calculation`,
            kind: 1,
            startTimeUnixNano: nowNano,
            endTimeUnixNano: endNano,
            attributes: [
              { key: 'calculation.mode', value: { stringValue: mode } },
              { key: 'calculation.currency', value: { stringValue: currency } },
              { key: 'calculation.monthly_amount', value: { doubleValue: monthly } },
              { key: 'calculation.tenure_years', value: { intValue: years } },
              { key: 'calculation.rate', value: { doubleValue: rate } },
              { key: 'calculation.step_up_percent', value: { doubleValue: stepUp } },
              { key: 'calculation.projected_wealth', value: { doubleValue: totalValue } }
            ],
            status: { code: 1 }
          },
          {
            traceId,
            spanId: childSpanId,
            parentSpanId: rootSpanId,
            name: 'calculate_growth_schedule',
            kind: 1,
            startTimeUnixNano: nowNano,
            endTimeUnixNano: (BigInt(nowNano) + BigInt(Math.floor(latencyMs * 0.4) * 1000000)).toString(),
            attributes: [
              { key: 'calculation.invested', value: { doubleValue: totalInvested } },
              { key: 'calculation.returns', value: { doubleValue: estimatedReturns } }
            ],
            status: { code: 1 }
          }
        ]
      }]
    }]
  };

  // 2. METRICS
  const metricPayload = {
    resourceMetrics: [{
      resource: { attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }] },
      scopeMetrics: [{
        scope: { name: 'sip-traffic-metrics' },
        metrics: [
          {
            name: 'sip_calculations_total',
            description: 'Total number of wealth calculations performed',
            sum: {
              aggregationTemporality: 2,
              isMonotonic: true,
              dataPoints: [{
                asInt: String(eventCount),
                startTimeUnixNano: nowNano,
                timeUnixNano: endNano,
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
                asDouble: totalValue,
                timeUnixNano: endNano,
                attributes: [
                  { key: 'mode', value: { stringValue: mode } },
                  { key: 'currency', value: { stringValue: currency } }
                ]
              }]
            }
          },
          {
            name: 'sip_calculation_duration_seconds',
            description: 'Calculation latency in seconds',
            gauge: {
              dataPoints: [{
                asDouble: latencyMs / 1000,
                timeUnixNano: endNano,
                attributes: [{ key: 'mode', value: { stringValue: mode } }]
              }]
            }
          }
        ]
      }]
    }]
  };

  // 3. LOG (Correlated with trace)
  const logMessage = `User performed ${mode.toUpperCase()} calculation: ${currency} ${monthly}/mo for ${years}y @ ${rate}% -> Result: ${currency} ${totalValue.toLocaleString()}`;
  const logPayload = {
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
          timeUnixNano: endNano,
          severityNumber: 9,
          severityText: 'INFO',
          body: { stringValue: logMessage },
          attributes: [
            { key: 'event_type', value: { stringValue: 'calculation_completed' } },
            { key: 'mode', value: { stringValue: mode } },
            { key: 'currency', value: { stringValue: currency } },
            { key: 'trace_id', value: { stringValue: traceId } },
            { key: 'span_id', value: { stringValue: rootSpanId } }
          ],
          traceId,
          spanId: rootSpanId
        }]
      }]
    }]
  };

  // Occasional security login simulation (1 in 8 chance)
  let securityLogPayload = null;
  if (Math.random() < 0.125) {
    const isSuccess = Math.random() < 0.8;
    const authTraceId = randomHex(16);
    const authSpanId = randomHex(8);
    securityLogPayload = {
      resourceLogs: [{
        resource: { attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }] },
        scopeLogs: [{
          scope: { name: 'sip-security-audit' },
          logRecords: [{
            timeUnixNano: getUnixNano(),
            severityNumber: isSuccess ? 9 : 13,
            severityText: isSuccess ? 'INFO' : 'WARN',
            body: {
              stringValue: isSuccess
                ? 'Owner master passcode verified successfully for /analytics.html'
                : 'Security Alert: Failed master passcode attempt on /analytics.html'
            },
            attributes: [
              { key: 'event_type', value: { stringValue: 'security_auth' } },
              { key: 'status', value: { stringValue: isSuccess ? 'success' : 'failure' } },
              { key: 'trace_id', value: { stringValue: authTraceId } },
              { key: 'span_id', value: { stringValue: authSpanId } }
            ],
            traceId: authTraceId,
            spanId: authSpanId
          }]
        }]
      }]
    };
  }

  try {
    await Promise.all([
      postJson('/v1/traces', tracePayload),
      postJson('/v1/metrics', metricPayload),
      postJson('/v1/logs', logPayload),
      securityLogPayload ? postJson('/v1/logs', securityLogPayload) : Promise.resolve()
    ]);
    process.stdout.write(`\r🚀 [Event #${eventCount}] ${mode.padEnd(7)} | ${currency} ${String(monthly).padStart(6)}/mo | ${years}y @ ${rate}% -> ${currency} ${totalValue.toLocaleString()} (${latencyMs}ms)`);
  } catch (err) {
    console.error(`\n❌ Failed sending to OTel collector: ${err.message}. Ensure docker container 'otel-lgtm' is running.`);
  }
}

async function run() {
  const args = process.argv.slice(2);
  const isLoop = args.includes('--loop');
  let targetCount = 25;
  const burstIdx = args.indexOf('--burst');
  if (burstIdx !== -1 && args[burstIdx + 1]) {
    targetCount = parseInt(args[burstIdx + 1], 10) || 25;
  }

  console.log(`\n======================================================`);
  console.log(`📊 Smart SIP Calculator - LGTM Telemetry Generator`);
  console.log(`🎯 Target: http://${COLLECTOR_HOST}:${COLLECTOR_PORT} (OpenTelemetry OTLP)`);
  console.log(`📈 View in Grafana: http://localhost:3000 (admin / admin)`);
  console.log(`======================================================\n`);

  if (isLoop) {
    console.log(`🔄 Running in CONTINUOUS mode (Press Ctrl+C to stop)...`);
    while (true) {
      await generateSingleEvent();
      await new Promise(r => setTimeout(r, 1200));
    }
  } else {
    console.log(`⚡ Sending ${targetCount} simulated user sessions...\n`);
    for (let i = 0; i < targetCount; i++) {
      await generateSingleEvent();
      await new Promise(r => setTimeout(r, 100));
    }
    console.log(`\n\n✅ Done! Successfully sent ${targetCount} events to OTel Collector.`);
    console.log(`👉 Open Grafana: http://localhost:3000 to view your live dashboards!\n`);
  }
}

run();
