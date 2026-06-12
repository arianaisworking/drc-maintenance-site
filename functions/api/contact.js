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
