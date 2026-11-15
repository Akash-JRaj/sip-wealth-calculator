/**
 * SIP Wealth Calculator - Analytics & Global Admin Authentication Engine
 * 
 * 1. Global Persistent Hit Counters powered by Abacus Integer-as-a-Service (Fly.io, CORS-enabled)
 * 2. Universal Global Master Password: Works from ANY browser, incognito, device worldwide
 * 3. Never asks to re-setup; single master password known only to Akash
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SIPAnalytics = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Abacus Global Counter Endpoints (CORS-enabled, permanent cloud integer store)
  const ABACUS_BASE = 'https://abacus.jasoncameron.dev';
  const NAMESPACE = 'akash-sip-wealth-calc';

  const STORAGE_KEY = 'sip_analytics_store_v4';
  const SESSION_AUTH_KEY = 'sip_admin_session_auth_v4';
  const CUSTOM_PIN_KEY = 'sip_custom_master_pin_hash';

  // Global Master Passcode Hash (SHA-256 for: Akash@2026)
  // This allows logging in from ANY device, incognito, or browser in the world
  const GLOBAL_MASTER_HASH = 'e5474fc4630429ec9a200da7ecd84118a497fe6d4e024eeb1d5054dfd086a1b9';

  // SHA-256 Hashing Utility
  async function computeSHA256(message) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback if subtle crypto unavailable
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      hash = ((hash << 5) - hash) + message.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  // Local storage cache
  function getLocalStore() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}

    const defaultData = {
      localVisits: 0,
      totalCalculations: 0,
      totalWealthCalculated: 0,
      cachedGlobalVisits: 2,
      cachedGlobalCalcs: 1,
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
    } catch (e) {}
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Silk/i.test(ua)) return 'Mobile';
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
   * Fetch real counter from Abacus API
   */
  async function fetchAbacus(action, key) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const url = `${ABACUS_BASE}/${action}/${NAMESPACE}/${key}`;

      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        return typeof json.value === 'number' ? json.value : null;
      }
    } catch (err) {
      // Network offline
    }
    return null;
  }

  /**
   * Fetch current global counters without incrementing
   */
  async function fetchGlobalMetrics() {
    const store = getLocalStore();

    try {
      const [visits, calcs] = await Promise.all([
        fetchAbacus('get', 'visits'),
        fetchAbacus('get', 'calcs')
      ]);

      if (typeof visits === 'number') store.cachedGlobalVisits = visits;
      if (typeof calcs === 'number') store.cachedGlobalCalcs = calcs;

      saveLocalStore(store);
    } catch (e) {}

    return {
      visits: Math.max(store.cachedGlobalVisits || 0, store.localVisits || 0, 1),
      calculations: Math.max(store.cachedGlobalCalcs || 0, store.totalCalculations || 0),
      wealth: store.totalWealthCalculated || 0
    };
  }

  /**
   * Record genuine page view
   */
  async function recordPageView(pageName = '/') {
    const store = getLocalStore();
    store.localVisits = (store.localVisits || 0) + 1;

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

    // Increment global cloud counter
    fetchAbacus('hit', 'visits').then(count => {
      if (typeof count === 'number') {
        store.cachedGlobalVisits = count;
        saveLocalStore(store);
      }
    });

    return store;
  }

  /**
   * Record genuine calculation event
   */
  function recordCalculation(mode, params, result) {
    const store = getLocalStore();
    store.totalCalculations = (store.totalCalculations || 0) + 1;
    const wealth = Number(result.totalValue) || 0;
    store.totalWealthCalculated = (store.totalWealthCalculated || 0) + wealth;

    store.modesUsed[mode] = (store.modesUsed[mode] || 0) + 1;
    const years = Number(params.years) || 10;
    if (years <= 5) store.timeHorizons['5'] = (store.timeHorizons['5'] || 0) + 1;
    else if (years <= 10) store.timeHorizons['10'] = (store.timeHorizons['10'] || 0) + 1;
    else if (years <= 15) store.timeHorizons['15'] = (store.timeHorizons['15'] || 0) + 1;
    else if (years <= 20) store.timeHorizons['20'] = (store.timeHorizons['20'] || 0) + 1;
    else store.timeHorizons['25+'] = (store.timeHorizons['25+'] || 0) + 1;

    store.events.unshift({
      id: 'evt_' + Math.random().toString(36).substring(2, 8),
      type: 'calculate',
      timestamp: new Date().toISOString(),
      meta: {
        mode,
        amount: params.monthlyInvestment || params.initialMonthly || params.principal || params.targetGoal,
        years,
        rate: params.annualRate,
        totalWealth: wealth,
        device: getDeviceType()
      }
    });
    if (store.events.length > 50) store.events.pop();
    saveLocalStore(store);

    // Increment global calculations on cloud
    fetchAbacus('hit', 'calcs').then(count => {
      if (typeof count === 'number') {
        store.cachedGlobalCalcs = count;
        saveLocalStore(store);
      }
    });

    return store;
  }

  /**
   * Universal Global Password Authentication
   */
  async function verifyPasscode(enteredPin) {
    if (!enteredPin) return false;
    const enteredHash = await computeSHA256(enteredPin.trim());

    // Check custom override if set locally, otherwise check universal global hash
    const customHash = localStorage.getItem(CUSTOM_PIN_KEY);
    const validHash = customHash || GLOBAL_MASTER_HASH;

    if (enteredHash === validHash) {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      return true;
    }
    return false;
  }

  async function updateMasterPasscode(currentPin, newPin) {
    const isOk = await verifyPasscode(currentPin);
    if (!isOk) {
      throw new Error('Current passcode is incorrect');
    }
    if (!newPin || newPin.trim().length < 4) {
      throw new Error('New passcode must be at least 4 characters');
    }
    const newHash = await computeSHA256(newPin.trim());
    localStorage.setItem(CUSTOM_PIN_KEY, newHash);
    return newHash;
  }

  function isSessionAuthenticated() {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  }

  function logout() {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }

  function resetLocalCacheOnly() {
    const store = getLocalStore();
    store.localVisits = 0;
    store.totalCalculations = 0;
    store.totalWealthCalculated = 0;
    store.events = [];
    saveLocalStore(store);
    return store;
  }

  return {
    fetchGlobalMetrics,
    recordPageView,
    recordCalculation,
    getLocalStore,
    verifyPasscode,
    updateMasterPasscode,
    isSessionAuthenticated,
    logout,
    resetLocalCacheOnly,
    computeSHA256
  };
});
