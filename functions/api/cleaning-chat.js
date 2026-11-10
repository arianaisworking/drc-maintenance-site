// Website chat on /cleaning: emails the office so someone can call or text the visitor back.
// Uses the same Resend env vars as the other forms (RESEND_API_KEY, FROM_EMAIL, TO_EMAIL, CLEANING_TO_EMAIL).
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  let d; try { d = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  const v = k => String(d[k] ?? '').trim().slice(0, 300);
  const lead = { topic: v('topic'), name: v('name'), phone: v('phone'), when: v('when') };
  if (!lead.name || lead.phone.replace(/\D/g, '').length < 10) return json({ error: 'Name and phone needed' }, 400);
  const text = lead.when === 'Text me instead';
  const html = `<h2 style="font-family:Arial,sans-serif;color:#0E2240">Website chat: ${text ? 'text' : 'call'} them</h2>
    <p style="font-family:Arial,sans-serif;font-size:18px"><strong>${text ? 'Text' : 'Call'} ${esc(lead.name)} at <a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a></strong> (${esc(lead.when || 'any time')})</p>
    <p style="font-family:Arial,sans-serif;font-size:15px">Wants: <strong>${esc(lead.topic || 'not said')}</strong></p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#637085">From the chat on drcmaintenance.com/cleaning</p>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: env.CLEANING_TO_EMAIL || env.TO_EMAIL, subject: `Chat lead: ${lead.name}, ${lead.topic || 'cleaning'} (${text ? 'text' : 'call'} ${lead.when || 'now'})`, html }),
  });
  if (!r.ok) return json({ error: 'Could not send' }, 502);
  return json({ success: true });
}
