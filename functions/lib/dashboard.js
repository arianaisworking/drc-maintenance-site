// Sends each DRC Home Services lead into DRC Dash (drc-dashboard) as a Bid,
// so leads and the new client offer can be tracked there.
//
// Env: DRC_DASH_MCP_URL  the dashboard's connector address
//      (https://drc-dashboard.pages.dev/mcp-connector/<key>). Unset = skipped.
//
// Each lead becomes a bid with job type "Home Services lead", a work order
// number starting HS-, the estimate as the DRC quote, and the offer in the
// notes, so searching "New client offer" in the dashboard lists every lead
// that received it. Never throws: a dashboard problem must not lose the email.

const ctDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });

export async function sendLeadToDashboard(env, lead, est, extraNotes = []) {
  if (!env.DRC_DASH_MCP_URL) return { skipped: true };
  const wo = 'HS-' + ctDate().replace(/-/g, '').slice(2) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const priced = est && est.ok && !est.quoteOnly;
  // Every website lead is a new client: priced leads have the 10% built into the estimate,
  // quoted leads need it applied by hand to the first visit.
  const offer = priced && est.offerApplied ? `New client offer: 10% off first visit ($${est.offerAmount}), included in the estimate`
    : 'New client offer: 10% off first visit, apply it to the quote';
  const fields = {
    workOrderNumber: wo,
    isBid: true,
    bidStatus: 'Bid Request',
    jobType: 'Home Services lead',
    division: 'home_services',
    hsStage: 'New lead',
    clientName: 'Home Services: ' + (lead.name || 'Website lead'),
    address: [lead.address, lead.city, lead.zip ? 'ZIP ' + lead.zip : '', lead.metro].filter(Boolean).join(', ') || 'Not given',
    tenantName: lead.name || '',
    tenantPhone: lead.phone || '',
    tenantInfo: [lead.email, lead.contactPref ? 'Prefers ' + lead.contactPref : ''].filter(Boolean).join(' · '),
    description: lead.serviceLabel || lead.service || 'Home services',
    drcClientQuote: priced ? String(est.middle) : '',
    notes: [
      offer,
      priced ? `Estimate shown: $${est.low} to $${est.high} (first visit)` : 'Quote by hand',
      ...extraNotes,
      lead.source ? 'Ad source: ' + lead.source : '',
      lead.notes ? 'In their words: ' + lead.notes : '',
    ].filter(Boolean).join('\n'),
  };
  try {
    const r = await fetch(env.DRC_DASH_MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'create_job', arguments: { fields } } }),
    });
    const out = await r.json().catch(() => ({}));
    return { ok: r.ok && !out.error && !(out.result && out.result.isError), wo };
  } catch (e) { return { ok: false, error: String(e) }; }
}
