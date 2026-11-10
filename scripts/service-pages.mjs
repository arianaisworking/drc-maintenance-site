// Builds one landing page per service in /services/*.html.
// Run: node scripts/service-pages.mjs
// Each page: photo, description, what's included, who it's for, short FAQ and a lead box.
// Cleaning and home care leads go to /api/cleaning-chat (DRC Home Services lead email).
// Maintenance and landscaping leads go to /api/contact (DRC Maintenance email).
import { writeFileSync, mkdirSync } from 'node:fs';

const S = [
  // group, slug, name, kicker, h1, intro, included[], goodFor[], priceNote, faq[[q,a]], cta {label, href}, lead type, chat service label
  { g: 'Cleaning', slug: 'essential-home-cleaning', name: 'Essential Home Cleaning', img: 'essential',
    h1: 'A clean home, on a schedule that works for you',
    intro: 'Kitchens, bathrooms, dusting, surfaces and floors, done the same careful way every visit by background checked cleaners. Weekly, every two weeks or monthly.',
    inc: ['Kitchen counters, sink, stovetop and appliance fronts', 'Bathrooms scrubbed and sanitized', 'Dusting of reachable surfaces and decor', 'Floors vacuumed and mopped', 'Beds made and trash emptied', 'Before and after photos of every room'],
    good: ['Busy families who want weekends back', 'Homes that are kept up and need regular care', 'Anyone ready for a recurring membership'],
    price: 'Most 3 bed, 2 bath homes run $190 to $245. See your exact price online in about a minute.',
    faq: [['Will my cleaner know my preferences?', 'Yes. Your products, problem spots and rooms to skip are saved to your checklist for every visit.'], ['Do I need to provide supplies?', 'No. We can bring ours, or use yours, including organic and plastic free options.']],
    cta: { label: 'See my price', href: '/cleaning?service=standard#quote' }, lead: 'clean', svc: 'Essential Home Cleaning' },
  { g: 'Cleaning', slug: 'signature-deep-cleaning', name: 'Signature Deep Cleaning', img: 'deep',
    h1: 'Top to bottom, inside and behind',
    intro: 'The detailed clean for first visits, seasonal refreshes and homes that need extra care. Baseboards, doors, fixtures, built up grime and the spots that usually get skipped.',
    inc: ['Everything in Essential Home Cleaning', 'Baseboards and door frames hand wiped', 'Soap scum and hard water buildup removed', 'Ceiling fans, vents and light fixtures dusted', 'Under and behind movable furniture', 'Inside oven, fridge and cabinets on request'],
    good: ['A first clean before starting a membership', 'Spring and holiday refreshes', 'Homes that have not had a professional clean in a while'],
    price: 'Most 3 bed, 2 bath homes run $335 to $425. You get a starting range online and your final quote after we review your home.',
    faq: [['How long does a deep clean take?', 'Usually 5 to 8 cleaner hours for a typical home, depending on size and condition.'], ['Can I switch to regular cleans after?', 'Yes. Most clients start with a deep clean, then keep it up with Essential Home Cleaning.']],
    cta: { label: 'See my price', href: '/cleaning?service=deep#quote' }, lead: 'clean', svc: 'Signature Deep Cleaning' },
  { g: 'Cleaning', slug: 'complete-home-care', name: 'Complete Home Care', img: 'homecare',
    h1: 'Your whole home, handled by one team',
    intro: 'Cleaning plus laundry, linens, kitchen detailing, organizing and repairs. Pick what you want and a DRC home care specialist builds a personalized, itemized plan before anything is scheduled.',
    inc: ['Recurring cleaning', 'Laundry, folding and putting away', 'Fresh linens and beds made', 'Kitchen detailing: fridge, oven and cabinets', 'Closet, pantry and refrigerator organizing', 'Repairs, maintenance and yard care coordination'],
    good: ['Households that want one company for everything', 'Busy professionals and business owners', 'Older homeowners who want dependable help'],
    price: 'Every plan is custom. You get an itemized proposal before scheduling, with no surprises.',
    faq: [['Why is there no price online?', 'Every home and every plan is different, so a specialist reviews your selections and sends an itemized quote.'], ['Can I add repairs?', 'Yes. We are DRC Maintenance first, so repairs, handyman work and yard care are part of the same plan.']],
    cta: { label: 'Build my plan', href: '/cleaning?service=homecare#quote' }, lead: 'clean', svc: 'Complete Home Care' },
  { g: 'Cleaning', slug: 'move-in-move-out-cleaning', name: 'Move in or move out cleaning', img: 'move',
    h1: 'Start fresh, or hand over the keys with confidence',
    intro: 'Empty home cleans that get every cabinet, appliance and corner ready for move in day or the final walk through.',
    inc: ['Inside all cabinets, drawers and closets', 'Inside oven, fridge and dishwasher', 'Bathrooms deep cleaned', 'Baseboards, doors, switches and vents', 'Floors vacuumed and mopped throughout', 'Photos of every room for your records'],
    good: ['Renters who want their deposit back', 'Buyers moving into a new home', 'Landlords and property managers between tenants'],
    price: 'Priced by home size and condition. See your price online in about a minute.',
    faq: [['Does the home need to be empty?', 'Empty is best, so we can reach every surface. Tell us if anything will still be there.'], ['Can you do the same day as the move?', 'Often yes. Share your date and we will confirm.']],
    cta: { label: 'See my price', href: '/cleaning?service=move#quote' }, lead: 'clean', svc: 'Move in or move out' },
  { g: 'Cleaning', slug: 'airbnb-turnover-cleaning', name: 'Airbnb turnover cleaning', img: 'airbnb',
    h1: 'Guest ready between every stay',
    intro: 'Fast, reliable turnovers with fresh linens, restocked basics and photos, so you know the place is ready before your next guest arrives.',
    inc: ['Full clean between guests', 'Linens changed and beds made', 'Towels refreshed and staged', 'Restock of supplies you provide', 'Damage and missing item notes', 'Photos after every turnover'],
    good: ['Airbnb and vacation rental hosts', 'Property managers with short term rentals', 'Bed and breakfasts'],
    price: 'Priced per turnover by size. See your price online.',
    faq: [['Can you work around check in times?', 'Yes. Share your calendar and we schedule around checkouts and check ins.'], ['Do you report damage?', 'Yes. Your cleaner notes anything broken or missing with photos.']],
    cta: { label: 'See my price', href: '/cleaning?service=rental#quote' }, lead: 'clean', svc: 'Airbnb turnover' },
  { g: 'Cleaning', slug: 'carpet-cleaning', name: 'Carpet cleaning', img: 'carpet',
    h1: 'Fresh, deep cleaned carpets and rugs',
    intro: 'Deep steam cleaning for carpets, area rugs and stairs. Add it to any clean or book it on its own.',
    inc: ['Hot water extraction deep clean', 'Spot and traffic lane treatment', 'Carpeted stairs', 'Area rugs', 'Pet odor treatment on request'],
    good: ['Move outs and move ins', 'Homes with pets or kids', 'Seasonal refreshes'],
    price: 'Carpet pricing depends on your area, so we quote it for you.',
    faq: [['How long until I can walk on it?', 'Usually a few hours. We will give you drying tips for your home.'], ['Can I add it to a cleaning?', 'Yes. Book it with any clean and we schedule it together.']],
    cta: { label: 'Get my quote', href: '/cleaning?service=carpet#quote' }, lead: 'clean', svc: 'Carpet cleaning' },
  { g: 'Home and lifestyle', slug: 'closet-organizing', name: 'Closet organizing', img: 'closet',
    h1: 'A closet that makes mornings easy',
    intro: 'We sort, edit and set up your closet so everything has a place and stays that way. Clothes, shoes, bags and accessories, organized around how you actually get dressed.',
    inc: ['Sort and edit with you, keep or donate', 'Group by type, season and color', 'Shoes, bags and accessories set up to see at a glance', 'Shelves and floors cleaned', 'Donation drop off on request', 'Product and bin recommendations'],
    good: ['Walk in and reach in closets', 'Seasonal wardrobe swaps', 'Moves and new homes'],
    price: 'Organizing is quoted by the project. Tell us about your closet and we send a personalized plan.',
    faq: [['Do I need to be home?', 'For the first session we recommend it, so we can sort with you.'], ['Do you bring bins and hangers?', 'We recommend what fits your space and can pick them up for you.']],
    cta: { label: 'Build my plan', href: '/cleaning?service=homecare&hc=Closet%20organizing#quote' }, lead: 'clean', svc: 'Closet organizing' },
  { g: 'Home and lifestyle', slug: 'pantry-organizing', name: 'Pantry organizing', img: 'pantry',
    h1: 'A pantry you can actually find things in',
    intro: 'Expired items out, shelves cleaned, food grouped and labeled so the whole family can find what they need and see what is running low.',
    inc: ['Empty, check dates and toss expired items', 'Shelves wiped and cleaned', 'Group into zones: snacks, baking, breakfast, cans', 'Clear containers and labels', 'Easy restock setup'],
    good: ['Busy family kitchens', 'New homes and kitchen remodels', 'Anyone tired of buying doubles'],
    price: 'Quoted by the project. Tell us about your pantry and we send a personalized plan.',
    faq: [['Can you keep it organized?', 'Yes. Add a quick pantry reset to your recurring cleans.'], ['Do you label?', 'Yes, with clean, simple labels.']],
    cta: { label: 'Build my plan', href: '/cleaning?service=homecare&hc=Pantry%20organizing#quote' }, lead: 'clean', svc: 'Pantry organizing' },
  { g: 'Home and lifestyle', slug: 'refrigerator-organizing', name: 'Refrigerator organizing', img: 'fridge',
    h1: 'A clean, organized fridge every week',
    intro: 'A full refrigerator cleanout and reset: shelves and drawers washed, old food tossed, and everything grouped so meals are easier to plan.',
    inc: ['Empty and clean shelves, drawers and door bins', 'Toss expired and spoiled items', 'Group by zone: produce, dairy, drinks, leftovers', 'Clear bins and labels on request', 'Freezer reset on request'],
    good: ['Weekly meal preppers', 'Families and busy households', 'Before hosting or after the holidays'],
    price: 'Quoted by the project, or add it to any clean.',
    faq: [['Can this be part of my regular clean?', 'Yes. Add a fridge reset to any visit.'], ['Do you clean the freezer too?', 'Yes, on request.']],
    cta: { label: 'Build my plan', href: '/cleaning?service=homecare&hc=Refrigerator%20cleanout%20and%20organizing#quote' }, lead: 'clean', svc: 'Refrigerator organizing' },
  { g: 'Home and lifestyle', slug: 'laundry-and-linens', name: 'Laundry and linens', img: 'laundry',
    h1: 'Laundry done, folded and put away',
    intro: 'Wash, dry, fold and put away, plus fresh linens and beds made, so you come home to a calm, finished house.',
    inc: ['Wash and dry with your preferred detergent', 'Fold and put away', 'Fresh sheets and beds made', 'Towels refreshed', 'Delicates handled your way'],
    good: ['Busy parents', 'Professionals with long weeks', 'Recurring cleaning members'],
    price: 'Add it to any clean, priced per load.',
    faq: [['Do you use my detergent?', 'Yes, or tell us your preference, including fragrance free.'], ['Can you change sheets every visit?', 'Yes. Add linens to your recurring plan.']],
    cta: { label: 'Build my plan', href: '/cleaning?service=homecare&hc=Laundry%2C%20folding%20and%20putting%20away#quote' }, lead: 'clean', svc: 'Laundry and linens' },
  { g: 'Maintenance', slug: 'home-repairs', name: 'Repairs and maintenance', img: 'repairs',
    h1: 'Repairs and maintenance for every need, big or small',
    intro: 'We are DRC Maintenance first. Leaks, fixtures, drywall, doors, HVAC and appliances, handled by one trusted team with clear pricing before any work starts.',
    inc: ['Leaks, faucets, toilets and disposals', 'Drywall, patching and paint touch ups', 'Lights, fixtures and switches', 'Doors, locks and hardware', 'HVAC and appliance service', 'Photos of the finished work'],
    good: ['Homeowners with a running repair list', 'Cleaning members who want repairs too', 'Landlords and property managers'],
    price: 'Send photos or a short video and we quote most jobs for free. You approve the price before any work starts.',
    faq: [['Do you need to come out to quote?', 'Usually not. Photos or a video are enough for most jobs.'], ['Is there a trip fee?', 'If a visit is needed, we tell you the cost upfront before anyone comes out.']],
    cta: { label: 'Request a repair', href: '#lead' }, lead: 'maint', svc: 'Repairs and maintenance' },
  { g: 'Maintenance', slug: 'handyman', name: 'Handyman work', img: 'handyman',
    h1: 'The small jobs, finally done',
    intro: 'Mounting, assembly, caulking, hardware and all the little fixes that pile up. One visit, clear pricing, done right.',
    inc: ['TV and shelf mounting', 'Furniture assembly', 'Caulking and grout touch ups', 'Cabinet and door adjustments', 'Blinds, curtain rods and hardware', 'Minor carpentry'],
    good: ['Move ins and new homes', 'Honey do lists', 'Pre listing touch ups'],
    price: 'Send your list and photos and we quote it before anyone comes out.',
    faq: [['Can I book several small jobs at once?', 'Yes. Send the whole list and we bundle it into one visit.'], ['Do you bring materials?', 'We can, or use what you have.']],
    cta: { label: 'Send my list', href: '#lead' }, lead: 'maint', svc: 'Handyman work' },
  { g: 'Maintenance', slug: 'landscaping', name: 'Landscaping and yard', img: 'landscaping',
    h1: 'A yard that looks cared for, all year',
    intro: 'Mowing, trimming, cleanups and seasonal yard care from the DRC Maintenance team, one time or on a schedule.',
    inc: ['Mowing, edging and trimming', 'Bed cleanups and mulch', 'Leaf and debris removal', 'Shrub and hedge trimming', 'Seasonal cleanups', 'Photos after every visit'],
    good: ['Busy homeowners', 'Homes getting ready to list', 'Rental properties between tenants'],
    price: 'Quoted by yard size and scope. Send photos for a fast quote.',
    faq: [['Can you come on a schedule?', 'Yes. Weekly, every two weeks or monthly.'], ['Do you haul away debris?', 'Yes, we can include haul away in your quote.']],
    cta: { label: 'Get my yard quote', href: '#lead' }, lead: 'maint', svc: 'Landscaping, lawn and yard care' },
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const menu = g => S.filter(x => x.g === g).map(x => `<a href="/services/${x.slug}">${esc(x.name)}</a>`).join('');

function page(x) {
  const others = S.filter(o => o.g === x.g && o.slug !== x.slug).slice(0, 3);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(x.name)} | DRC Home Services in Dallas, Denver, Nashville and Phoenix</title>
<meta name="description" content="${esc(x.intro)}">
<meta property="og:title" content="${esc(x.name)} | DRC Home Services">
<meta property="og:image" content="/img/services/${x.img}.jpg">
<link rel="icon" type="image/png" href="/img/drc-logo.png">
<style>
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#FBF6EE;--paper:#fff;--sage:#5E8B6B;--sage-d:#2E6B3E;--sage-l:#E4EEE5;--ink:#24323F;--muted:#6B6A66;--line:#E7DDCD;--err:#B23A2A;--shadow:0 10px 30px rgba(60,45,25,.08)}
body{font-family:'Figtree',system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55;overflow-x:hidden}
img{max-width:100%;display:block}
a{color:inherit}
.wrap{max-width:1160px;margin:0 auto;padding:0 32px}
h1,h2,h3{letter-spacing:-.025em;line-height:1.1}
.kicker{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--sage-d);margin-bottom:14px}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:15px 26px;border-radius:99px;font:600 15px/1 'Figtree',sans-serif;text-decoration:none;cursor:pointer;border:none;background:var(--sage-d);color:#fff}
.btn.soft{background:var(--paper);color:var(--ink);border:1.5px solid var(--line)}
nav{position:sticky;top:0;z-index:50;background:rgba(251,246,238,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
nav .wrap{display:flex;align-items:center;justify-content:space-between;height:76px}
.logo{display:flex;align-items:center;gap:14px;text-decoration:none}.logo img{height:40px}.logo span{font-weight:700;font-size:22px;color:var(--sage-d);padding-left:14px;border-left:2px solid var(--line)}
.nl{display:flex;align-items:center;gap:24px;list-style:none}.nl>li>a{font-size:15px;font-weight:500;text-decoration:none}
.hm{position:relative}.menu{position:absolute;top:100%;right:-120px;display:grid;grid-template-columns:repeat(3,minmax(170px,1fr));gap:20px;background:var(--paper);border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 44px rgba(30,30,25,.14);padding:22px 24px;opacity:0;visibility:hidden;transition:opacity .15s;margin-top:12px}
.menu::before{content:'';position:absolute;left:0;right:0;top:-24px;height:24px}
.hm:hover .menu,.hm:focus-within .menu{opacity:1;visibility:visible}
.menu div{display:flex;flex-direction:column;gap:9px}.menu b{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--sage-d)}.menu a{font-size:14.5px;text-decoration:none;white-space:nowrap}.menu a:hover{color:var(--sage-d)}
.hero{padding:56px 0 40px}
.hero .wrap{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
.hero h1{font-size:clamp(36px,4.6vw,56px);margin-bottom:16px}
.hero p{font-size:18px;color:var(--muted);max-width:540px;margin-bottom:26px}
.hero .acts{display:flex;gap:12px;flex-wrap:wrap}
.hero figure{border-radius:24px;overflow:hidden;box-shadow:var(--shadow);aspect-ratio:3/2;background:var(--line)}
.hero figure img{width:100%;height:100%;object-fit:cover}
.price{margin-top:22px;background:var(--sage-l);border-radius:14px;padding:14px 16px;font-size:15px;max-width:540px}
section{padding:56px 0}
.two{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:start}
.card{background:var(--paper);border:1px solid var(--line);border-radius:20px;padding:28px}
.card h2{font-size:26px;margin-bottom:16px}
.ticks{list-style:none;display:grid;gap:11px}.ticks li{padding-left:28px;position:relative}.ticks li::before{content:'';position:absolute;left:0;top:5px;width:16px;height:16px;border-radius:50%;background:var(--sage-l);box-shadow:inset 0 0 0 5px var(--sage)}
.good{margin-top:26px}.good h3{font-size:18px;margin-bottom:10px}.good p{color:var(--muted)}
.lead h2{font-size:24px;margin-bottom:6px}.lead .hint{color:var(--muted);font-size:14.5px;margin-bottom:18px}
.f{display:grid;grid-template-columns:1fr 1fr;gap:12px}.f .full{grid-column:1/-1}
label{display:block;font-size:13.5px;font-weight:600;margin-bottom:6px}
input,textarea,select{width:100%;font:16px 'Figtree',sans-serif;padding:12px 13px;border:1.5px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink)}
textarea{min-height:90px;resize:vertical}
.lead .btn{width:100%;margin-top:14px}
.err{color:var(--err);font-size:14px;margin-top:8px}
.ok{display:none;text-align:center;padding:20px 0}.ok b{display:block;font-size:22px;margin-bottom:6px}
.hp{position:absolute;left:-9999px}
.faq details{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:10px}.faq summary{font-weight:600;cursor:pointer}.faq p{color:var(--muted);margin-top:8px}
.more{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.more a{display:block;background:var(--paper);border:1px solid var(--line);border-radius:18px;overflow:hidden;text-decoration:none}.more img{aspect-ratio:3/2;object-fit:cover;width:100%}.more span{display:block;padding:14px 16px;font-weight:600}
footer{border-top:1px solid var(--line);padding:30px 0;color:var(--muted);font-size:14px}footer .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
@media(max-width:900px){.hero .wrap,.two{grid-template-columns:1fr}.hero{padding-top:28px}.hero figure{order:-1}.more{grid-template-columns:1fr 1fr}.nl li:not(:last-child){display:none}}
@media(max-width:560px){.wrap{padding:0 16px}.f{grid-template-columns:1fr}.more{grid-template-columns:1fr}.logo span{font-size:18px}}
</style>
</head>
<body>
<nav><div class="wrap">
  <a href="/cleaning" class="logo"><img src="/img/drc-logo.png" alt="DRC Maintenance"><span>Home Services</span></a>
  <ul class="nl">
    <li class="hm"><a href="/cleaning#services">Services</a><div class="menu"><div><b>Cleaning</b>${menu('Cleaning')}</div><div><b>Home and lifestyle</b>${menu('Home and lifestyle')}</div><div><b>Maintenance</b>${menu('Maintenance')}<a href="/">All DRC Maintenance services</a></div></div></li>
    <li><a href="/cleaning#membership">Membership</a></li>
    <li><a href="#lead" class="btn">Get started</a></li>
  </ul>
</div></nav>

<header class="hero"><div class="wrap">
  <div>
    <span class="kicker">${esc(x.g)} · Dallas · Denver · Nashville · Phoenix</span>
    <h1>${esc(x.h1)}</h1>
    <p>${esc(x.intro)}</p>
    <div class="acts"><a class="btn" href="${x.cta.href}">${esc(x.cta.label)}</a>${x.cta.href === '#lead' ? '' : '<a class="btn soft" href="#lead">Ask a question</a>'}</div>
    <div class="price">${esc(x.price)}</div>
  </div>
  <figure><img src="/img/services/${x.img}.jpg" alt="${esc(x.name)} by DRC Home Services" width="1200" height="800"></figure>
</div></header>

<section><div class="wrap two">
  <div>
    <div class="card"><h2>What's included</h2><ul class="ticks">${x.inc.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
    <div class="good"><h3>Great for</h3><p>${x.good.map(esc).join(' · ')}</p></div>
    <div class="faq" style="margin-top:28px">${x.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
  <div class="card lead" id="lead">
    <form id="lf" novalidate>
      <h2>${x.lead === 'maint' ? 'Tell us what you need' : 'Get your personalized quote'}</h2>
      <p class="hint">A real person from DRC will reach out shortly.</p>
      <div class="f">
        <div><label for="n">Name *</label><input id="n" autocomplete="name" required></div>
        <div><label for="p">Phone *</label><input id="p" type="tel" autocomplete="tel" required></div>
        <div><label for="e">Email *</label><input id="e" type="email" autocomplete="email" required></div>
        <div><label for="z">ZIP code *</label><input id="z" inputmode="numeric" maxlength="5" autocomplete="postal-code" required></div>
        ${x.lead === 'maint' ? '' : '<div class="full"><label for="sz">Home size</label><select id="sz"><option value="">Choose one</option><option>Studio or 1 bed</option><option>2 beds</option><option>3 beds</option><option>4 beds</option><option>5+ beds</option></select></div>'}
        <div class="full"><label for="m">${x.lead === 'maint' ? 'What needs attention? *' : 'Anything we should know?'}</label><textarea id="m" placeholder="${x.lead === 'maint' ? 'Example: kitchen faucet drips and the guest bathroom door will not latch.' : 'Rooms to focus on, preferred days, pets, products you like.'}"></textarea></div>
      </div>
      <input class="hp" id="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn" type="submit">${x.lead === 'maint' ? 'Send my request' : 'Send my request'}</button>
      <p class="err" id="er" role="alert"></p>
    </form>
    <div class="ok" id="ok"><b>Thank you!</b><p>Someone from DRC will reach out shortly to talk through it and confirm next steps.</p></div>
  </div>
</div></section>

<section style="padding-top:0"><div class="wrap">
  <h2 style="font-size:26px;margin-bottom:18px">You might also like</h2>
  <div class="more">${others.map(o => `<a href="/services/${o.slug}"><img src="/img/services/${o.img}.jpg" alt="" loading="lazy"><span>${esc(o.name)}</span></a>`).join('')}</div>
</div></section>

<footer><div class="wrap"><span>© 2026 Dedicated Resource Center LLC</span><span><a href="/cleaning">DRC Home Services</a> · <a href="/">DRC Maintenance</a> · <a href="/privacy.html">Privacy</a></span></div></footer>

<script>
const $ = s => document.querySelector(s);
$('#lf').addEventListener('submit', async e => {
  e.preventDefault(); const er = $('#er'); er.textContent = '';
  if ($('#hp').value) return;
  const v = id => ($('#' + id) ? $('#' + id).value.trim() : '');
  if (!v('n') || v('p').replace(/\\D/g, '').length < 10 || !/^\\S+@\\S+\\.\\S+$/.test(v('e')) || !/^\\d{5}$/.test(v('z'))${x.lead === 'maint' ? " || !v('m')" : ''}) { er.textContent = 'Please add your name, phone, email, ZIP${x.lead === 'maint' ? ' and what needs attention' : ''}.'; return; }
  const btn = e.submitter || $('#lf button'); btn.disabled = true; btn.textContent = 'Sending...';
  try {
    let r;
    ${x.lead === 'maint'
      ? `const [firstName, ...rest] = v('n').split(' ');
    r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName, lastName: rest.join(' '), email: v('e'), phone: v('p'), propertyType: 'Private home (${esc(x.name)} page)', service: ${JSON.stringify(x.svc)}, message: v('m') + '\\n\\nZIP: ' + v('z') + '\\nPage: ' + location.href + '\\n\\nPlease call the client.' }) });`
      : `r = await fetch('/api/cleaning-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service: ${JSON.stringify(x.svc)}, size: v('sz'), location: 'ZIP ' + v('z'), notes: v('m'), name: v('n'), email: v('e'), phone: v('p'), page: location.href }) });`}
    if (!r.ok) throw 0;
    $('#lf').style.display = 'none'; $('#ok').style.display = 'block';
  } catch { er.textContent = 'Something went wrong. Please try again.'; btn.disabled = false; btn.textContent = 'Send my request'; }
});
</script>
</body>
</html>
`;
}

mkdirSync('services', { recursive: true });
for (const x of S) writeFileSync(`services/${x.slug}.html`, page(x));
export const SERVICES = S;
console.log('built', S.length, 'pages');
