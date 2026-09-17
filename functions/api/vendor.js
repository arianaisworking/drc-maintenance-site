const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const row = (label, value) => {
  const v = String(value ?? '').trim();
  return v
    ? `<tr><td style="padding:6px 14px 6px 0;color:#637085;font-size:13px;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;color:#0E2240;font-size:14px;font-weight:600">${esc(v)}</td></tr>`
    : '';
};

const heading = (text) =>
  `<h3 style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#2E6B3E;margin:22px 0 8px">${esc(text)}</h3>`;

const list = (v) => (Array.isArray(v) ? v : String(v || '').split(','))
  .map((x) => String(x).trim())
  .filter(Boolean);

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    const {
      company = '', dba = '', firstName = '', lastName = '', email = '', phone = '',
      homeState = '', homeCity = '', yearsInBusiness = '', crewSize = '',
      trades = [], doesPropPres = false,
      cities = [], counties = [], serviceAreaNotes = '',
      generalLiability = '', workersComp = '', autoLiability = '', w9 = '',
      backgroundChecks = '', afterHours = '', paymentPreference = '',
      licenses = [], website = '', referral = '', message = '', hp = ''
    } = data;

    // Honeypot: bots fill the hidden field. Look successful, send nothing.
    if (String(hp).trim()) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!company || !firstName || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const tradeArr = list(trades);
    const cityArr = list(cities);
    const countyArr = list(counties);
    const contactName = [firstName, lastName].filter(Boolean).join(' ');
    // homeCity already carries its state code, so don't repeat the state name.
    const homeBase = homeCity || homeState;

    const tradeSummary = tradeArr.length > 3
      ? `${tradeArr.slice(0, 3).join(', ')} +${tradeArr.length - 3} more`
      : tradeArr.join(', ');

    const licenseRows = (Array.isArray(licenses) ? licenses : [])
      .map((l) => ({ license: String(l?.license ?? '').trim(), state: String(l?.state ?? '').trim() }))
      .filter((l) => l.license);

    // Property preservation vendors are dispatched by county, so call it out up top.
    const ppBanner = doesPropPres
      ? `<p style="background:#0E2240;color:#F2ECDC;padding:12px 16px;border-radius:6px;font-size:13px;margin:0 0 18px">
           <strong style="color:#3a8a4f">Property Preservation vendor.</strong>
           ${countyArr.length ? `Covers ${countyArr.length} counties, listed below.` : 'No counties were submitted, follow up before onboarding.'}
         </p>`
      : '';

    const emailHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a14;max-width:660px">
        <h2 style="font-size:20px;color:#0E2240;margin:0 0 4px">New Vendor Application</h2>
        <p style="font-size:13px;color:#637085;margin:0 0 20px">Submitted from the vendor signup page.</p>
        ${ppBanner}

        ${heading('Business')}
        <table style="border-collapse:collapse">
          ${row('Business Name', company)}
          ${row('DBA / Trade Name', dba)}
          ${row('Contact', contactName)}
          ${row('Email', email)}
          ${row('Phone', phone)}
          ${row('Home Base', homeBase)}
          ${row('Years In Business', yearsInBusiness)}
          ${row('Crew Size', crewSize)}
          ${row('Website / Social', website)}
        </table>

        ${heading('Trades')}
        <table style="border-collapse:collapse">
          ${row('Self-Performs', tradeArr.join(', '))}
          ${row('After-Hours Calls', afterHours)}
        </table>

        ${heading(`Service Area, No Trip Charge${cityArr.length ? ` (${cityArr.length} cities)` : ''}`)}
        ${cityArr.length
          ? `<p style="font-size:13.5px;color:#1a1a14;line-height:1.7;margin:0 0 10px">${esc(cityArr.join(' · '))}</p>`
          : '<p style="font-size:13px;color:#637085;margin:0 0 10px">No cities selected.</p>'}
        ${countyArr.length
          ? `<table style="border-collapse:collapse">${row('Counties', countyArr.join(', '))}</table>`
          : ''}
        ${serviceAreaNotes
          ? `<table style="border-collapse:collapse">${row('In Their Words', serviceAreaNotes)}</table>`
          : ''}

        ${heading('Insurance & Compliance')}
        <table style="border-collapse:collapse">
          ${row('General Liability', generalLiability)}
          ${row('Workers’ Comp', workersComp)}
          ${row('Auto Liability', autoLiability)}
          ${row('W-9 Ready', w9)}
          ${row('Background Checks', backgroundChecks)}
          ${row('Payment Preference', paymentPreference)}
        </table>

        ${licenseRows.length
          ? heading('Trade Licenses') + '<table style="border-collapse:collapse">' +
            licenseRows.map((l, i) => row(`License ${i + 1}`, l.state ? `${l.license} (${l.state})` : l.license)).join('') +
            '</table>'
          : ''}

        ${referral ? heading('Referral Source') + `<p style="font-size:14px;color:#0E2240;margin:0">${esc(referral)}</p>` : ''}

        ${message
          ? heading('About Their Company') +
            `<p style="font-size:14px;color:#1a1a14;line-height:1.6;margin:0">${esc(message).replace(/\n/g, '<br>')}</p>`
          : ''}
      </div>
    `;

    const subjectBits = [company];
    if (tradeSummary) subjectBits.push(`(${tradeSummary})`);
    if (homeBase) subjectBits.push(`- ${homeBase}`);

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
        subject: `New Vendor Application: ${subjectBits.join(' ')}`,
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
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, resend_id: resendData.id }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', detail: err.message }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }
}
