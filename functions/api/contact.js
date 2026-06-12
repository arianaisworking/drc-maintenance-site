export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    return new Response(JSON.stringify({
      success: true,
      received: data,
      env_check: {
        has_resend_key: !!env.RESEND_API_KEY,
        from_email: env.FROM_EMAIL || 'MISSING',
        to_email: env.TO_EMAIL || 'MISSING'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', detail: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
