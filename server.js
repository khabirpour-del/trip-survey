import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CRITERIA, DESTINATIONS } from './data/destinations.js';
import { loadResponses, saveResponse, usingPostgres } from './data/store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const PARTICIPANTS = ['Aurélie', 'Sarah', 'Candy'];

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ---- API ----
app.get('/api/config', (_req, res) => {
  res.json({ criteria: CRITERIA, participants: PARTICIPANTS, destinations: DESTINATIONS });
});

app.get('/api/responses', async (_req, res) => {
  res.json(await loadResponses());
});

app.post('/api/responses', async (req, res) => {
  const r = req.body || {};
  if (!PARTICIPANTS.includes(r.name)) {
    return res.status(400).json({ error: 'Participante inconnue' });
  }
  await saveResponse(r.name, { ...r, submittedAt: new Date().toISOString() });
  res.json({ ok: true });
});

app.get('/api/results', async (_req, res) => {
  const all = await loadResponses();
  res.json(computeResults(Object.values(all)));
});

// ---- logique d'aggregation ----
const DAY = 86400000;
const toDay = (s) => Math.floor(new Date(s + 'T00:00:00Z').getTime() / DAY);
const fromDay = (d) => new Date(d * DAY).toISOString().slice(0, 10);

// Intersection des disponibilites (preferred + possible) moins les no-go.
function computeDateOverlap(responses) {
  const withDates = responses.filter(
    (r) => (r.dates?.preferred?.length || r.dates?.possible?.length)
  );
  if (!withDates.length) return { windows: [], respondents: 0 };

  // Pour chaque jour candidat, verifier qu'il convient a TOUTES celles
  // qui ont rempli des dates : dispo (pref/poss) et jamais en no-go.
  let min = Infinity, max = -Infinity;
  const norm = (ranges) => (ranges || []).map((x) => [toDay(x.start), toDay(x.end)]);
  const data = withDates.map((r) => {
    const avail = [...norm(r.dates.preferred), ...norm(r.dates.possible)];
    const pref = norm(r.dates.preferred);
    const nogo = norm(r.dates.nogo);
    for (const [a, b] of avail) { min = Math.min(min, a); max = Math.max(max, b); }
    return { avail, pref, nogo };
  });
  if (!isFinite(min)) return { windows: [], respondents: withDates.length };

  const inAny = (ranges, d) => ranges.some(([a, b]) => d >= a && d <= b);
  const days = [];
  for (let d = min; d <= max; d++) {
    const okForAll = data.every((p) => inAny(p.avail, d) && !inAny(p.nogo, d));
    const prefByAll = data.every((p) => inAny(p.pref, d));
    days.push(okForAll ? (prefByAll ? 2 : 1) : 0);
  }

  // regrouper les jours consecutifs valides en fenetres
  const windows = [];
  let start = null;
  for (let i = 0; i <= days.length; i++) {
    const valid = days[i] > 0;
    if (valid && start === null) start = i;
    if (!valid && start !== null) {
      const seg = days.slice(start, i);
      windows.push({
        start: fromDay(min + start),
        end: fromDay(min + i - 1),
        nights: i - start - 1,
        allPreferred: seg.every((v) => v === 2),
      });
      start = null;
    }
  }
  windows.sort((a, b) => b.allPreferred - a.allPreferred || b.nights - a.nights);
  return { windows, respondents: withDates.length };
}

function tally(values) {
  const counts = {};
  for (const v of values) if (v != null && v !== '') counts[v] = (counts[v] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function computeResults(responses) {
  const n = responses.length;

  // budget : le plafond contraignant = le plus bas
  const budgets = responses.map((r) => Number(r.budget)).filter((x) => x > 0);
  const bindingBudget = budgets.length ? Math.min(...budgets) : null;

  // poids moyens par critere
  const avgWeights = {};
  for (const c of CRITERIA) {
    const vals = responses.map((r) => Number(r.weights?.[c.key])).filter((x) => !isNaN(x));
    avgWeights[c.key] = vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : 0;
  }
  const weightSum = Object.values(avgWeights).reduce((s, x) => s + x, 0) || 1;

  // score pondere de chaque destination + filtre budget
  const groupSize = PARTICIPANTS.length;
  const ranked = DESTINATIONS.map((d) => {
    let raw = 0;
    for (const c of CRITERIA) raw += (avgWeights[c.key] || 0) * (d.scores[c.key] || 0);
    const match = Math.round((raw / (weightSum * 5)) * 100); // 0-100%
    // Villes accessibles en voiture : trajet gratuit, on retire la part
    // transport et on ajoute seulement le parking (partage par la voiture).
    const parkingPerPerson = d.drivable ? Math.round((d.parking || 0) / groupSize) : 0;
    const effectiveCost = d.drivable
      ? d.cost - (d.transport || 0) + parkingPerPerson
      : d.cost;
    const overBudget = bindingBudget != null && effectiveCost > bindingBudget;
    return { ...d, match, effectiveCost, parkingPerPerson, overBudget };
  }).sort((a, b) => a.overBudget - b.overBudget || b.match - a.match);

  return {
    participants: PARTICIPANTS,
    responded: responses.map((r) => r.name),
    count: n,
    bindingBudget,
    avgWeights,
    criteria: CRITERIA,
    ranked,
    dateOverlap: computeDateOverlap(responses),
    duration: tally(responses.map((r) => r.duration)),
    lodging: tally(responses.map((r) => r.lodging)),
    combined: tally(responses.map((r) => r.combined)),
    ideas: responses.filter((r) => r.ideas).map((r) => ({ name: r.name, ideas: r.ideas })),
  };
}

app.listen(PORT, () => {
  console.log(`Sondage en ligne : http://localhost:${PORT}`);
  console.log(`Stockage : ${usingPostgres ? 'Postgres (DATABASE_URL)' : 'fichier JSON local'}`);
});
