// Receives the /cleaning quote form (multipart, with optional photos),
// works out the estimate again on the server from cleaning-pricing.js,
// emails the office with the photos attached, and sends the client a
// "we got it" email. Uses the same Resend env vars as contact.js.
//
// Env:
//   RESEND_API_KEY, FROM_EMAIL, TO_EMAIL   (already set for the site)
//   CLEANING_TO_EMAIL   optional, sends cleaning leads to a different inbox
//   CLEANING_LEAD_WEBHOOK  optional, POSTs the lead as JSON (for the dashboard)

import { PRICING, estimate } from '../../cleaning-pricing.js';
import { repEmail } from '../lib/rep-email.js';

const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const money = n => '$' + Math.round(n).toLocaleString('en-US');

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export async function onRequestPost({ request, env }) {
  let form;
  try { form = await request.formData(); } catch { return json({ error: 'Could not read the form' }, 400); }

  // Honeypot: real people never fill this.
  if (form.get('company_site')) return json({ success: true });

  const g = k => String(form.get(k) ?? '').trim().slice(0, 2000);
  const all = k => form.getAll(k).map(v => String(v).trim()).filter(Boolean);

  const lead = {
    name: g('name'), email: g('email'), phone: g('phone'),
    address: g('address'), metro: g('metro'), city: g('city'), zip: g('zip'),
    service: g('service'), sqft: g('sqft'), bedrooms: g('bedrooms'), bathrooms: g('bathrooms'),
    soil: g('soil'), pets: g('pets'), products: g('products'), frequency: g('frequency'),
    surfaces: all('surfaces'), surfaceNotes: g('surface_notes'),
    style: g('style'), focus: g('focus'), sensitivities: g('sensitivities'),
    access: g('access'), parking: g('parking'),
    date: g('date'), time: g('time'), callTime: g('calltime'), heard: g('heard'), notes: g('notes'), maint: g('maint'),
    payment: g('payment'), homecare: all('homecare'),
    contactPref: g('contact_pref'),
    source: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term'].map(g).filter(Boolean).join(' / '),
    clickId: g('gclid') ? 'Google click' : g('fbclid') ? 'Meta click' : '', landing: g('landing'),
  };

  if (!lead.name || !lead.phone || !lead.email || !lead.service) {
    return json({ error: 'Please add your name, phone, email and the service you need.' }, 400);
  }

  let addons = {};
  try { addons = JSON.parse(g('addons') || '{}'); } catch {}
  const est = estimate({ ...lead, addons });

  // Photos
  const attachments = [];
  for (const f of form.getAll('photos').slice(0, MAX_PHOTOS)) {
    if (!f || typeof f === 'string' || !f.size || f.size > MAX_PHOTO_BYTES) continue;
    if (!/^image\//.test(f.type)) continue;
    attachments.push({ filename: (f.name || 'photo.jpg').replace(/[^\w.\-]/g, '_'), content: toBase64(await f.arrayBuffer()) });
  }

  const P = PRICING;
  const lbl = (group, key) => (P[group][key] && P[group][key].label) || key || '';
  const estLine = !est.ok ? 'No estimate (missing size)'
    : est.quoteOnly ? 'Quote after photos'
    : `${money(est.low)} to ${money(est.high)} (middle ${money(est.middle)}, about ${est.laborHours} cleaner hours${est.carpetQuote ? '; carpet NOT included, quote it' : ''})`;

  const addonText = est.addonLines && est.addonLines.length
    ? est.addonLines.map(a => `${esc(a.label)}${a.qty > 1 ? ' x' + a.qty : ''} (${a.quote ? 'quote for area' : money(a.amount)})`).join('<br>') : '';
  const origin = new URL(request.url).origin;
  const rows = [
    ['Service', esc(lbl('services', lead.service))],
    ['Reach them by', lead.contactPref ? '<strong>' + esc(lead.contactPref) + '</strong>' : ''],
    ['Area', esc(lead.metro)],
    ['Address', esc([lead.address, lead.city, lead.zip].filter(Boolean).join(', '))],
    ['Size', esc([lead.sqft && lead.sqft + ' sq ft', lead.bedrooms && lead.bedrooms + ' bed', lead.bathrooms && lead.bathrooms + ' bath'].filter(Boolean).join(' · '))],
    ['Condition', esc(lead.soil && lbl('soil', lead.soil))],
    ['Pets', esc(lead.pets && lbl('pets', lead.pets))],
    ['Products', esc(lead.products && lbl('products', lead.products))],
    ['Special surfaces', esc(lead.surfaces.join(', '))],
    ['Surface notes', esc(lead.surfaceNotes)],
    ['Home care wanted', lead.homecare.length ? '<strong>' + lead.homecare.map(esc).join('<br>') + '</strong><br><i>Send an itemized proposal. No price was shown online.</i>' : ''],
    ['Add ons chosen', addonText],
    ['How often', esc(lead.frequency && lbl('frequency', lead.frequency))],
    ['Work style', esc(lead.style)],
    ['Focus on', esc(lead.focus)],
    ['Allergies or scents', esc(lead.sensitivities)],
    ['Access', esc(lead.access)],
    ['Parking', esc(lead.parking)],
    ['Preferred date', esc([lead.date, lead.time].filter(Boolean).join(' · '))],
    ['Pays by', esc(lead.payment)],
    ['Heard about us', esc(lead.heard)],
    ['Ad source', esc([lead.source, lead.clickId, lead.landing].filter(Boolean).join(' · '))],
    ['Repairs wanted', lead.maint ? '<strong>' + esc(lead.maint) + '</strong>' : ''],
    ['Notes', esc(lead.notes).replace(/\n/g, '<br>')],
  ];
  const officeHtml = repEmail({ origin, source: 'website estimate', est, photos: attachments.length, rows,
    lead: { ...lead, serviceKey: lead.service, bedrooms: Number(lead.bedrooms) || 0, bathrooms: Number(lead.bathrooms) || 0, sqft: Number(lead.sqft) || 0, addonCounts: addons } });

  const send = body => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const office = await send({
    from: env.FROM_EMAIL,
    to: env.CLEANING_TO_EMAIL || env.TO_EMAIL,
    reply_to: lead.email,
    subject: `DRC Home Services lead: ${lead.name}, ${lbl('services', lead.service)}${lead.metro ? ', ' + lead.metro : lead.city ? ', ' + lead.city : ''}`,
    html: officeHtml,
    attachments: [...attachments, { filename: 'DRC-Home-Services-Cleaning-Price-Sheet.pdf', path: `${origin}/docs/drc-cleaning-price-sheet.pdf` }],
  });
  if (!office.ok) {
    const err = await office.text();
    return json({ success: false, error: 'We could not send your request. Please call or text us.', detail: err.slice(0, 300) }, 502);
  }

  // Client confirmation. A failure here doesn't fail the request.
  const clientEst = est.ok && !est.quoteOnly
    ? `<p>Your estimate: <strong>${money(est.low)} to ${money(est.high)}</strong>.</p>`
    : '';
  try {
    await send({
      from: env.FROM_EMAIL,
      to: lead.email,
      subject: 'We got your cleaning request',
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a14;line-height:1.6">
        <p>Hi ${esc(lead.name.split(' ')[0])},</p>
        <p>Thanks for reaching out to DRC Home Services. We received your request for a ${esc(lbl('services', lead.service).toLowerCase())}.</p>
        ${clientEst}
        ${lead.service === 'homecare'
          ? `<p>We've received your selections. A DRC home care specialist will review your needs and send you a personalized, itemized quote before scheduling.</p>`
          : `<p>Our team will reach out ${lead.contactPref === 'Email' ? 'by email' : lead.contactPref === 'Call' ? 'with a call at ' + esc(lead.phone) : 'with a text at ' + esc(lead.phone)} soon to confirm your price, answer any questions and confirm your schedule. Once you approve the price, we'll email a secure Square payment link, and your date is locked in when payment comes through.</p>`}
        <p>Talk soon,<br>DRC Home Services<br>Dedicated Resource Center LLC</p></div>`,
    });
  } catch {}

  if (env.CLEANING_LEAD_WEBHOOK) {
    try {
      await fetch(env.CLEANING_LEAD_WEBHOOK, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'drcmaintenance.com/cleaning', lead, addons, estimate: est, photos: attachments.length }),
      });
    } catch {}
  }

  return json({ success: true, estimate: est });
}
