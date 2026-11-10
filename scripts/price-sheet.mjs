// Builds docs/drc-cleaning-price-sheet.html from cleaning-pricing.js, then the PDF.
// Run: node scripts/price-sheet.mjs   (needs playwright for the PDF step)
import { PRICING as P, estimate } from '../cleaning-pricing.js';
import fs from 'fs';
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const homes = [['1 bed, 1 bath', 1, 1, 800], ['2 bed, 2 bath', 2, 2, 1100], ['3 bed, 2 bath', 3, 2, 1600], ['4 bed, 3 bath', 4, 3, 2400], ['5 bed, 3.5 bath', 5, 3.5, 3200]];
const svcs = ['standard', 'deep', 'move', 'rental'];
const cell = (svc, b, ba, sq) => { const r = estimate({ service: svc, bedrooms: b, bathrooms: ba, sqft: sq }); return `${money(r.low)} to ${money(r.high)}`; };
const rows = homes.map(([n, b, ba, sq]) => `<tr><td>${n}<small>about ${sq.toLocaleString()} sq ft</small></td>${svcs.map(s => `<td>${cell(s, b, ba, sq)}</td>`).join('')}</tr>`).join('');
const addons = Object.values(P.addons).filter(a => !a.quote).map(a => `<tr><td>${a.label}</td><td>+$${a.add}</td></tr>`).join('');
const prods = Object.values(P.products).map(p => `<tr><td>${p.label}</td><td>${p.add ? '+$' + p.add : 'Included'}</td></tr>`).join('');
const freq = Object.entries(P.frequency).filter(([k]) => k !== 'once').map(([, f]) => `<tr><td>${f.label}</td><td>Save $${f.off} every visit</td></tr>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><title>DRC Home Services Cleaning Price Sheet</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700;800&display=swap');
@page{size:Letter;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Figtree',Arial,sans-serif;color:#24323F;background:#FBF6EE;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:8.5in;padding:.38in .5in}
header{display:flex;align-items:center;gap:14px;background:#2E6B3E;color:#fff;border-radius:14px;padding:12px 18px;margin-bottom:10px}
header img{height:46px;background:#fff;border-radius:6px;padding:3px}header b{font-size:20px;letter-spacing:.08em;display:block}header span{font-size:13px;opacity:.85}
h2{font-size:14px;text-transform:uppercase;letter-spacing:.1em;color:#2E6B3E;margin:12px 0 6px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #E7DDCD;border-radius:10px;overflow:hidden;font-size:12.5px}
th{background:#E4EEE5;text-align:left;padding:8px 10px;font-size:12px}td{padding:5px 10px;border-top:1px solid #EFE7DA}td small{display:block;color:#6B6A66;font-size:10.5px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.note{font-size:11.5px;color:#6B6A66;margin-top:6px;line-height:1.45}
ul{font-size:12px;line-height:1.5;padding-left:18px;background:#fff;border:1px solid #E7DDCD;border-radius:10px;padding:10px 12px 10px 28px}
footer{margin-top:14px;font-size:10.5px;color:#6B6A66;display:flex;justify-content:space-between}
</style></head><body><div class="page">
<header><img src="../img/drc-logo.png" alt="DRC"><div><b>DRC HOME SERVICES</b><span>Cleaning price sheet · Dallas · Denver · Nashville · Phoenix</span></div></header>
<h2>Typical price per visit</h2>
<table><tr><th>Home</th><th>Essential Home Cleaning</th><th>Signature Deep Cleaning</th><th>Move in or out</th><th>Airbnb turnover</th></tr>${rows}</table>
<p class="note">Average condition, no pets, client's products. Final price is confirmed on the call after we review details and photos. Smallest job: ${money(P.MINIMUM)}.</p>
<div class="cols">
<div><h2>Add ons</h2><table>${addons}</table></div>
<div><h2>Products</h2><table>${prods}</table>
<h2>Membership savings</h2><table>${freq}</table>
<h2>Adjustments</h2><table><tr><td>Heavy buildup</td><td>+30% time</td></tr><tr><td>Very heavy (months since cleaned)</td><td>+60% time</td></tr><tr><td>1 to 2 pets</td><td>+5% time</td></tr><tr><td>3+ pets or heavy shedding</td><td>+12% time</td></tr></table></div>
</div>
<h2>Quoted for your area</h2>
<ul><li>Complete Home Care: cleaning plus laundry, linens, organizing and repairs (itemized proposal)</li><li>Carpet cleaning, carpeted stairs and area rugs</li><li>Hoarder, debris or biohazard cleanouts</li><li>Offices, dental, restaurants and other businesses</li><li>Organization specialist: closets, pantries and garages</li><li>Repairs, handyman and landscaping through DRC Maintenance</li></ul>
<h2>Booking</h2>
<ul><li>We confirm your price on a call, then email a secure Square payment link with your price and terms.</li><li>Your date is locked in once payment is confirmed.</li><li>All payments are non refundable.</li></ul>
<footer><span>DRC Home Services · Dedicated Resource Center LLC</span><span>drcmaintenance.com/cleaning</span></footer>
</div></body></html>`;
fs.writeFileSync(new URL('../docs/drc-cleaning-price-sheet.html', import.meta.url), html);
const { chromium } = await import('playwright').then(m => m.default ? m.default : m).catch(async () => ({ chromium: (await import('module')).createRequire(import.meta.url)('playwright').chromium }));
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://localhost:8765/docs/drc-cleaning-price-sheet.html', { waitUntil: 'networkidle' });
const h = await p.evaluate(() => document.querySelector('.page').scrollHeight);
const scale = Math.min(1, 1056 / h);
await p.pdf({ path: new URL('../docs/drc-cleaning-price-sheet.pdf', import.meta.url).pathname, format: 'Letter', printBackground: true, scale, pageRanges: '1' });
await p.screenshot({ path: '/tmp/claude-0/-home-claude/3a9088b5-f41a-5213-979b-7310c757d7a9/scratchpad/out/sheet.png', fullPage: true });
await b.close(); console.log('done');
