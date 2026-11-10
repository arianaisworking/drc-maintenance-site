// DRC Cleaning — instant estimate formula.
//
// This one file is loaded by the /cleaning page (to show the client a range)
// AND by functions/api/cleaning-quote.js (so the office email shows the same
// numbers, worked out on the server). Change a price here and both update.
//
// How the estimate works:
//   hours = base + sq ft + bedrooms + bathrooms
//   hours x service type x soil level x pets  = labor hours
//   labor hours x CLIENT_RATE                 = labor price
//   + add-ons + product option - recurring discount
//   shown as a range (LOW / HIGH around the middle), never below MINIMUM.
// The office confirms the final price after reviewing photos.

export const PRICING = {
  CLIENT_RATE: 55,        // $ per cleaner-hour charged to the client
  MINIMUM: 150,           // smallest job we book
  CARPET_MINIMUM: 120,    // smallest carpet-only job
  RANGE_LOW: 0.9,         // range shown = middle x 0.9 ...
  RANGE_HIGH: 1.15,       // ... up to middle x 1.15

  hours: {
    // Tuned Nov 2026 to real cleaner time and market prices per sq ft (regular about $0.10 to $0.15, deep about $0.18 to $0.23)
    // (3 bed, 2 bath standard about $170 to $260, deep about $240 to $460).
    base: 0.5,            // setup, walk-through, photos
    per1000sqft: 0.95,
    perBedroom: 0.25,
    perBathroom: 0.45,
  },

  // Multiplies labor hours. quoteOnly = no number online, we quote after photos.
  services: {
    standard: { label: 'Essential Home Cleaning', factor: 1.0 },
    deep:     { label: 'Signature Deep Cleaning', factor: 1.75 },
    // Cleaning plus household help. No running total online: a specialist sends an itemized proposal.
    homecare: { label: 'Complete Home Care', quoteOnly: true, proposal: true },
    move:     { label: 'Move in or move out', factor: 1.7 },
    rental:   { label: 'Airbnb / vacation rental turnover', factor: 0.9 },
    student:  { label: 'Student housing turnover', factor: 1.1 },
    // Carpet is always quoted by the office (pricing varies by area). No price online.
    carpet:   { label: 'Carpet cleaning', quoteOnly: true },
    hoarder:  { label: 'Hoarder, debris or biohazard cleanout', quoteOnly: true },
    commercial: { label: 'Office, dental, restaurant or other business', quoteOnly: true },
  },

  soil: {
    light:   { label: 'Light: kept up, mostly dusting and wiping', factor: 0.9 },
    average: { label: 'Average: normal everyday mess', factor: 1.0 },
    heavy:   { label: 'Heavy: built up grime, soap scum, grease', factor: 1.3 },
    extreme: { label: 'Very heavy: hasn\'t been cleaned in months', factor: 1.6 },
  },

  pets: {
    none: { label: 'No pets', factor: 1.0 },
    some: { label: '1 to 2 pets', factor: 1.05 },
    many: { label: '3+ pets or heavy shedding', factor: 1.12 },
  },

  // Flat dollars added to the job.
  products: {
    client:       { label: 'Use my products', note: 'You leave out what you want us to use.', add: 0 },
    drc:          { label: 'Bring your products', note: 'Standard professional products.', add: 20 },
    organic:      { label: 'Organic, vinegar based or unscented', note: 'Good for allergies, kids and pets.', add: 35 },
    microplastic: { label: 'No microplastics', note: 'Plastic free tools and products, no microfiber.', add: 45 },
  },

  addons: {
    // Carpet items are quoted by the office (varies by area): counted, never priced online.
    carpetRoom:  { label: 'Carpet cleaning (rooms)', add: 0, quote: true },
    carpetStairs:{ label: 'Carpeted stairs (flights)', add: 0, quote: true },
    rug:         { label: 'Area rugs', add: 0, quote: true },
    fridge:    { label: 'Inside fridge', add: 35 },
    oven:      { label: 'Inside oven', add: 35 },
    cabinets:  { label: 'Inside cabinets and drawers', add: 45 },
    windows:   { label: 'Interior windows and tracks', add: 50 },
    baseboards:{ label: 'Hand wiped baseboards', add: 40 },
    blinds:    { label: 'Blinds', add: 35 },
    laundry:   { label: 'Laundry, wash and fold (per load)', add: 20 },
    dishes:    { label: 'Dishes', add: 20 },
    garage:    { label: 'Garage sweep out', add: 60 },
    patio:     { label: 'Patio or balcony', add: 40 },
  },

  // What Complete Home Care clients can pick. Never priced online.
  homecare: ['Weekly or biweekly cleaning', 'Laundry, folding and putting away', 'Fresh linens and beds made',
    'Kitchen detailing: fridge, oven, cabinets', 'Closet organizing', 'Pantry organizing',
    'Refrigerator cleanout and organizing', 'Inside windows and blinds',
    'Garage and patio', 'Repairs and maintenance coordination', 'Landscaping and yard care'],

  // $ off each visit for recurring clients.
  frequency: {
    once:     { label: 'One time', off: 0 },
    monthly:  { label: 'Monthly', off: 10 },
    biweekly: { label: 'Every 2 weeks', off: 15 },
    weekly:   { label: 'Weekly', off: 20 },
  },
};

