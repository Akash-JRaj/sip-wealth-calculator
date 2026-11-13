# Smart SIP Wealth & Step-Up Calculator

A modern, high-performance Systematic Investment Plan (SIP) calculator and financial planning platform built for maximum user engagement, multi-year compounding insights, and monetization readiness.

---

## 🌟 Key Features

1. **Four Calculator Modes in One App**:
   - **Standard Monthly SIP**: Compounded monthly mutual fund investing.
   - **Step-Up (Top-Up) SIP**: Models annual percentage increases to match yearly salary hikes.
   - **Lumpsum One-Time**: Long-term compounding growth for lump-sum deposits.
   - **Target Goal Solver**: Reverse-engineers the exact monthly SIP needed to reach a specific wealth milestone (e.g., ₹1 Crore or $1M).

2. **Real Purchasing Power (Inflation Adjustment)**:
   - Evaluates future portfolio returns against inflation (e.g., 6% RBI benchmark), giving users a realistic assessment of future buying power.

3. **Wealth Milestones & Opportunity Cost Comparison**:
   - Compares equity mutual funds against Fixed Deposits (FD), Gold, Savings Accounts, and Cash.
   - Automatically calculates milestones (₹10 Lakhs, ₹50 Lakhs, ₹1 Crore, ₹5 Crores).

4. **Dedicated 24/7 Live Analytics Dashboard (`analytics.html`)**:
   - Real-time global view counters.
   - Total calculations executed and average wealth modeled.
   - Device breakdowns, traffic channels, and recent event streams.

5. **Monetization & Ad-Ready Layout**:
   - Pre-configured ad placements (Leaderboard 728x90, Mid-Content, and Mobile responsive).
   - Easy toggle configuration in `js/ads-config.js` for Google AdSense and financial affiliate links.

6. **Instant Export & Sharing**:
   - Encodes state into URL parameters for instant social sharing.
   - One-click PDF report generation and CSV schedule downloads.

---

## 🚀 Free 24/7 Deployment (GitHub Pages)

This project has zero server dependencies and runs completely on client-side compute, making it 100% free with 99.99% uptime and capable of handling thousands of concurrent users:

1. Push this repository to GitHub.
2. Navigate to your repository **Settings** > **Pages**.
3. Under **Build and deployment**, set **Source** to `GitHub Actions` (or deploy from branch `main` / root).
4. Your website is live at `https://<username>.github.io/<repo-name>/`!

---

## 📈 Monetization Guide

1. **Google AdSense**:
   - Once your website receives initial organic visitors, submit your URL to Google AdSense.
   - Open `js/ads-config.js`, set `enabled: true`, and add your `publisherId`.
2. **Affiliate Partner Cards**:
   - Direct mutual fund brokers (Zerodha, Groww, Vanguard, etc.) provide referral affiliate links paying per verified signup.
   - Update partner links directly inside `js/ads-config.js`.

---

## 🧪 Testing

Run financial formula tests:
```bash
node tests/calculator.test.js
```
