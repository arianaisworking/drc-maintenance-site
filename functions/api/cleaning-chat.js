// Website chat on /cleaning: emails the office the intake so someone can reach out.
// Uses the same Resend env vars as the other forms (RESEND_API_KEY, FROM_EMAIL, TO_EMAIL, CLEANING_TO_EMAIL).
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  let d; try { d = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  const v = k => String(d[k] ?? '').trim().slice(0, 1000);
  const lead = { service: v('service'), size: v('size'), location: v('location'), notes: v('notes'), name: v('name'), email: v('email'), phone: v('phone'),
    addons: (Array.isArray(d.addons) ? d.addons : []).map(a => String(a).slice(0, 60)).slice(0, 6) };
  if (!lead.name || !/^\S+@\S+\.\S+$/.test(lead.email)) return json({ error: 'Name and email needed' }, 400);
  const row = (k, val) => val ? `<tr><td style="padding:4px 12px 4px 0;color:#637085">${k}</td><td style="padding:4px 0">${val}</td></tr>` : '';
  const html = `<h2 style="font-family:Arial,sans-serif;color:#0E2240">Website chat: new cleaning lead</h2>
    <p style="font-family:Arial,sans-serif;font-size:18px"><strong>${esc(lead.name)}</strong> ${lead.phone ? `<a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a> · ` : ''}<a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a></p>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      ${row('Cleaning', esc(lead.service))}${row('Size', esc(lead.size))}${row('City / state', esc(lead.location))}
      ${row('Notes', esc(lead.notes))}${row('Add ons wanted', lead.addons.length ? '<strong>' + esc(lead.addons.join(', ')) + '</strong>' : '')}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#637085">From the chat on drcmaintenance.com/cleaning. Reach out, confirm the price and book.</p>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: env.CLEANING_TO_EMAIL || env.TO_EMAIL, reply_to: lead.email,
      subject: `Chat lead: ${lead.name}, ${lead.service || 'cleaning'}${lead.location ? ', ' + lead.location : ''}`, html }),
  });
  if (!r.ok) return json({ error: 'Could not send' }, 502);
  return json({ success: true });
}
