// Backstop for anything the in-page guard misses: closes ad tabs spawned from a
// cineby tab and undoes "tab-under" redirects of the cineby tab itself.
const PROTECTED = /(^|\.)cineby\./i;

const isProtected = (url) => {
  try {
    return PROTECTED.test(new URL(url).hostname);
  } catch {
    return false;
  }
};
const isInternal = (url) => !url || /^(chrome|edge|about:newtab|chrome-search)/.test(url);

const counts = new Map();
const bump = (tabId) => {
  const n = (counts.get(tabId) || 0) + 1;
  counts.set(tabId, n);
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#c62828' }).catch(() => {});
  chrome.action.setBadgeText({ tabId, text: String(n) }).catch(() => {});
};

const sourceIsProtected = async (tabId) => {
  if (tabId == null) return false;
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  return !!tab && isProtected(tab.url);
};

// New tab/window opened by a cineby tab (window.open, target=_blank, etc.)
chrome.webNavigation.onCreatedNavigationTarget.addListener(async ({ sourceTabId, tabId, url }) => {
  if (!(await sourceIsProtected(sourceTabId))) return;
  if (isProtected(url)) return;
  console.log('[popup-guard] closed popup tab', url);
  chrome.tabs.remove(tabId).catch(() => {});
  bump(sourceTabId);
});

// Fallback for popups that don't fire onCreatedNavigationTarget.
chrome.tabs.onCreated.addListener(async (tab) => {
  const url = tab.pendingUrl || tab.url;
  if (isInternal(url) || isProtected(url)) return;
  if (!(await sourceIsProtected(tab.openerTabId))) return;
  console.log('[popup-guard] closed opener tab', url);
  chrome.tabs.remove(tab.id).catch(() => {});
  bump(tab.openerTabId);
});

// Tab-under: the cineby tab itself gets redirected to an ad site.
chrome.webNavigation.onBeforeNavigate.addListener(async ({ tabId, frameId, url }) => {
  if (frameId !== 0 || isProtected(url) || !/^https?:/.test(url)) return;
  if (await sourceIsProtected(tabId)) {
    await chrome.storage.session.set({ [`pending:${tabId}`]: url });
  }
});

const USER_TRANSITIONS = new Set(['typed', 'auto_bookmark', 'generated', 'keyword', 'reload', 'start_page']);

chrome.webNavigation.onCommitted.addListener(async ({ tabId, frameId, url, transitionType, transitionQualifiers }) => {
  if (frameId !== 0) return;
  const key = `pending:${tabId}`;
  const { [key]: pending } = await chrome.storage.session.get(key);
  if (!pending) return;
  await chrome.storage.session.remove(key);
  if (isProtected(url)) return;
  if (USER_TRANSITIONS.has(transitionType) || transitionQualifiers.includes('from_address_bar')) return;
  if (transitionQualifiers.includes('forward_back')) return;
  console.log('[popup-guard] reverted tab-under redirect', url);
  chrome.tabs.goBack(tabId).catch(() => {});
  bump(tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  counts.delete(tabId);
  chrome.storage.session.remove(`pending:${tabId}`).catch(() => {});
});
