// Builds the branded DRC Home Services lead email the office rep reads.
// Used by /api/cleaning-quote (full estimate form) and /api/cleaning-chat (website chat).
// It gives the rep everything for the call: the lead's details, add ons worth offering,
// follow up questions, a short call script, the price sheet and a prefilled calculator link.

import { PRICING, estimate } from '../../cleaning-pricing.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const A = PRICING.addons;

// Chat answers use plain words; map them to the pricing keys.
const SERVICE_FROM_TEXT = {
  'regular clean': 'standard', 'deep clean': 'deep', 'move in or move out': 'move', 'airbnb turnover': 'rental',
  'carpet cleaning': 'carpet', 'hoarder or debris cleanout': 'hoarder', 'office or business': 'commercial',
};
export const serviceKey = v => PRICING.services[v] ? v : (SERVICE_FROM_TEXT[String(v || '').toLowerCase()] || '');
export const bedsFromText = v => { const m = String(v || '').match(/(\d+)/); return m ? Number(m[1]) : (/studio/i.test(v) ? 1 : 0); };

const label = k => (PRICING.services[k] && PRICING.services[k].label) || 'Cleaning';

// What to offer, based on what they asked for.
export function suggestions(lead) {
  const s = lead.serviceKey, n = `${lead.notes || ''} ${lead.surfaceNotes || ''} ${lead.focus || ''}`.toLowerCase();
  const picked = (lead.addons || []).map(a => String(a).toLowerCase());
  const has = k => lead.addonCounts && lead.addonCounts[k] > 0;
  const out = [];
  const add = (title, why) => { if (!out.find(o => o.title === title)) out.push({ title, why }); };
  const once = !lead.frequency || lead.frequency === 'once';
  const F = PRICING.frequency;

  if (['standard', 'rental', 'student'].includes(s) && once) add(`Membership, every 2 weeks (save $${F.biweekly.off} a visit)`, 'Same team every visit and priority booking. Offer weekly or monthly too.');
  if (s === 'standard' && once) add('Deep clean for the first visit', 'If it has been a while since a professional clean, start deep, then keep it up with a membership.');
  if (['deep', 'move'].includes(s)) {
    if (!has('fridge')) add(`Inside fridge (+$${A.fridge.add})`, 'Most deep and move out clients want it.');
    if (!has('oven')) add(`Inside oven (+$${A.oven.add})`, 'Pairs with the fridge.');
    if (!has('cabinets')) add(`Inside cabinets and drawers (+$${A.cabinets.add})`, 'Key for move outs and new homes.');
  }
  if (s === 'move') {
    if (!has('windows')) add(`Interior windows and tracks (+$${A.windows.add})`, 'Landlords check these at move out.');
    if (!has('garage')) add(`Garage sweep out (+$${A.garage.add})`, 'Often part of the deposit checklist.');
  }
  if (/\b(dog|dogs|cat|cats|pet|pets|shed)/.test(n)) {
    add('Carpet or rug cleaning (quote for their area)', 'They mentioned pets. Pet hair and odor live in carpet.');
    if (!has('baseboards')) add(`Hand wiped baseboards (+$${A.baseboards.add})`, 'Pet hair collects along baseboards.');
  }
  if (/organic|allerg|unscent|fragrance|sensitiv|natural/.test(n) && lead.products !== 'organic') add(`Organic, unscented products (+$${PRICING.products.organic.add})`, 'They mentioned allergies or natural products.');
  if (s === 'rental' && !has('laundry')) add(`Laundry, wash and fold (+$${A.laundry.add} per load)`, 'Turnovers usually need linens done.');
  if (['standard', 'deep', 'move'].includes(s) && (lead.bedrooms >= 3) && !has('carpetRoom') && !/carpet/.test(n)) add('Carpet cleaning (quote for their area)', 'Larger homes often have carpeted bedrooms.');
  if (picked.some(a => /organization/.test(a))) add('Organization specialist (closets, pantry)', 'They asked for it. Ask for photos and quote by the job.');
  if (picked.some(a => /maintenance|handyman/.test(a)) || lead.maint) add('DRC Maintenance repair quote', `They asked about repairs${lead.maint ? ': ' + lead.maint : ''}. Ask for photos and pass to DRC Maintenance.`);
  if (picked.some(a => /landscap/.test(a))) add('Landscaping quote', 'They asked about yard work. Ask for photos of the yard.');
  return out.slice(0, 6);
}

