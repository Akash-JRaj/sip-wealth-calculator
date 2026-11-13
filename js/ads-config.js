/**
 * SIP Wealth Calculator - Monetization & Ads Engine
 * 
 * Instructions for Google AdSense Monetization:
 * 1. When you get approved for Google AdSense, set `enabled: true` below.
 * 2. Put your Google AdSense Publisher ID in `publisherId` (e.g., 'ca-pub-1234567890123456').
 * 3. Replace slot IDs with the slots you create in your Google AdSense console.
 * 4. While AdSense is inactive (or set to false), the application automatically displays
 *    sleek, non-intrusive financial affiliate prompts and tips to maximize user engagement.
 */

window.SIP_ADS_CONFIG = {
  // Toggle this to true once your Google AdSense account is approved
  enabled: false,

  // Your Google AdSense Publisher ID
  publisherId: 'ca-pub-XXXXXXXXXXXXXXXX',

  // Ad Slot IDs for different placements
  slots: {
    topLeaderboard: '1234567890',  // 728x90 (Desktop) / 320x50 (Mobile)
    inContentNative: '2345678901', // Responsive display / in-feed
    bottomSticky: '3456789012'    // Responsive anchor / bottom banner
  },

  // High-CTR Affiliate Partner Cards (Active when Ads are disabled or alongside ads)
  affiliatePartners: [
    {
      name: 'Zerodha Coin',
      tagline: 'Invest in Direct Mutual Funds with 0% Commission',
      ctaText: 'Open Free Account',
      ctaUrl: 'https://zerodha.com/open-account',
      badge: 'Zero Commission'
    },
    {
      name: 'Groww Direct SIP',
      tagline: 'Start SIP with just ₹500/month in top Nifty 50 Index Funds',
      ctaText: 'Start SIP Now',
      ctaUrl: 'https://groww.in',
      badge: 'Fast KYC'
    },
    {
      name: 'Vanguard Index Funds',
      tagline: 'Low-cost S&P 500 index funds for long term wealth creation',
      ctaText: 'Explore Funds',
      ctaUrl: 'https://investor.vanguard.com',
      badge: 'Global'
    }
  ]
};

// Auto-inject AdSense script if enabled
(function () {
  if (window.SIP_ADS_CONFIG && window.SIP_ADS_CONFIG.enabled && window.SIP_ADS_CONFIG.publisherId !== 'ca-pub-XXXXXXXXXXXXXXXX') {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${window.SIP_ADS_CONFIG.publisherId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
})();
