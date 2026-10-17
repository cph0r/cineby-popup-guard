// Runs in the page's own JS world at document_start, in every frame
// (including the cross-origin video player iframe), before ad scripts load.
(() => {
  const PROTECTED = /(^|\.)cineby\./i;

  // Only act on cineby itself or on frames embedded inside a cineby page.
  const inScope = () => {
    if (PROTECTED.test(location.hostname)) return true;
    try {
      const a = location.ancestorOrigins || [];
      for (let i = 0; i < a.length; i++) {
        if (PROTECTED.test(new URL(a[i]).hostname)) return true;
      }
    } catch {}
    return false;
  };
  if (!inScope()) return;

  const log = (what, url) => console.debug('[popup-guard] blocked', what, url || '');

  const isForeign = (href) => {
    try {
      const u = new URL(href, location.href);
      if (!/^https?:$/.test(u.protocol)) return false;
      return !PROTECTED.test(u.hostname) && u.hostname !== location.hostname;
    } catch {
      return false;
    }
  };

  const opensNewContext = (el) => {
    const t = (el.getAttribute('target') || '').toLowerCase();
    return t && t !== '_self' && t !== '_top' && t !== '_parent';
  };

  // 1. Neuter window.open. Return a fake window so ad scripts don't retry or throw.
  const fakeWindow = () => {
    const w = {
      closed: false,
      opener: null,
      focus() {}, blur() {}, postMessage() {},
      close() { this.closed = true; },
      location: { href: '', assign() {}, replace() {}, reload() {} },
      document: { write() {}, writeln() {}, open() {}, close() {}, body: null },
    };
    w.window = w.self = w;
    return w;
  };
  const blockedOpen = function open(url) {
    log('window.open', url);
    return fakeWindow();
  };
  try {
    Object.defineProperty(window, 'open', { value: blockedOpen, writable: false, configurable: false });
  } catch {
    window.open = blockedOpen;
  }

  // 2. Block clicks on foreign links that open a new tab (real or synthetic).
  const guardClick = (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (a && isForeign(a.href) && (opensNewContext(a) || e.ctrlKey || e.metaKey || e.button === 1)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      log('link', a.href);
    }
  };
  window.addEventListener('click', guardClick, true);
  window.addEventListener('auxclick', guardClick, true);

  const origClick = HTMLElement.prototype.click;
  HTMLElement.prototype.click = function () {
    if (this instanceof HTMLAnchorElement && isForeign(this.href) && opensNewContext(this)) {
      log('a.click()', this.href);
      return;
    }
    return origClick.call(this);
  };

  const origDispatch = EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent = function (ev) {
    if (this instanceof HTMLAnchorElement && ev instanceof MouseEvent && ev.type === 'click' &&
        isForeign(this.href) && opensNewContext(this)) {
      log('dispatchEvent(click)', this.href);
      return false;
    }
    return origDispatch.call(this, ev);
  };

  const origSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () {
    if (opensNewContext(this) && isForeign(this.action)) {
      log('form.submit()', this.action);
      return;
    }
    return origSubmit.call(this);
  };

  // 3. Remove invisible full-screen click-jacking overlays that wrap ad links.
  const isAdOverlay = (el) => {
    if (!(el instanceof HTMLElement) || el.tagName === 'VIDEO' || el.tagName === 'IFRAME') return false;
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'absolute') return false;
    if ((parseInt(cs.zIndex, 10) || 0) < 1000) return false;
    const r = el.getBoundingClientRect();
    if (r.width * r.height < innerWidth * innerHeight * 0.5) return false;
    const link = el.tagName === 'A' ? el : el.querySelector('a[href]');
    const transparent = parseFloat(cs.opacity) < 0.1 ||
      (cs.backgroundColor === 'rgba(0, 0, 0, 0)' && !el.textContent.trim() && !el.querySelector('img,video,svg,button'));
    return (link && isForeign(link.href)) || (transparent && el.children.length === 0);
  };

  let scheduled = false;
  const sweep = () => {
    scheduled = false;
    if (!document.body) return;
    for (const el of document.body.querySelectorAll('body > div, body > a, body > iframe ~ div')) {
      if (isAdOverlay(el)) {
        log('overlay', el.outerHTML.slice(0, 120));
        el.remove();
      }
    }
  };
  new MutationObserver(() => {
    if (!scheduled) {
      scheduled = true;
      setTimeout(sweep, 50);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