export function followUps(lead) {
  const q = [];
  const s = lead.serviceKey;
  if (['hoarder', 'commercial'].includes(s)) q.push('Can you text photos or a short video of each area?');
  if (!lead.sqft && !['carpet', 'hoarder', 'commercial'].includes(s)) q.push('About how many square feet is the home?');
  if (!lead.bathrooms && !['carpet', 'commercial'].includes(s)) q.push('How many bathrooms?');
  if (s === 'carpet') q.push('How many rooms of carpet, any stairs, and any area rugs?');
  q.push('When was it last professionally cleaned?');
  const nn = `${lead.notes || ''}`.toLowerCase();
  if (!lead.pets && !/\b(dog|cat|pet)/.test(nn)) q.push('Any pets? How many?');
  q.push('Which rooms matter most to you?');
  if (!lead.products && !/organic|unscent|product|supplies/.test(nn)) q.push('Should we bring our products, or do you prefer organic or your own?');
  q.push('Will you be home, or how will we get in? Is there parking?');
  if (!lead.frequency || lead.frequency === 'once') q.push('Is this a one time clean, or would you like it every week, every 2 weeks or monthly?');
  q.push('What day and time works best?');
  return q.slice(0, 8);
}

export function callScript(lead, est, top) {
  const first = esc((lead.name || 'there').split(' ')[0]);
  const svc = esc(label(lead.serviceKey).toLowerCase());
  const size = lead.bedrooms ? ` for your ${lead.bedrooms} bedroom home` : lead.size ? ` for your ${esc(lead.size)} space` : '';
  const where = lead.location || lead.metro || lead.city ? ` in ${esc(lead.location || lead.city || lead.metro)}` : '';
  const price = est && est.ok && !est.quoteOnly ? `about ${money(est.low)} to ${money(est.high)}` : '[price from the calculator]';
  return [
    `"Hi ${first}, this is [your name] with DRC Home Services. You asked about a ${svc}${size}${where}. Do you have two minutes so I can confirm your price?"`,
    'Ask the follow up questions below, then run the calculator.',
    `"Based on that, your ${svc} comes to ${price}."${top ? ` "A lot of clients also add ${esc(top.title.replace(/\s*\(.*\)$/, '').toLowerCase())}. Want me to include it?"` : ''}`,
    '"To lock in your date, I\'ll send you a short agreement to sign and a secure payment link. Once your payment comes through, your date is locked in. Just so you know, payments are non refundable."',
    '"What day works best for you?"',
  ];
}

export function calculatorLink(origin, lead) {
  const p = new URLSearchParams();
  const set = (k, v) => { if (v !== undefined && v !== null && String(v) !== '') p.set(k, String(v)); };
  set('service', lead.serviceKey); set('bedrooms', lead.bedrooms); set('bathrooms', lead.bathrooms); set('sqft', lead.sqft);
  set('soil', lead.soil); set('pets', lead.pets); set('products', lead.products); set('frequency', lead.frequency);
  set('name', lead.name); set('email', lead.email); set('phone', lead.phone);
  set('address', [lead.address, lead.city || lead.location].filter(Boolean).join(', '));
  if (lead.addonCounts) set('addons', JSON.stringify(lead.addonCounts));
  set('pref', [lead.date, lead.time].filter(Boolean).join(', '));
  const info = [lead.surfaces && lead.surfaces.length ? 'Surfaces: ' + lead.surfaces.join(', ') : '', lead.surfaceNotes, lead.focus && 'Focus: ' + lead.focus,
    lead.sensitivities && 'Allergies or scents: ' + lead.sensitivities, lead.access && 'Access: ' + lead.access, lead.parking && 'Parking: ' + lead.parking,
    lead.style && 'Style: ' + lead.style, lead.notes].filter(Boolean).join('. ');
  set('info', info.slice(0, 600));
  return `${origin}/cleaning-rep?${p.toString()}`;
}

