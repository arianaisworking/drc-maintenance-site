// Cloudflare Pages Function — handles POST /api/contact
// Sends form submissions to your inbox via Resend (resend.com)
//
// SETUP REQUIRED:
// 1. In Cloudflare Pages > your project > Settings > Environment variables, add:
//      RESEND_API_KEY   = your Resend API key (from resend.com/api-keys)
//      TO_EMAIL         = the inbox you want quote requests delivered to
//      FROM_EMAIL       = a verified sender on your domain, e.g. quotes@drcmaintenance.com
//
// 2. In Resend, verify your domain (drcmaintenance.com) so FROM_EMAIL is authorized.
//
// 3. Deploy via GitHub -> Cloudflare Pages. This file at /functions/api/contact.js
//    automatically becomes the endpoint at https://yourdomain.com/api/contact

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    const {
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
      company = '',
      propertyType = '',
      service = '',
      message = ''
    } = data;

    if (!firstName || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const emailHtml = `
      <h2>New Quote Request — DRC Maintenance</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Property Type:</strong> ${propertyType}</p>
      <p><strong>Service Needed:</strong> ${service}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
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
        subject: `New Quote Request from ${firstName} ${lastName}`,
        html: emailHtml
      })
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
