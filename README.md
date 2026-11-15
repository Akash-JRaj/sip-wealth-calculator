# Smart SIP Wealth & Step-Up Calculator

A modern, high-performance Systematic Investment Plan (SIP) calculator and financial planning platform built for maximum user engagement, multi-year compounding insights, and multi-currency wealth planning.

---

## 🌟 Key Features

1. **Four Calculator Modes in One App**:
   - **Standard Monthly SIP**: Compounded monthly mutual fund investing.
   - **Step-Up (Top-Up) SIP**: Models annual percentage increases to match yearly salary hikes.
   - **Lumpsum One-Time**: Long-term compounding growth for lump-sum deposits.
   - **Target Goal Solver**: Reverse-engineers the exact monthly SIP needed to reach a specific wealth milestone (e.g., ₹1 Crore or $1M).

2. **Real Purchasing Power (Inflation Adjustment)**:
   - Evaluates future portfolio returns against inflation, giving users a realistic assessment of future buying power.

3. **Wealth Milestones & Opportunity Cost Comparison**:
   - Compares equity mutual funds against Fixed Deposits (FD), Gold, Savings Accounts, and Cash.
   - Automatically calculates milestones (₹10 Lakhs, ₹50 Lakhs, ₹1 Crore, ₹5 Crores or $100k, $500k, $1M).

4. **Multi-Currency Support**:
   - Dynamic switching across INR (₹), USD ($), EUR (€), and GBP (£) with localized ranges, presets, and tick marks.

5. **Dedicated 24/7 Live Analytics Dashboard (`analytics.html`)**:
   - Real-time global view counters.
   - Universal SHA-256 owner master password protection.
   - Device breakdowns, traffic channels, and recent event streams.

6. **Instant Export & Sharing**:
   - Encodes state into URL parameters for instant social sharing.
   - One-click PDF report generation and CSV schedule downloads.

---

## 🚀 Free 24/7 Deployment

### 1. Deploy on Vercel (`smartsip.vercel.app`)
1. Import the repository `Akash-JRaj/sip-wealth-calculator` on [vercel.com/new](https://vercel.com/new).
2. Set the Project Name to `smartsip`.
3. Click **Deploy**. Your app will be live at `https://smartsip.vercel.app/`!

### 2. GitHub Pages
1. Navigate to your repository **Settings** > **Pages**.
2. Under **Build and deployment**, set **Source** to `Deploy from a branch` (branch: `main`, folder: `/ (root)`).
3. The site is live at `https://<username>.github.io/<repo-name>/`.

---

## 🧪 Testing

Run financial formula tests:
```bash
node tests/calculator.test.js
```
