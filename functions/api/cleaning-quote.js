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
    payment: g('payment'),
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
    : `${money(est.low)} to ${money(est.high)} (middle ${money(est.middle)}, about ${est.laborHours} cleaner-hours)`;

  const row = (k, v) => v ? `<tr><td style="padding:4px 12px 4px 0;color:#637085;vertical-align:top">${esc(k)}</td><td style="padding:4px 0">${v}</td></tr>` : '';
  const addonText = est.addonLines && est.addonLines.length
    ? est.addonLines.map(a => `${esc(a.label)}${a.qty > 1 ? ' x' + a.qty : ''} (${money(a.amount)})`).join('<br>') : '';

  const officeHtml = `
    <h2 style="font-family:Arial,sans-serif;color:#0E2240">New cleaning lead: call them</h2>
    <p style="font-family:Arial,sans-serif;font-size:18px"><strong>Call ${esc(lead.name)} at <a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a></strong>${lead.callTime ? ' (best time: ' + esc(lead.callTime) + ')' : ''}</p>
    <p style="font-family:Arial,sans-serif;font-size:16px"><strong>Estimate shown to client:</strong> ${esc(estLine)}</p>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      ${row('Name', esc(lead.name))}
      ${row('Phone', esc(lead.phone))}
      ${row('Email', esc(lead.email))}
      ${row('Area', esc(lead.metro))}
      ${row('Address', esc([lead.address, lead.city, lead.zip].filter(Boolean).join(', ')))}
      ${row('Service', esc(lbl('services', lead.service)))}
      ${row('Size', esc([lead.sqft && lead.sqft + ' sq ft', lead.bedrooms && lead.bedrooms + ' bed', lead.bathrooms && lead.bathrooms + ' bath'].filter(Boolean).join(' · ')))}
      ${row('Condition', esc(lbl('soil', lead.soil)))}
      ${row('Pets', esc(lbl('pets', lead.pets)))}
      ${row('Products', esc(lbl('products', lead.products)))}
      ${row('Special surfaces', esc(lead.surfaces.join(', ')))}
      ${row('Surface notes', esc(lead.surfaceNotes))}
      ${row('Add-ons', addonText)}
      ${row('How often', esc(lbl('frequency', lead.frequency)))}
      ${row('Work style', esc(lead.style))}
      ${row('Focus on', esc(lead.focus))}
      ${row('Allergies / scents', esc(lead.sensitivities))}
      ${row('Access', esc(lead.access))}
      ${row('Parking', esc(lead.parking))}
      ${row('Preferred date', esc([lead.date, lead.time].filter(Boolean).join(' · ')))}
      ${row('Best time to call', esc(lead.callTime))}
      ${row('Pays by', esc(lead.payment))}
      ${row('Heard about us', esc(lead.heard))}
      ${row('Repairs wanted', lead.maint ? '<strong>' + esc(lead.maint) + '</strong>' : '')}
      ${row('Notes', esc(lead.notes).replace(/\n/g, '<br>'))}
      ${row('Photos', attachments.length ? attachments.length + ' attached' : 'None')}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#637085">Next: call the client, confirm the price and date, send the Square link or Zelle details, then dispatch once paid.</p>`;

  const send = body => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const office = await send({
    from: env.FROM_EMAIL,
    to: env.CLEANING_TO_EMAIL || env.TO_EMAIL,
    reply_to: lead.email,
    subject: `Cleaning quote: ${lead.name}, ${lbl('services', lead.service)}${lead.metro ? ', ' + lead.metro : lead.city ? ', ' + lead.city : ''}`,
    html: officeHtml,
    attachments: attachments.length ? attachments : undefined,
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
        <p>Thanks for reaching out to DRC Cleaning. We received your request for a ${esc(lbl('services', lead.service).toLowerCase())}.</p>
        ${clientEst}
        <p>Someone from our team will call you at ${esc(lead.phone)} shortly to confirm your price, answer any questions and pick a date. Once you approve the price, we'll send a secure card link or Zelle details, and your date is locked in when payment comes through.</p>
        <p>Talk soon,<br>DRC Cleaning<br>Dedicated Resource Center LLC</p></div>`,
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
