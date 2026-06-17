const $ = (sel) => document.querySelector(sel);
let selectedName = null;

async function init() {
  const cfg = await (await fetch('/api/config')).json();

  // participantes
  const who = $('#who');
  cfg.participants.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p;
    b.className = 'chip';
    b.onclick = () => {
      selectedName = p;
      document.querySelectorAll('.who .chip').forEach((c) => c.classList.remove('on'));
      b.classList.add('on');
    };
    who.appendChild(b);
  });

  // criteres -> sliders
  const weights = $('#weights');
  cfg.criteria.forEach((c) => {
    const row = document.createElement('label');
    row.className = 'weight';
    row.innerHTML = `<span>${c.label}</span>
      <input type="range" min="0" max="5" step="1" value="3" data-key="${c.key}" />
      <output>3</output>`;
    const input = row.querySelector('input');
    const out = row.querySelector('output');
    input.oninput = () => (out.textContent = input.value);
    weights.appendChild(row);
  });

  // budget
  const budget = $('#budget');
  budget.oninput = () => ($('#budgetOut').textContent = `${budget.value} €`);

  // dates : bouton "ajouter une periode"
  document.querySelectorAll('.dates-group .add').forEach((btn) => {
    btn.onclick = () => addRange(btn.previousElementSibling);
  });

  $('#form').onsubmit = submit;
}

function addRange(container) {
  const row = document.createElement('div');
  row.className = 'range';
  row.innerHTML = `<input type="date" class="start" />
    <span>→</span>
    <input type="date" class="end" />
    <button type="button" class="del" title="Supprimer">✕</button>`;
  row.querySelector('.del').onclick = () => row.remove();
  container.appendChild(row);
}

function collectRanges(kind) {
  const group = document.querySelector(`.dates-group[data-kind="${kind}"]`);
  return [...group.querySelectorAll('.range')]
    .map((r) => ({ start: r.querySelector('.start').value, end: r.querySelector('.end').value }))
    .filter((x) => x.start && x.end && x.start <= x.end);
}

async function submit(e) {
  e.preventDefault();
  const status = $('#status');
  if (!selectedName) {
    status.textContent = '👆 Choisis d’abord qui tu es.';
    status.className = 'status err';
    return;
  }
  const weights = {};
  document.querySelectorAll('#weights input').forEach((i) => (weights[i.dataset.key] = Number(i.value)));

  const payload = {
    name: selectedName,
    budget: Number($('#budget').value),
    dates: {
      preferred: collectRanges('preferred'),
      possible: collectRanges('possible'),
      nogo: collectRanges('nogo'),
    },
    weights,
    duration: $('#duration').value,
    lodging: $('#lodging').value,
    combined: $('#combined').value,
    ideas: $('#ideas').value.trim(),
  };

  const res = await fetch('/api/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    status.innerHTML = '✅ Merci ! Tes réponses sont enregistrées. <a href="results.html">Voir les résultats →</a>';
    status.className = 'status ok';
  } else {
    status.textContent = '❌ Une erreur est survenue.';
    status.className = 'status err';
  }
}

init();
