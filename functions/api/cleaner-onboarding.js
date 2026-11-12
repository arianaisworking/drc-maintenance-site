// Cleaner onboarding for DRC Home Services (/cleaner-onboarding).
// GET  returns the test questions without answers.
// POST grades the test here on the server (the answer key never reaches the browser),
//      emails the office every attempt, and emails the applicant when they pass.
// Uses the same Resend env vars as the other forms (RESEND_API_KEY, FROM_EMAIL, TO_EMAIL, CLEANING_TO_EMAIL).

// safety: true means the question must be answered correctly to pass, no matter the overall score.
export const QUESTIONS = [
  { id: 'q1', safety: true, topic: 'Chemical safety', q: 'What happens if bleach is mixed with a cleaner that contains ammonia, such as some glass cleaners?',
    a: ['It cleans faster', 'It releases a toxic gas. Never mix them.', 'Nothing, they cancel out', 'It is only a problem with hot water'], key: 1 },
  { id: 'q2', safety: true, topic: 'Chemical safety', q: 'A toilet is stained. Can you use bleach and a vinegar or acid based bowl cleaner together to make it stronger?',
    a: ['Yes, it works better', 'Only if the window is open', 'No. Bleach with acids releases chlorine gas.', 'Only if diluted with water'], key: 2 },
  { id: 'q3', safety: true, topic: 'Chemical safety', q: 'Which pair is also dangerous to combine?',
    a: ['Bleach and rubbing alcohol', 'Dish soap and warm water', 'Glass cleaner and a dry microfiber cloth', 'Baking soda and water'], key: 0 },
  { id: 'q4', safety: true, topic: 'Chemical safety', q: 'You start coughing or feel dizzy after two products mix by accident. What do you do first?',
    a: ['Finish the room quickly', 'Spray air freshener', 'Leave for fresh air right away, call Poison Control (1 800 222 1222) or 911 if it is serious, then tell DRC', 'Add water to dilute it'], key: 2 },
  { id: 'q5', safety: true, topic: 'Chemical safety', q: 'Which is the right way to use your products?',
    a: ['Pour leftovers into one bottle to save space', 'Keep each product in its original or properly labeled bottle, use one product at a time, and rinse before switching', 'Mix two cleaners for tough spots', 'Use any empty bottle you find in the home'], key: 1 },
  { id: 'q6', safety: true, topic: 'Chemical safety', q: 'A drain is slow and the client already poured in a drain cleaner. Should you add a different drain cleaner?',
    a: ['Yes, a stronger one', 'No. Never combine drain cleaners. Note it on the work order and tell DRC.', 'Yes, with boiling water', 'Only if it still smells'], key: 1 },
  { id: 'q7', topic: 'Special surfaces', q: 'How do you clean a marble, granite or travertine countertop?',
    a: ['Vinegar and water', 'Bleach spray', 'A pH neutral stone cleaner and a soft cloth', 'Scouring powder'], key: 2 },
  { id: 'q8', topic: 'Special surfaces', q: 'How do you clean hardwood floors?',
    a: ['A steam mop', 'A soaked mop and bucket', 'A damp, well wrung microfiber mop with a wood floor cleaner', 'Bleach and water'], key: 2 },
  { id: 'q9', topic: 'Special surfaces', q: 'How do you clean stainless steel appliances?',
    a: ['Steel wool', 'Wipe with the grain using a stainless cleaner or mild soap, then buff dry', 'Bleach wipes', 'Abrasive powder'], key: 1 },
  { id: 'q10', topic: 'Special surfaces', q: 'Brass, matte black or oil rubbed bronze faucets should be cleaned with:',
    a: ['Mild soap and water on a soft cloth, then dried', 'Lime and calcium remover', 'A scrub pad', 'Bleach'], key: 0 },
  { id: 'q11', topic: 'Special surfaces', q: 'How do you clean a TV or computer screen?',
    a: ['Spray glass cleaner directly on it', 'A dry or barely damp microfiber cloth. Never spray the screen.', 'A paper towel and all purpose cleaner', 'A baby wipe'], key: 1 },
  { id: 'q12', topic: 'Special surfaces', q: 'You are not sure what a surface is made of. What do you do?',
    a: ['Use your strongest cleaner', 'Check the work order notes or ask DRC. If you cannot reach anyone, use water or mild soap only and test a hidden spot.', 'Skip the whole room', 'Use whatever the last home needed'], key: 1 },
  { id: 'q13', topic: 'Laundry and appliances', q: 'Before washing a client’s laundry you should:',
    a: ['Wash everything together on hot', 'Check pockets, read care labels, separate lights and darks, and use bleach or softener only if the client approved it', 'Add bleach to every load', 'Dry everything on high'], key: 1 },
  { id: 'q14', topic: 'Laundry and appliances', q: 'You are cleaning inside a fridge and find old food. What do you do?',
    a: ['Throw it away', 'Do not throw anything away unless the work order or client says to. Set it aside and note it.', 'Take it home', 'Leave it on the counter'], key: 1 },
  { id: 'q15', topic: 'Laundry and appliances', q: 'Can you use a heavy duty spray oven cleaner inside a self cleaning oven?',
    a: ['Yes, always', 'No. Follow the work order and the oven maker’s guidance. Heavy oven cleaners can damage self cleaning ovens.', 'Only on the door glass', 'Only if it is hot'], key: 1 },
  { id: 'q16', topic: 'Laundry and appliances', q: 'On a landscaping job, when can you spray weed killer, fertilizer or pest control?',
    a: ['Whenever you see weeds', 'Only if the work order specifically says so', 'Every visit', 'If the client’s neighbor does'], key: 1 },
  { id: 'q17', topic: 'Our standards', q: 'You break a vase while dusting. What do you do?',
    a: ['Hide it', 'Stop, take photos, and report it to DRC right away, before you leave the home', 'Mention it next visit', 'Glue it back together'], key: 1 },
  { id: 'q18', topic: 'Our standards', q: 'A client says a room was missed. What happens?',
    a: ['Nothing, the job is done', 'The client pays for a new visit', 'You go back and complete it at no extra pay, at a time DRC schedules', 'Someone else is sent and you are paid anyway'], key: 2 },
  { id: 'q19', topic: 'Our standards', q: 'A client asks you to clean for them directly, without DRC. What do you say?',
    a: ['Agree and give your number', 'Politely decline and let DRC know', 'Agree but charge less', 'Ask them to pay in cash'], key: 1 },
  { id: 'q20', topic: 'Our standards', q: 'When are you paid for a job?',
    a: ['Before the job', 'When you arrive', 'After your completion photos, the full checklist and the client’s confirmation are in', 'Whenever you ask'], key: 2 },
];
export const PASS_PERCENT = 85;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

