/**
 * SIP Wealth Calculator - 100% Real Live Analytics & Telemetry Engine
 * 
 * Tracks genuine live visits and real calculations across all users globally.
 * - Global hit tracking powered by real-time hits.sh SVG counter (no mock/simulated baseline)
 * - Session-based local event logging (100% authentic user data)
 * - Real device fingerprinting & referral tracking
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SIPAnalytics = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'sip_analytics_real_store_v2';
  const CLIENT_ID_KEY = 'sip_client_uuid_v2';

  // Real-time global counter endpoints for Akash's deployment
  const HITS_VISITS_URL = 'https://hits.sh/akash-jraj.github.io/sip-wealth-calculator.svg';
  const HITS_CALCS_URL = 'https://hits.sh/akash-jraj.github.io/sip-wealth-calculator-calculations.svg';

  // Get or generate persistent anonymous client ID
  function getClientId() {
    try {
      let id = localStorage.getItem(CLIENT_ID_KEY);
      if (!id) {
        id = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem(CLIENT_ID_KEY, id);
      }
      return id;
    } catch (e) {
      return 'usr_guest';
    }
  }

  // Get local analytics store with 100% REAL starting counts (Zero simulated baseline)
  function getLocalStore() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read localStorage analytics', e);
    }

    const now = new Date();
    const defaultData = {
      firstVisit: now.toISOString(),
      lastVisit: now.toISOString(),
      localVisits: 0,
      globalVisits: 0,
      globalCalcs: 0,
      totalCalculations: 0,
      totalWealthCalculated: 0,
      events: [],
      modesUsed: { sip: 0, stepup: 0, lumpsum: 0, goal: 0 },
      timeHorizons: { '5': 0, '10': 0, '15': 0, '20': 0, '25+': 0 },
      devices: { Desktop: 0, Mobile: 0, Tablet: 0 },
      trafficSources: { Direct: 0, WhatsApp: 0, Google: 0, Social: 0 }
    };

    saveLocalStore(defaultData);
    return defaultData;
  }

  function saveLocalStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn('Could not write localStorage analytics', e);
    }
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'Tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'Mobile';
    }
    return 'Desktop';
  }

  function getReferrerSource() {
    const ref = (document.referrer || '').toLowerCase();
    if (!ref) return 'Direct';
    if (ref.includes('whatsapp')) return 'WhatsApp';
    if (ref.includes('google')) return 'Google';
    if (ref.includes('t.co') || ref.includes('twitter') || ref.includes('x.com')) return 'Twitter/X';
    if (ref.includes('linkedin')) return 'LinkedIn';
    if (ref.includes('reddit')) return 'Reddit';
    if (ref.includes('facebook') || ref.includes('instagram')) return 'Social';
    return 'Web Referral';
  }

  /**
   * Fetch real live count from SVG counter
   */
  async function fetchHitsCount(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const svgText = await resp.text();
        const match = svgText.match(/aria-label="hits:\s*(\d+)"/i) || svgText.match(/<title>hits:\s*(\d+)<\/title>/i);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
      }
    } catch (err) {
      // Network offline or blocked
    }
    return null;
  }

  /**
   * Fetch real current global counters
   */
  async function fetchGlobalCounters() {
    const store = getLocalStore();

    try {
      const [visits, calcs] = await Promise.all([
        fetchHitsCount(HITS_VISITS_URL),
        fetchHitsCount(HITS_CALCS_URL)
      ]);

      if (typeof visits === 'number' && visits > 0) {
        store.globalVisits = visits;
      }
      if (typeof calcs === 'number' && calcs > 0) {
        store.globalCalcs = calcs;
      }

      saveLocalStore(store);
    } catch (e) {
      // Use latest recorded store numbers
    }

    return {
      visits: Math.max(store.globalVisits || 0, store.localVisits || 0),
      calculations: Math.max(store.globalCalcs || 0, store.totalCalculations || 0)
    };
  }

  /**
   * Record a Real Page Visit
   */
  async function recordPageView(pageName = '/') {
    const store = getLocalStore();
    store.localVisits = (store.localVisits || 0) + 1;
    store.lastVisit = new Date().toISOString();

    const device = getDeviceType();
    const source = getReferrerSource();

    store.devices[device] = (store.devices[device] || 0) + 1;
    store.trafficSources[source] = (store.trafficSources[source] || 0) + 1;

    store.events.unshift({
      id: 'evt_' + Math.random().toString(36).substring(2, 8),
      type: 'pageview',
      timestamp: new Date().toISOString(),
      meta: { page: pageName, device, source }
    });

    if (store.events.length > 50) store.events.pop();
    saveLocalStore(store);

    // Increment real hits on server
    fetchHitsCount(HITS_VISITS_URL).then(count => {
      if (typeof count === 'number') {
        store.globalVisits = count;
        saveLocalStore(store);
      }
    });

    return store;
  }

  /**
   * Record a Real Calculation Event
   */
  function recordCalculation(mode, params, result) {
    const store = getLocalStore();
    store.totalCalculations = (store.totalCalculations || 0) + 1;
    store.totalWealthCalculated = (store.totalWealthCalculated || 0) + (result.totalValue || 0);

    // Mode tracking
    store.modesUsed[mode] = (store.modesUsed[mode] || 0) + 1;

    // Time horizon tracking
    const years = Number(params.years) || 10;
    if (years <= 5) store.timeHorizons['5'] = (store.timeHorizons['5'] || 0) + 1;
    else if (years <= 10) store.timeHorizons['10'] = (store.timeHorizons['10'] || 0) + 1;
    else if (years <= 15) store.timeHorizons['15'] = (store.timeHorizons['15'] || 0) + 1;
    else if (years <= 20) store.timeHorizons['20'] = (store.timeHorizons['20'] || 0) + 1;
    else store.timeHorizons['25+'] = (store.timeHorizons['25+'] || 0) + 1;

    // Add to activity stream
    store.events.unshift({
      id: 'evt_' + Math.random().toString(36).substring(2, 8),
      type: 'calculate',
      timestamp: new Date().toISOString(),
      meta: {
        mode,
        amount: params.monthlyInvestment || params.initialMonthly || params.principal || params.targetGoal,
        years,
        rate: params.annualRate,
        totalWealth: result.totalValue,
        device: getDeviceType()
      }
    });

    if (store.events.length > 50) store.events.pop();
    saveLocalStore(store);

    // Increment real calculation hit on server
    fetchHitsCount(HITS_CALCS_URL).then(count => {
      if (typeof count === 'number') {
        store.globalCalcs = count;
        saveLocalStore(store);
      }
    });

    return store;
  }

  /**
   * Record Share / Export actions
   */
  function recordAction(actionName, meta = {}) {
    const store = getLocalStore();
    store.events.unshift({
      id: 'evt_' + Math.random().toString(36).substring(2, 8),
      type: actionName,
      timestamp: new Date().toISOString(),
      meta
    });
    if (store.events.length > 50) store.events.pop();
    saveLocalStore(store);
  }

  /**
   * Export analytics data as JSON
   */
  function exportAnalyticsJSON() {
    const data = getLocalStore();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sip-calculator-analytics-live-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all local session data to start 100% fresh
   */
  function resetLocalAnalytics() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('sip_analytics_store_v1'); // Clean legacy
    return getLocalStore();
  }

  return {
    getClientId,
    getLocalStore,
    fetchGlobalCounters,
    recordPageView,
    recordCalculation,
    recordAction,
    exportAnalyticsJSON,
    resetLocalAnalytics
  };
});
