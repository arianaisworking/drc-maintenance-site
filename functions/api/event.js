// /api/event: our own record of site visits and leads, kept in the
// drc-site-events D1 database (binding SITE_EVENTS). The DRC Home Services
// dashboard reads it on the Meta ads tab, so counts show up without needing
// Meta's permission to read pixel stats back.
//
// Stores only: event name, page path, ad source, a random visitor id kept in
// the visitor's browser, the estimate value on a Lead and the Lead's eventID.
// No names, emails, phone numbers or IP addresses.
//
// Handles every method so this path never falls through to an HTML page.

const ALLOWED = new Set(['PageView', 'ViewContent', 'Lead']);
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime/i;
const ok = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
const clip = (v, n) => (v == null ? null : String(v).slice(0, n) || null);

const chicagoDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });

function fromAd(source) {
  const s = (source || '').toLowerCase();
  return /fbclid|facebook|meta|instagram|\bfb\b|\big\b/.test(s) ? 1 : 0;
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response('POST only', { status: 405 });
  if (!env.SITE_EVENTS) return ok();
  if (BOT.test(request.headers.get('user-agent') || '')) return ok();

  // Only our own pages may write here.
  const origin = request.headers.get('origin') || '';
  const host = new URL(request.url).host;
  if (origin && new URL(origin).host !== host) return new Response('Forbidden', { status: 403 });

  let d;
  try { d = JSON.parse(await request.text()); } catch { return ok(); }
  if (!d || !ALLOWED.has(d.event)) return ok();

  let page = null;
  try { page = new URL(d.page || '/', 'https://x').pathname.replace(/\.html$/, '') || '/'; } catch {}
  const source = clip(d.source, 120);
  const value = Number.isFinite(Number(d.value)) && d.event === 'Lead' ? Number(d.value) : null;

  try {
    await env.SITE_EVENTS.prepare(
      'INSERT OR IGNORE INTO site_events (day, event, page, source, from_ad, value, event_id, visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(chicagoDay(), d.event, clip(page, 200), source, fromAd(source), value, clip(d.eventId, 80), clip(d.visitor, 40)).run();
  } catch {}
  return ok();
}
