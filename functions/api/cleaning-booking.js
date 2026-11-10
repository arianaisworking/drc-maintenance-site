// Booking agreements for DRC Home Services cleaning.
// The rep creates a signed link in /cleaning-rep; the customer opens /cleaning-book,
// reviews the price and terms, types their name to sign, then pays.
// The link is signed (HMAC) so the customer can't change the price or details.
// Env: RESEND_API_KEY, FROM_EMAIL, TO_EMAIL, CLEANING_TO_EMAIL (optional),
//      BOOKING_SECRET (optional; falls back to RESEND_API_KEY as the signing key).

const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = obj => b64u(new TextEncoder().encode(JSON.stringify(obj)));
const dec = str => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))));

async function hmac(env, data) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.BOOKING_SECRET || env.RESEND_API_KEY || 'drc'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}
async function verify(env, b, s) {
  if (!b || !s) return null;
  if (await hmac(env, b) !== s) return null;
  try { return dec(b); } catch { return null; }
}
const clean = (v, n = 400) => String(v ?? '').trim().slice(0, n);
const money = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const send = (env, body) => fetch('https://api.resend.com/emails', {
  method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

function summaryHtml(origin, bk, signed) {
  const green = '#2E6B3E', muted = '#5F6B64';
  const tr = (k, v) => v ? `<tr><td style="padding:6px 14px 6px 0;color:${muted};vertical-align:top">${esc(k)}</td><td style="padding:6px 0">${v}</td></tr>` : '';
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;color:#1F2A24">
  <div style="background:${green};border-radius:14px 14px 0 0;padding:18px 24px"><img src="${origin}/img/drc-logo.png" alt="DRC" height="40" style="height:40px;background:#fff;border-radius:6px;padding:4px;vertical-align:middle"> <span style="color:#fff;font-weight:700;letter-spacing:.08em;font-size:18px;vertical-align:middle;margin-left:10px">DRC HOME SERVICES</span></div>
  <div style="border:1px solid #E6E0D4;border-top:none;border-radius:0 0 14px 14px;padding:22px 24px;background:#fff">
  <table style="font-size:14px;border-collapse:collapse">
    ${tr('Customer', esc(bk.name))}${tr('Phone', esc(bk.phone))}${tr('Email', esc(bk.email))}${tr('Address', esc(bk.address))}
    ${tr('Service', esc(bk.service))}${tr('Includes', esc(bk.includes).replace(/\n/g, '<br>'))}${tr('Date', esc([bk.date, bk.window].filter(Boolean).join(', ')))}
    ${tr('Price', `<b>${money(bk.price)}</b>`)}${tr('Agreement number', esc(bk.id))}
    ${signed ? tr('Signed by', `${esc(signed.signer)} on ${esc(signed.at)}`) : ''}
  </table></div></div>`;
}

export async function onRequestPost({ request, env }) {
  let d; try { d = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  const origin = new URL(request.url).origin;

  if (d.action === 'create') {
    const x = d.booking || {};
    const bk = {
      id: 'DRC-' + Date.now().toString(36).toUpperCase().slice(-6),
      name: clean(x.name, 120), email: clean(x.email, 160), phone: clean(x.phone, 40), address: clean(x.address, 240),
      service: clean(x.service, 120), includes: clean(x.includes, 900), date: clean(x.date, 40), window: clean(x.window, 60),
      price: Math.max(0, Math.round(Number(x.price) * 100) / 100), pay: clean(x.pay, 500), created: new Date().toISOString(),
    };
    if (!bk.name || !bk.service || !bk.price) return json({ error: 'Name, service and price are needed' }, 400);
    if (bk.pay && !/^https:\/\//i.test(bk.pay)) return json({ error: 'The payment link must start with https://' }, 400);
    const b = enc(bk), s = await hmac(env, b);
    return json({ success: true, id: bk.id, url: `${origin}/cleaning-book?b=${b}&s=${s}` });
  }

  const bk = await verify(env, d.b, d.s);
  if (!bk) return json({ error: 'This agreement link is not valid. Please ask DRC Home Services for a new one.' }, 400);

  if (d.action === 'verify') return json({ success: true, booking: bk });

  if (d.action === 'sign') {
    const signer = clean(d.signer, 120);
    if (!signer || !d.agree) return json({ error: 'Please type your full name and agree to the terms.' }, 400);
    const signed = { signer, at: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' }) + ' CT', ip: request.headers.get('CF-Connecting-IP') || '' };
    const office = await send(env, {
      from: env.FROM_EMAIL, to: env.CLEANING_TO_EMAIL || env.TO_EMAIL, reply_to: bk.email || undefined,
      subject: `Signed agreement ${bk.id}: ${bk.name}, ${money(bk.price)}. Lock the date once paid`,
      html: `<p style="font-family:Arial,sans-serif;font-size:16px"><b>${esc(bk.name)} signed the cleaning agreement.</b> Check that payment of ${money(bk.price)} came through, then lock in ${esc(bk.date || 'their date')} and reply to confirm.</p>${summaryHtml(origin, bk, signed)}<p style="font-family:Arial,sans-serif;font-size:12px;color:#5F6B64">Signed from IP ${esc(signed.ip)}. Terms agreed: date locked once payment is confirmed; all payments are non refundable.</p>`,
    });
    if (!office.ok) return json({ error: 'We could not save your signature. Please try again.' }, 502);
    if (bk.email) {
      try {
        await send(env, {
          from: env.FROM_EMAIL, to: bk.email, subject: `Your DRC Home Services agreement ${bk.id}`,
          html: `<p style="font-family:Arial,sans-serif;font-size:15px">Hi ${esc(bk.name.split(' ')[0])}, thank you! Here is a copy of your signed agreement.${bk.pay ? ` If you haven't paid yet, you can pay here: <a href="${esc(bk.pay)}">secure payment link</a>.` : ' We will send you a secure payment link.'} Your date is locked in as soon as your payment is confirmed. All payments are non refundable.</p>${summaryHtml(origin, bk, signed)}`,
        });
      } catch {}
    }
    return json({ success: true, pay: bk.pay || '' });
  }
  return json({ error: 'Unknown action' }, 400);
}
