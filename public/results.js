const $ = (s) => document.querySelector(s);

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  });

function bar(pct) {
  return `<div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>`;
}

function renderTally(el, entries) {
  el.innerHTML = entries.length
    ? entries.map(([k, v]) => `<div class="tally"><span>${k}</span><b>${v}</b></div>`).join('')
    : '<span class="hint">—</span>';
}

async function load() {
  const r = await (await fetch('/api/results')).json();

  $('#who').textContent = r.count
    ? `${r.count}/${r.participants.length} ont répondu : ${r.responded.join(', ')}`
    : '';

  if (!r.count) {
    $('#empty').classList.remove('hidden');
    $('#content').classList.add('hidden');
    return;
  }
  $('#empty').classList.add('hidden');
  $('#content').classList.remove('hidden');

  // destinations
  $('#ranked').innerHTML = r.ranked
    .map(
      (d) => `<div class="dest ${d.overBudget ? 'over' : ''}">
        <div class="dest-head">
          <span class="dest-name">${d.emoji} ${d.name} <small>${d.country}</small></span>
          <span class="dest-match">${d.match}%</span>
        </div>
        ${bar(d.match)}
        <p class="dest-note">${d.note}</p>
        <p class="dest-cost">~${d.cost} € ${d.overBudget ? '· ⚠️ au-dessus du budget commun' : ''}</p>
      </div>`
    )
    .join('');

  // dates
  const dates = $('#dates');
  const ov = r.dateOverlap;
  if (!ov.respondents) {
    dates.innerHTML = '<p class="hint">En attente de vos disponibilités…</p>';
  } else if (!ov.windows.length) {
    dates.innerHTML = `<p class="warn">😬 Aucune fenêtre commune trouvée pour l'instant (${ov.respondents} réponse(s) avec dates). Il faudra assouplir une contrainte.</p>`;
  } else {
    dates.innerHTML = ov.windows
      .map(
        (w) => `<div class="window ${w.allPreferred ? 'pref' : ''}">
          <b>${fmtDate(w.start)} → ${fmtDate(w.end)}</b>
          <span>${w.nights} nuit(s)</span>
          ${w.allPreferred ? '<span class="badge">idéal pour tout le monde</span>' : '<span class="badge soft">possible</span>'}
        </div>`
      )
      .join('');
  }

  // budget
  $('#budget').textContent = r.bindingBudget != null ? `${r.bindingBudget} € / personne` : '—';

  // poids
  $('#weights').innerHTML = r.criteria
    .map((c) => {
      const v = r.avgWeights[c.key] || 0;
      return `<label class="weight-res"><span>${c.label}</span>${bar((v / 5) * 100)}<output>${v.toFixed(1)}</output></label>`;
    })
    .join('');

  renderTally($('#duration'), r.duration);
  renderTally($('#lodging'), r.lodging);
  renderTally($('#combined'), r.combined);

  const ideasBlock = $('#ideas-block');
  if (r.ideas.length) {
    ideasBlock.classList.remove('hidden');
    $('#ideas').innerHTML = r.ideas.map((i) => `<div class="tally"><span>${i.name}</span> ${i.ideas}</div>`).join('');
  } else {
    ideasBlock.classList.add('hidden');
  }
}

load();
setInterval(load, 4000);
