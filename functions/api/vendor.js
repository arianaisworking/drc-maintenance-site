const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const row = (label, value) => {
  const v = String(value ?? '').trim();
  return v ? `<tr><td style="padding:6px 14px 6px 0;color:#637085;font-size:13px;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;color:#0E2240;font-size:14px;font-weight:600">${esc(v)}</td></tr>` : '';
};

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    const {
      company = '',
      dba = '',
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
      city = '',
      state = '',
      yearsInBusiness = '',
      crewSize = '',
      trades = [],
      markets = '',
      generalLiability = '',
      workersComp = '',
      w9 = '',
      backgroundChecks = '',
      licenses = '',
      afterHours = '',
      website = '',
      referral = '',
      message = '',
      hp = ''
    } = data;

    // Honeypot — bots fill the hidden field. Look successful, send nothing.
    if (String(hp).trim()) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!company || !firstName || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tradeArr = (Array.isArray(trades) ? trades : String(trades || '').split(','))
      .map((t) => String(t).trim())
      .filter(Boolean);
    const tradeList = tradeArr.join(', ');
    // Keep the subject line readable when a vendor checks off half the list
    const tradeSummary = tradeArr.length > 3
      ? `${tradeArr.slice(0, 3).join(', ')} +${tradeArr.length - 3} more`
      : tradeList;
    const location = [city, state].filter(Boolean).join(', ');
    const contactName = [firstName, lastName].filter(Boolean).join(' ');

    const emailHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a14;max-width:640px">
        <h2 style="font-size:20px;color:#0E2240;margin:0 0 4px">New Vendor Application — DRC Maintenance</h2>
        <p style="font-size:13px;color:#637085;margin:0 0 20px">Submitted from the vendor signup page.</p>

        <h3 style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#2E6B3E;margin:22px 0 8px">Business</h3>
        <table style="border-collapse:collapse">
          ${row('Business Name', company)}
          ${row('DBA / Trade Name', dba)}
          ${row('Contact', contactName)}
          ${row('Email', email)}
          ${row('Phone', phone)}
          ${row('Location', location)}
          ${row('Years In Business', yearsInBusiness)}
          ${row('Crew Size', crewSize)}
          ${row('Website / Social', website)}
        </table>

        <h3 style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#2E6B3E;margin:22px 0 8px">Trades &amp; Coverage</h3>
        <table style="border-collapse:collapse">
          ${row('Trades', tradeList)}
          ${row('Markets / Counties', markets)}
          ${row('After-Hours Calls', afterHours)}
        </table>

        <h3 style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#2E6B3E;margin:22px 0 8px">Compliance</h3>
        <table style="border-collapse:collapse">
          ${row('General Liability', generalLiability)}
          ${row('Workers’ Comp', workersComp)}
          ${row('W-9 Ready', w9)}
          ${row('Background Checks', backgroundChecks)}
          ${row('Trade License(s)', licenses)}
        </table>

        ${referral ? `<h3 style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#2E6B3E;margin:22px 0 8px">Referral Source</h3>
        <p style="font-size:14px;color:#0E2240;margin:0">${esc(referral)}</p>` : ''}

        ${message ? `<h3 style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#2E6B3E;margin:22px 0 8px">About Their Company</h3>
        <p style="font-size:14px;color:#1a1a14;line-height:1.6;margin:0">${esc(message).replace(/\n/g, '<br>')}</p>` : ''}
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: env.TO_EMAIL,
        reply_to: email,
        subject: `New Vendor Application — ${company}${tradeSummary ? ` (${tradeSummary})` : ''}`,
        html: emailHtml
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      // Return 200 so Cloudflare doesn't swallow the body, but include error details
      return new Response(JSON.stringify({
        success: false,
        resend_status: resendResponse.status,
        resend_error: resendData
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, resend_id: resendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', detail: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
