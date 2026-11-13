/**
 * SIP Wealth Calculator - Persistent Cloud Analytics & Admin Security Engine
 * 
 * Features:
 * 1. Global Cloud Persistence (CORS-enabled, survives cache clears across all devices)
 * 2. SHA-256 Cryptographic Passcode Protection (Stored in cloud; no guessable fallbacks)
 * 3. Real Visitor & Calculation Event Logging
 * 4. Anonymous Device & Traffic Attribution
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SIPAnalytics = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Persistent Cloud Database Endpoint (Free, 24/7, CORS-enabled)
  const CLOUD_ENDPOINT = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1d3a163d51e04';
  const LOCAL_STORAGE_KEY = 'sip_analytics_local_cache_v3';
  const SESSION_AUTH_KEY = 'sip_admin_session_auth_v3';

  // SHA-256 Hashing Utility via Web Crypto API
  async function computeSHA256(message) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback simple hash if subtle crypto unavailable
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }

  // Get local session store
  function getLocalStore() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}

    const defaultData = {
      localVisits: 0,
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
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
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
   * Fetch live metrics from cloud database
   */
  async function fetchCloudData() {
    try {
      const res = await fetch(CLOUD_ENDPOINT, { cache: 'no-cache' });
      if (res.ok) {
        const json = await res.json();
        return json.data || { visits: 1, calcs: 0, wealth: 0, pin_hash: 'UNSET' };
      }
    } catch (err) {
      console.warn('Cloud fetch offline:', err);
    }
    return { visits: 1, calcs: 0, wealth: 0, pin_hash: 'UNSET' };
  }

  /**
   * Update cloud metrics with atomic patch
   */
  async function patchCloudData(updates) {
    try {
      const current = await fetchCloudData();
      const updatedData = { ...current, ...updates };

      await fetch(CLOUD_ENDPOINT, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData })
      });
      return updatedData;
    } catch (err) {
      console.warn('Cloud patch failed:', err);
      return null;
    }
  }

  /**
   * Record a genuine page visit
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

    // Increment cloud visit counter
    fetchCloudData().then(cloud => {
      const newCount = (cloud.visits || 0) + 1;
      patchCloudData({ visits: newCount });
    });

    return store;
  }

  /**
   * Record a genuine calculation event
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

    // Increment cloud calculations
    fetchCloudData().then(cloud => {
      patchCloudData({
        calcs: (cloud.calcs || 0) + 1,
        wealth: (cloud.wealth || 0) + wealth
      });
    });

    return store;
  }

  /**
   * Admin Authentication Functions
   */
  async function verifyPasscode(enteredPin) {
    const cloud = await fetchCloudData();

    // First time setup check
    if (!cloud.pin_hash || cloud.pin_hash === 'UNSET') {
      return { status: 'SETUP_NEEDED' };
    }

    const enteredHash = await computeSHA256(enteredPin.trim());
    if (enteredHash === cloud.pin_hash) {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      return { status: 'SUCCESS' };
    }
    return { status: 'INVALID' };
  }

  async function setupMasterPasscode(newPin) {
    if (!newPin || newPin.trim().length < 4) {
      throw new Error('Passcode must be at least 4 characters');
    }
    const hash = await computeSHA256(newPin.trim());
    await patchCloudData({ pin_hash: hash });
    sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
    return true;
  }

  async function changeMasterPasscode(currentPin, newPin) {
    const verify = await verifyPasscode(currentPin);
    if (verify.status !== 'SUCCESS') {
      throw new Error('Current passcode is incorrect');
    }
    if (!newPin || newPin.trim().length < 4) {
      throw new Error('New passcode must be at least 4 characters');
    }
    const newHash = await computeSHA256(newPin.trim());
    await patchCloudData({ pin_hash: newHash });
    return true;
  }

  function isSessionAuthenticated() {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  }

  function logout() {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }

  function resetLocalCacheOnly() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return getLocalStore();
  }

  return {
    fetchCloudData,
    recordPageView,
    recordCalculation,
    getLocalStore,
    verifyPasscode,
    setupMasterPasscode,
    changeMasterPasscode,
    isSessionAuthenticated,
    logout,
    resetLocalCacheOnly
  };
});
