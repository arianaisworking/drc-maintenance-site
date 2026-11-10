// Ad tracking for DRC Home Services pages (/cleaning and /home-cleaning).
//
// META PIXEL: paste the Pixel (Dataset) ID from Meta Events Manager between the quotes.
// While it is empty, nothing loads and nothing is tracked.
export const META_PIXEL_ID = '';

// Events sent:
//   PageView     when the page opens
//   ViewContent  the first time a visitor sees a price
//   Lead         when the estimate is sent (value = middle of the estimate, USD)
// Each Lead carries an eventID that is also sent with the lead, so a server side
// Conversions API event can be added later without double counting.

let ready = false;
export function initTracking() {
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
  try { if (window.fbq) window.fbq('track', event, data, eventID ? { eventID } : undefined); } catch {}
  try { window.gtag && event === 'Lead' && window.gtag('event', 'generate_lead', { value: data.value, currency: data.currency }); } catch {}
  try { window.dataLayer && window.dataLayer.push({ event: 'drc_' + event.toLowerCase(), ...data }); } catch {}
}

let viewed = false;
export function trackPriceSeen(data) { if (viewed) return; viewed = true; track('ViewContent', { content_name: 'Cleaning estimate', ...data }); }