// Main builder. rows = [[label, html]] of lead details. est = estimate result or null.
export function repEmail({ origin, lead, rows, est, source, photos }) {
  const sug = suggestions(lead);
  const qs = followUps(lead);
  const script = callScript(lead, est, sug[0]);
  const calc = calculatorLink(origin, lead);
  const logo = `${origin}/img/drc-logo.png`;
  const green = '#2E6B3E', ink = '#1F2A24', muted = '#5F6B64', line = '#E6E0D4', cream = '#FBF6EE';
  const estHtml = est && est.ok && !est.quoteOnly
    ? `<p style="margin:0;font-size:26px;font-weight:700;color:${green}">${money(est.low)} to ${money(est.high)}</p><p style="margin:4px 0 0;font-size:13px;color:${muted}">About ${est.laborHours} cleaner hours${est.carpetQuote ? '. Carpet NOT included: quote it for their area.' : ''}. Cleaner pay at $25/hr: about ${money(est.laborHours * 25)}.</p>`
    : est && est.quoteOnly
      ? `<p style="margin:0;font-size:20px;font-weight:700;color:${green}">Custom quote needed</p><p style="margin:4px 0 0;font-size:13px;color:${muted}">${esc(label(lead.serviceKey))}. Ask for photos, then price it in the calculator.</p>`
      : `<p style="margin:0;font-size:18px;font-weight:700;color:${green}">Not priced yet</p><p style="margin:4px 0 0;font-size:13px;color:${muted}">Came from the chat. Ask the questions below, then run the calculator.</p>`;
  const tr = (k, v) => v ? `<tr><td style="padding:7px 14px 7px 0;color:${muted};vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:7px 0;color:${ink}">${v}</td></tr>` : '';
  const btn = (href, text, solid) => `<a href="${href}" style="display:inline-block;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;text-decoration:none;${solid ? `background:${green};color:#fff` : `border:1.5px solid ${green};color:${green}`}">${text}</a>`;
  const card = (title, inner) => `<tr><td style="padding:0 28px 22px"><div style="background:#fff;border:1px solid ${line};border-radius:14px;padding:20px 22px"><p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${green}">${title}</p>${inner}</div></td></tr>`;
  const contact = [lead.phone && `<a href="tel:${esc(lead.phone)}" style="color:${green};font-weight:700">${esc(lead.phone)}</a>`, lead.email && `<a href="mailto:${esc(lead.email)}" style="color:${green}">${esc(lead.email)}</a>`].filter(Boolean).join(' &nbsp;·&nbsp; ');

  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:${cream};font-family:Arial,Helvetica,sans-serif;color:${ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cream}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:${cream}">
<tr><td style="background:${green};border-radius:16px 16px 0 0;padding:20px 28px">
  <table role="presentation" width="100%"><tr>
    <td style="vertical-align:middle"><img src="${logo}" alt="DRC" height="44" style="display:block;height:44px;background:#fff;border-radius:6px;padding:4px"></td>
    <td style="vertical-align:middle;text-align:right"><p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:.08em">DRC HOME SERVICES</p><p style="margin:2px 0 0;color:#D8EAD9;font-size:13px">New cleaning lead · ${esc(source)}</p></td>
  </tr></table>
</td></tr>
<tr><td style="background:#fff;padding:24px 28px 20px;border-left:1px solid ${line};border-right:1px solid ${line}">
  <p style="margin:0 0 4px;font-size:13px;color:${muted}">Call or text</p>
  <p style="margin:0 0 6px;font-size:24px;font-weight:700">${esc(lead.name || 'New lead')}</p>
  <p style="margin:0 0 16px;font-size:15px">${contact}${lead.callTime ? ` &nbsp;·&nbsp; best time: ${esc(lead.callTime)}` : ''}</p>
  ${estHtml}
  <p style="margin:18px 0 0">${btn(calc, 'Open pricing calculator', true)} &nbsp; ${btn(`${origin}/docs/drc-cleaning-price-sheet.pdf`, 'Price sheet', false)}</p>
</td></tr>
<tr><td style="height:22px;background:${cream}"></td></tr>
${card('Lead details', `<table role="presentation" style="font-size:14px;border-collapse:collapse">${rows.map(([k, v]) => tr(k, v)).join('')}${photos ? tr('Photos', `${photos} attached`) : ''}</table>`)}
${sug.length ? card('Add ons to offer', sug.map(s => `<p style="margin:0 0 10px;font-size:14px"><b>${esc(s.title)}</b><br><span style="color:${muted}">${esc(s.why)}</span></p>`).join('')) : ''}
${card('Follow up questions', `<ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7">${qs.map(q => `<li>${esc(q)}</li>`).join('')}</ol>`)}
${card('Quick call script', script.map((l, i) => `<p style="margin:0 0 10px;font-size:14px;line-height:1.55;${i % 2 ? `color:${muted}` : ''}">${l}</p>`).join(''))}
${card('Next steps', `<ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7"><li>Call within 15 minutes if you can.</li><li>Confirm details and price in the calculator.</li><li>In the calculator, add your name as the rep, create the agreement link and send it to the customer.</li><li>When the signed agreement email arrives and payment shows up, lock in their date and reply to confirm.</li></ol><p style="margin:12px 0 0;font-size:13px;color:${muted}">All payments are non refundable. The date is not held until payment is confirmed.</p>`)}
<tr><td style="padding:4px 28px 28px;font-size:12px;color:${muted};text-align:center">DRC Home Services · Dedicated Resource Center LLC · Internal, do not forward to the customer</td></tr>
</table></td></tr></table></body></html>`;
}
