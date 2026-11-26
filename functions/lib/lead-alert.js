// Instant "call now" alert for every new lead. Sends one short email through
// Resend (the same key the forms already use) so the phone's mail app pushes
// it within seconds. It comes from a separate alerts@ address on the site's
// domain, because a phone mail app stays quiet for mail from yourself.
// Goes to LEAD_ALERT_EMAIL if set, otherwise to TO_EMAIL.
// Never throws: a failed alert must not fail the customer's form.

const clean = s => String(s ?? '').replace(/[<>&]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);

function alertFrom(env) {
  const m = String(env.FROM_EMAIL || '').match(/@([A-Za-z0-9.-]+)/);
  return m ? `DRC Lead Alert <alerts@${m[1]}>` : env.FROM_EMAIL;
}

export async function sendLeadAlert(env, { source, name, phone, email, service, where, note }) {
  const to = env && (env.LEAD_ALERT_EMAIL || env.TO_EMAIL);
  if (!to || !env.RESEND_API_KEY) return false;
  const who = clean(name) || 'No name';
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  const lines = [
    ['Name', who], ['Phone', clean(phone) || 'none given'], ['Email', clean(email)],
    ['Wants', clean(service)], ['Where', clean(where)], ['Came from', clean(source)], ['Note', clean(note)],
  ].filter(([, v]) => v);
  const html = `<p style="font-size:18px"><strong>New DRC lead. Call now.</strong></p>`
    + (digits ? `<p><a href="tel:${digits}" style="font-size:20px">Call ${clean(phone)}</a></p>` : '')
    + lines.map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('');
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: alertFrom(env), to, subject: `CALL NOW: ${who}${phone ? ' ' + clean(phone) : ''}${service ? ', ' + clean(service) : ''}`,
        html, text: lines.map(([k, v]) => `${k}: ${v}`).join('\n'), headers: { 'X-Priority': '1', Importance: 'high' } }),
    });
    return r.ok;
  } catch { return false; }
}
