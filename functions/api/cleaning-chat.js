// Website chat on /cleaning: emails the office a branded DRC Home Services lead
// with rep coaching (add ons, follow up questions, call script, calculator link).
// Uses the same Resend env vars as the other forms (RESEND_API_KEY, FROM_EMAIL, TO_EMAIL, CLEANING_TO_EMAIL).
import { repEmail, serviceKey, bedsFromText } from '../lib/rep-email.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  let d; try { d = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  const v = k => String(d[k] ?? '').trim().slice(0, 1000);
  const lead = { service: v('service'), size: v('size'), location: v('location'), notes: v('notes'), name: v('name'), email: v('email'), phone: v('phone'),
    addons: (Array.isArray(d.addons) ? d.addons : []).map(a => String(a).slice(0, 60)).slice(0, 6),
    smsOptIn: d.smsOptIn === true, callOk: d.callOk === true };
  if (!lead.name || !/^\S+@\S+\.\S+$/.test(lead.email)) return json({ error: 'Name and email needed' }, 400);
  lead.serviceKey = serviceKey(lead.service);
  if (!/sq ft/i.test(lead.size)) lead.bedrooms = bedsFromText(lead.size);

  const origin = new URL(request.url).origin;
  const rows = [
    ['Contact permission', `<strong>Text: ${lead.smsOptIn ? 'YES, opted in to quote and scheduling texts' : 'NO, do not text'}</strong><br><strong>Call: ${lead.callOk ? 'Yes' : 'No'}</strong>`],
    ['Cleaning', esc(lead.service)], ['Size', esc(lead.size)], ['City and state', esc(lead.location)],
    ['Their notes', esc(lead.notes)], ['Also wants quotes for', lead.addons.length ? '<strong>' + esc(lead.addons.join(', ')) + '</strong>' : ''],
  ];
  const html = repEmail({ origin, lead, rows, est: null, source: 'website chat' });
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: env.CLEANING_TO_EMAIL || env.TO_EMAIL, reply_to: lead.email,
      subject: `DRC Home Services lead: ${lead.name}, ${lead.service || 'cleaning'}${lead.location ? ', ' + lead.location : ''}`, html,
      attachments: [{ filename: 'DRC-Home-Services-Cleaning-Price-Sheet.pdf', path: `${origin}/docs/drc-cleaning-price-sheet.pdf` }] }),
  });
  if (!r.ok) return json({ error: 'Could not send' }, 502);
  return json({ success: true });
}