export function onRequestGet() {
  return json({ passPercent: PASS_PERCENT, questions: QUESTIONS.map(({ id, safety, topic, q, a }) => ({ id, safety: !!safety, topic, q, a })) });
}

export async function onRequestPost({ request, env }) {
  let d; try { d = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  const v = k => String((d.app || {})[k] ?? '').trim().slice(0, 600);
  const app = { name: v('name'), phone: v('phone'), email: v('email'), city: v('city'), metro: v('metro'), years: v('years'),
    services: (Array.isArray(d.app?.services) ? d.app.services : []).map(s => String(s).slice(0, 60)).slice(0, 12),
    car: v('car'), supplies: v('supplies'), days: v('days'), heard: v('heard'), notes: v('notes') };
  const sig = { name: String(d.signature?.name ?? '').trim().slice(0, 120), agreed: !!d.signature?.agreed };
  if (!app.name || !app.phone || !/^\S+@\S+\.\S+$/.test(app.email)) return json({ error: 'Please add your name, mobile number and email.' }, 400);
  if (!sig.agreed || !sig.name) return json({ error: 'Please read the agreement, check the box and type your full name.' }, 400);
  if (d.company_site) return json({ success: true, passed: false }); // honeypot

  const answers = d.answers || {};
  const wrong = QUESTIONS.filter(x => Number(answers[x.id]) !== x.key);
  const score = QUESTIONS.length - wrong.length;
  const percent = Math.round(score / QUESTIONS.length * 100);
  const safetyMissed = wrong.filter(x => x.safety);
  const passed = percent >= PASS_PERCENT && !safetyMissed.length;
  const topics = [...new Set(wrong.map(x => x.topic))];

  const tr = (k, val) => val ? `<tr><td style="padding:6px 14px 6px 0;color:#5F6862;font-size:13px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-size:14px;color:#1A1F1C">${val}</td></tr>` : '';
  const wrongHtml = wrong.length ? wrong.map(x => `<li style="margin-bottom:6px">${x.safety ? '<b style="color:#A3352A">Safety:</b> ' : ''}${esc(x.q)}<br><span style="color:#5F6862">They chose: ${esc(x.a[Number(answers[x.id])] ?? 'no answer')}</span></li>`).join('') : '<li>None</li>';
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1A1F1C">
    <h2 style="font-weight:400;margin:0 0 4px">New cleaner application: ${esc(app.name)}</h2>
    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:${passed ? '#1F3D30' : '#A3352A'}">${passed ? 'PASSED' : 'DID NOT PASS'} the onboarding test: ${score} of ${QUESTIONS.length} (${percent}%)${safetyMissed.length ? `, missed ${safetyMissed.length} chemical safety question${safetyMissed.length > 1 ? 's' : ''}` : ''}</p>
    <table style="border-collapse:collapse">${[
      tr('Mobile', esc(app.phone)), tr('Email', esc(app.email)), tr('Area', esc([app.city, app.metro].filter(Boolean).join(', '))),
      tr('Experience', esc(app.years)), tr('Can do', esc(app.services.join(', '))), tr('Own transportation', esc(app.car)),
      tr('Own supplies', esc(app.supplies)), tr('Available', esc(app.days)), tr('Heard about us', esc(app.heard)), tr('Notes', esc(app.notes)),
      tr('Signed agreement', `${esc(sig.name)} on ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago' })}`),
    ].join('')}</table>
    <h3 style="font-size:14px;margin:20px 0 6px">Questions missed</h3><ul style="padding-left:18px;font-size:14px">${wrongHtml}</ul>
    <p style="font-size:13px;color:#5F6862">${passed ? 'Next: run the background check before assigning any job. DRC sets pay; never ask the cleaner their price.' : 'They were asked to review the guide and retake the test.'}</p></div>`;

  const send = body => fetch('https://api.resend.com/emails', { method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const r = await send({ from: env.FROM_EMAIL, to: env.CLEANING_TO_EMAIL || env.TO_EMAIL, reply_to: app.email,
    subject: `Cleaner application ${passed ? 'PASSED' : 'not passed'}: ${app.name}${app.metro ? ', ' + app.metro : ''} (${percent}%)`, html });
  if (!r.ok) return json({ error: 'We could not send your application. Please try again in a minute.' }, 502);
  if (passed) {
    await send({ from: env.FROM_EMAIL, to: app.email, subject: 'DRC Home Services: application received',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;color:#1A1F1C"><p>Hello ${esc(app.name.split(' ')[0])},</p><p>Thank you for applying with DRC Home Services. You passed the onboarding test. Our team will reach out soon about your background check, which is required before your first job.</p><p>Please keep the onboarding guide handy: drcmaintenance.com/cleaner-onboarding</p><p>DRC Home Services</p></div>` }).catch(() => {});
  }
  return json({ success: true, passed, score, total: QUESTIONS.length, percent, passPercent: PASS_PERCENT, safetyMissed: safetyMissed.length, topics });
}
