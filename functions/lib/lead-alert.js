// Instant phone alert for every new lead: posts one short message to Slack
// through an Incoming Webhook, so Slack's mobile app pushes it within seconds.
// Set LEAD_ALERT_SLACK_WEBHOOK (Cloudflare Pages > Settings > Variables and Secrets,
// type Secret) to the webhook URL Slack gives you. Unset = this does nothing.
// Never throws: a failed alert must not fail the customer's form.

const clean = s => String(s ?? '').replace(/[<>&]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);

export async function sendLeadAlert(env, { source, name, phone, email, service, where, note }) {
  const url = env && env.LEAD_ALERT_SLACK_WEBHOOK;
  if (!url) return false;
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  const lines = [
    `:rotating_light: *New DRC lead* (${clean(source)}): call now`,
    `*${clean(name) || 'No name'}*${service ? ' · ' + clean(service) : ''}${where ? ' · ' + clean(where) : ''}`,
    digits ? `:telephone_receiver: <tel:${digits}|${clean(phone)}>` : ':telephone_receiver: no phone given',
    email ? `:email: ${clean(email)}` : '',
    note ? `> ${clean(note)}` : '',
  ].filter(Boolean);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }) });
    return r.ok;
  } catch { return false; }
}
