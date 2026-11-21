# Grafana, OpenTelemetry & LGTM Stack Interactive Tutorial

Welcome to your hands-on guide for learning **Grafana**, **OpenTelemetry (OTel)**, and the **LGTM Stack** (**L**oki, **G**rafana, **T**empo, **M**imir/Prometheus) using the **Smart SIP Calculator**.

---

## 1. Quick Architecture Map

```
┌────────────────────────────────────────────────────────┐
│               Browser & Traffic Generator               │
│  - js/telemetry.js (Client events: inputs, clicks)     │
│  - scripts/traffic-generator.js (Simulated sessions)   │
└───────────────────────────┬────────────────────────────┘
                            │ OTLP / HTTP (:4318)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Docker: grafana/otel-lgtm                  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │               OpenTelemetry Collector            │  │
│  └──────────┬──────────────┬──────────────┬─────────┘  │
│             │              │              │            │
│             ▼              ▼              ▼            │
│        [Prometheus]     [Tempo]        [Loki]          │
│          (Metrics)     (Traces)        (Logs)          │
│             │              │              │            │
│             └──────────────┼──────────────┘            │
│                            ▼                           │
│                       [Grafana]                        │
│                  http://localhost:3000                 │
└────────────────────────────────────────────────────────┘
```

---

## 2. Quick Start Commands

### A. Start the LGTM Stack & Auto-Traffic Generator
The stack is configured via `docker-compose.yml`, which starts both the `otel-lgtm` container and an automated background `traffic-generator`:
```bash
docker compose up -d
```
- **Grafana UI**: [http://localhost:3000](http://localhost:3000)
- **Login Credentials**: Username `admin`, Password `admin`
- **OTel HTTP Receiver**: `http://localhost:4318`
- **Live Background Traffic**: Runs automatically so your Grafana dashboards are continuously populated!

### B. Run the Calculator Locally (Zero Mixed-Content Restriction)
To test browser interactions with your local Grafana stack, run the local HTTP dev server:
```bash
npm start
```
- **Local Calculator**: [http://localhost:8080](http://localhost:8080)
- **Why `http://localhost:8080`?**
  When visiting the public production URL (`https://akash-jraj.github.io`), modern browsers block calls to `http://localhost:4318` under browser **Mixed Content (HTTPS to HTTP)** security rules. Running locally over `http://` allows your browser to send traces, metrics, and logs directly to the local collector on port 4318 without any errors!

### C. Manual / CLI Traffic Generator (Optional)
```bash
# Send a burst of 25 calculations across currencies:
npm run telemetry:gen

# Or stream continuously in your terminal:
npm run telemetry:watch
```

### C. Open the Pre-Configured Dashboard
Open directly in your browser:  
👉 **[Smart SIP - Full LGTM Observability Dashboard](http://localhost:3000/d/smart-sip-lgtm/smart-sip-full-lgtm-observability-dashboard)**

---

## 3. Hands-on Learning Exercises

### Exercise 1: Exploring Metrics with PromQL (Mimir / Prometheus)
1. In Grafana, click the **Explore** compass icon (left sidebar) or go to [http://localhost:3000/explore](http://localhost:3000/explore).
2. Select the **Prometheus** datasource from the top dropdown.
3. Try these real PromQL queries:
   - **Total calculations executed**:
     ```promql
     sum(sip_calculations_total)
     ```
   - **Calculation rate per second across currencies**:
     ```promql
     sum by (currency) (rate(sip_calculations_total[1m]))
     ```
   - **Top 5 largest projected wealth simulations**:
     ```promql
     topk(5, sip_projected_wealth)
     ```
   - **Average calculation latency in milliseconds**:
     ```promql
     avg(sip_calculation_duration_seconds) * 1000
     ```

---

### Exercise 2: Tracing Distributed Spans in Tempo
1. In Grafana Explore ([http://localhost:3000/explore](http://localhost:3000/explore)), select the **Tempo** datasource.
2. Select the **Search** tab.
3. In **Service Name**, choose `sip-calculator`.
4. Click **Run Query**. You will see a list of recent spans:
   - `calculate_wealth_workflow`
   - `execute_stepup_calculation`
   - `compute_compounding_schedule`
5. Click on any trace in the results list:
   - You will see the **Trace Waterfall View** showing child spans nested under the parent root span.
   - Click a span to view all business attributes (`calculation.mode`, `calculation.monthly_amount`, `calculation.projected_wealth`).

---

### Exercise 3: Querying Logs in Loki & Trace-to-Log Correlation
1. In Grafana Explore, select the **Loki** datasource.
2. Try these LogQL queries in the query editor:
   - **All logs from the calculator**:
     ```logql
     {service_name="sip-calculator"}
     ```
   - **Filter for Security & Master Passcode events**:
     ```logql
     {service_name="sip-calculator"} |= "Security Alert"
     ```
   - **Filter by currency**:
     ```logql
     {service_name="sip-calculator", currency="INR"}
     ```
3. **The Killer Feature (Trace-to-Log & Log-to-Trace)**:
   - In the log output table, click on any log row to expand it.
   - Notice the clickable badge: **`Trace: <trace_id>`**.
   - Click on the badge! Grafana will instantly split the screen and load the full distributed trace in **Tempo** side-by-side with your log!

---

### Exercise 4: Triggering Telemetry from the Web UI
1. Open the calculator locally in your browser (e.g. `open index.html` or through your local dev server).
2. Notice the green badge in the header: **`● LGTM Telemetry Active`**.
3. Adjust sliders, toggle Step-Up, or switch currencies between **₹ INR**, **$ USD**, **€ EUR**, and **£ GBP**.
4. Switch to Grafana [http://localhost:3000](http://localhost:3000) and watch the time-series charts update live in real-time!
5. Navigate to `analytics.html`, type a random incorrect passcode, and click "Unlock":
   - A warning log with severity `WARN` will immediately appear in Loki under `{service_name="sip-calculator"} |= "failed"`.
