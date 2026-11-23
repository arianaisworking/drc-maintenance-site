// Meta Pixel and ad tracking for drcmaintenance.com. Every customer facing page loads it.
//
// META PIXEL: paste the Pixel (Dataset) ID from Meta Events Manager between the quotes.
// While it is empty, nothing loads and nothing is tracked.
export const META_PIXEL_ID = '933114496428546';

// Events sent:
//   PageView     when the page opens
//   ViewContent  the first time a visitor sees a price
//   Lead         when the estimate is sent (value = middle of the estimate, USD)
// Each Lead carries an eventID that is also sent with the lead, so a server side
// Conversions API event can be added later without double counting.

// OUR OWN LOG: every event above is also sent to /api/event, which stores it in
// our own database (no names, emails or phone numbers) so the DRC Home Services
// dashboard can count visits and leads without asking Meta.
function adSource() {
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('drc_utm') || '{}'); } catch {}
  try {
    const q = new URLSearchParams(location.search);
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'gclid', 'fbclid']) if (q.get(k)) saved[k] = q.get(k).slice(0, 200);
    sessionStorage.setItem('drc_utm', JSON.stringify(saved));
  } catch {}
  if (saved.fbclid) return 'fbclid' + (saved.utm_campaign ? ' ' + saved.utm_campaign : '');
  if (saved.gclid) return 'google ad';
  return saved.utm_source ? [saved.utm_source, saved.utm_campaign].filter(Boolean).join(' ') : '';
}
function visitorId() {
  try {
    let v = localStorage.getItem('drc_vid');
    if (!v) { v = Math.random().toString(36).slice(2, 12); localStorage.setItem('drc_vid', v); }
    return v;
  } catch { return ''; }
}
function logEvent(event, data = {}, eventID) {
  try {
    const body = JSON.stringify({ event, page: location.pathname, source: adSource(), visitor: visitorId(), value: data.value, eventId: eventID || '' });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/event', new Blob([body], { type: 'text/plain' }));
    else fetch('/api/event', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {}
}

let ready = false;
let logged = false;
export function initTracking() {
  if (!logged) { logged = true; logEvent('PageView'); }
  if (!META_PIXEL_ID || ready) return;
  ready = true;
  /* Meta Pixel base code */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

export const newEventId = () => 'lead_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

export function track(event, data = {}, eventID) {
  logEvent(event, data, eventID);
  try { if (window.fbq) window.fbq('track', event, data, eventID ? { eventID } : undefined); } catch {}
  try { window.gtag && event === 'Lead' && window.gtag('event', 'generate_lead', { value: data.value, currency: data.currency }); } catch {}
  try { window.dataLayer && window.dataLayer.push({ event: 'drc_' + event.toLowerCase(), ...data }); } catch {}
}

let viewed = false;
export function trackPriceSeen(data) { if (viewed) return; viewed = true; track('ViewContent', { content_name: 'Cleaning estimate', ...data }); }