const roundTo5 = n => Math.round(n / 5) * 5;
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; };

// answers: { service, sqft, bedrooms, bathrooms, soil, pets, products, addons:{key:qty}, frequency }
export function estimate(answers = {}, P = PRICING) {
  const svc = P.services[answers.service];
  if (!svc) return { ok: false, reason: 'Pick a service' };
  const countLines = () => Object.entries(answers.addons || {}).map(([key, qty]) => {
    const a = P.addons[key]; const q = Math.min(num(qty), 20);
    return a && q ? { label: a.label, qty: q, amount: a.add * q, quote: !!a.quote } : null;
  }).filter(Boolean);
  if (svc.quoteOnly) return { ok: true, quoteOnly: true, service: svc.label, addonLines: countLines() };

  if (svc.carpetOnly) {
    let total = 0; const addonLines = [];
    for (const [key, qty] of Object.entries(answers.addons || {})) {
      const a = P.addons[key]; const q = Math.min(num(qty), 20);
      if (!a || !q) continue;
      total += a.add * q; addonLines.push({ label: a.label, qty: q, amount: a.add * q });
    }
    if (!total) return { ok: false, reason: 'Add your carpet rooms' };
    const freq = P.frequency[answers.frequency] || P.frequency.once;
    const middle = Math.max(P.CARPET_MINIMUM, total - freq.off);
    return { ok: true, quoteOnly: false, carpetOnly: true, service: svc.label, laborHours: 0, labor: 0, addons: total, addonLines,
      products: 0, discount: freq.off, low: Math.max(P.CARPET_MINIMUM, roundTo5(middle * P.RANGE_LOW)), high: roundTo5(middle * P.RANGE_HIGH), middle: roundTo5(middle) };
  }

  const sqft = Math.min(num(answers.sqft), 20000);
  const beds = Math.min(num(answers.bedrooms), 20);
  const baths = Math.min(num(answers.bathrooms), 20);
  if (!sqft && !beds && !baths) return { ok: false, reason: 'Add your home size' };

  const soil = P.soil[answers.soil] || P.soil.average;
  const pets = P.pets[answers.pets] || P.pets.none;
  const prod = P.products[answers.products] || P.products.client;
  const freq = P.frequency[answers.frequency] || P.frequency.once;

  const h = P.hours;
  const rawHours = h.base + (sqft / 1000) * h.per1000sqft + beds * h.perBedroom + baths * h.perBathroom;
  const laborHours = rawHours * svc.factor * soil.factor * pets.factor;
  const labor = laborHours * P.CLIENT_RATE;

  let addons = 0;
  const addonLines = [];
  for (const [key, qty] of Object.entries(answers.addons || {})) {
    const a = P.addons[key];
    const q = Math.min(num(qty), 10);
    if (!a || !q) continue;
    addons += a.add * q;
    addonLines.push({ label: a.label, qty: q, amount: a.add * q, quote: !!a.quote });
  }

  const middle = Math.max(P.MINIMUM, labor + addons + prod.add - freq.off);
  return {
    ok: true,
    quoteOnly: false,
    service: svc.label,
    laborHours: Math.round(laborHours * 10) / 10,
    labor: Math.round(labor),
    addons,
    addonLines,
    products: prod.add,
    discount: freq.off,
    low: Math.max(P.MINIMUM, roundTo5(middle * P.RANGE_LOW)),
    high: roundTo5(middle * P.RANGE_HIGH),
    middle: roundTo5(middle),
    carpetQuote: addonLines.some(l => l.quote),
  };
}
