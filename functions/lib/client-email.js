// The "we got your request" email a DRC Home Services client receives.
// Same look as the landing page: stone background, white card, serif headings,
// evergreen and brass. Built with tables and inline styles so it holds up in
// Gmail, Outlook and Apple Mail. The message: we are giving you your time back.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Math.round(n).toLocaleString('en-US');

const C = { stone: '#F4F3EF', card: '#FFFFFF', ink: '#1A1F1C', muted: '#5F6862', line: '#E4E1D8', ever: '#1F3D30', brass: '#9C7A45', soft: '#F8F5EE' };
const SERIF = "'Gilda Display', Georgia, 'Times New Roman', serif";
const SANS = "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const p = (t, o = {}) => `<p style="margin:0 0 ${o.mb ?? 18}px;font-family:${SANS};font-size:${o.size || 16}px;line-height:1.65;color:${o.color || C.ink}">${t}</p>`;

// est: result of estimate(), or null. quoteItems: things we will quote by hand.
export function clientEmail({ origin, name, serviceLabel, est, contactPref, phone, quoteItems = [], frequencyLabel = '' }) {
  const first = esc(String(name || '').trim().split(' ')[0] || 'there');
  const d = String(phone || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  const tel = d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}` : esc(phone);
  const reach = contactPref === 'Call' ? `Our team will call you at ${tel}` : contactPref === 'Email' ? 'Our team will email you to set a time for a short call' : `Our team will text you at ${tel} to set a time for a short call`;
  const priced = est && est.ok && !est.quoteOnly;
  const deep = priced && /deep/i.test(est.service || '');

  const priceBlock = priced ? `
    <tr><td style="padding:0 40px 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.soft};border-left:3px solid ${C.brass}">
        <tr><td style="padding:22px 24px">
          <div style="font-family:${SANS};font-size:13px;color:${C.muted};margin-bottom:6px">${esc(serviceLabel)}</div>
          <div style="font-family:${SERIF};font-size:34px;line-height:1.1;color:${C.ever}">${deep ? 'From ' + money(est.low) : money(est.low) + ' to ' + money(est.high)}</div>
          <div style="font-family:${SANS};font-size:14px;line-height:1.55;color:${C.muted};margin-top:8px">${est.offerApplied ? 'Your first visit, with 10% new client savings included.' : 'Your first visit.'}${est.ongoing ? `<br>Then ${money(est.ongoing.low)} to ${money(est.ongoing.high)} a visit${frequencyLabel ? ', ' + esc(frequencyLabel.toLowerCase()) : ''}.` : ''}</div>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:14px 40px 8px">${p('This estimate is based on what you shared with us. We will call to review the details together and confirm your final price before anything is scheduled.', { size: 14, color: C.muted, mb: 0 })}</td></tr>` : '';

  const quoteBlock = quoteItems.length ? `
    <tr><td style="padding:22px 40px 0">
      <div style="font-family:${SANS};font-size:13px;color:${C.muted};margin-bottom:8px">We will prepare a personal quote for</div>
      ${p(quoteItems.map(esc).join('<br>'), { mb: 0 })}
    </td></tr>` : '';

  const step = (n, title, text) => `
    <tr><td style="padding:0 0 18px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td valign="top" style="width:34px;font-family:${SERIF};font-size:22px;color:${C.brass};line-height:1.2">${n}</td>
        <td valign="top"><div style="font-family:${SANS};font-size:15px;font-weight:600;color:${C.ink};margin-bottom:3px">${title}</div>
          <div style="font-family:${SANS};font-size:14px;line-height:1.6;color:${C.muted}">${text}</div></td>
      </tr></table>
    </td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Gilda+Display&family=Hanken+Grotesk:wght@400;600&display=swap" rel="stylesheet">
<title>Your time, handed back</title></head>
<body style="margin:0;padding:0;background:${C.stone}">
<div style="display:none;max-height:0;overflow:hidden">We have your request. Here is what happens next.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.stone}"><tr><td align="center" style="padding:36px 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
    <tr><td align="center" style="padding:0 0 26px"><img src="${origin}/img/drc-logo.png" width="120" alt="DRC Home Services" style="display:block;border:0;width:120px;height:auto"></td></tr>
    <tr><td style="background:${C.card};border:1px solid ${C.line}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:44px 40px 10px">
          <div style="font-family:${SANS};font-size:14px;color:${C.brass};margin-bottom:14px">Hello ${first},</div>
          <h1 style="margin:0 0 20px;font-family:${SERIF};font-weight:400;font-size:38px;line-height:1.12;color:${C.ink}">Your time,<br>handed back.</h1>
          ${p('Thank you for choosing DRC Home Services. We have your request, and our team is already preparing for your home.')}
          ${p('We are not simply sending a cleaner. We are giving you back the hours your home has been asking of you, so you can spend them on the people and work that matter most.', { mb: 26 })}
        </td></tr>
        ${priceBlock}
        ${quoteBlock}
        <tr><td style="padding:30px 40px 10px">
          <div style="border-top:1px solid ${C.line};padding-top:28px;font-family:${SERIF};font-size:22px;color:${C.ink};margin-bottom:20px">What happens next</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${step(1, 'We reach out', `${reach}, so we can review your home together and confirm your final price.`)}
            ${step(2, 'You approve', 'Once you are happy with everything, we send a secure Square payment link.')}
            ${step(3, 'Your date is reserved', 'Your visit is confirmed the moment payment comes through. Then you simply come home to it.')}
          </table>
        </td></tr>
        <tr><td style="padding:6px 40px 44px">
          ${p('Talk soon,', { mb: 4 })}
          <div style="font-family:${SERIF};font-size:20px;color:${C.ever}">DRC Home Services</div>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:24px 20px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted}">
      Family owned. Insured and background checked.<br>Dedicated Resource Center LLC
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
