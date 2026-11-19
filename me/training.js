import { esc } from '../js/util.js';

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const formatDate = (value) => dateFormat.format(new Date(value));
const formatWeight = (value) => value === null ? '—' : number.format(value) + ' кг';
const totalSets = (entries) => entries.reduce((total, { sets }) => total + sets, 0);
const totalReps = (entries) => entries.reduce((total, { sets, reps }) => total + sets * reps, 0);

function recordedVolume(entries) {
  const weighted = entries.filter(({ weight_kg }) => weight_kg !== null);
  return weighted.length
    ? weighted.reduce((sum, { weight_kg, reps, sets }) => sum + weight_kg * reps * sets, 0) : null;
}

function byExercise(workouts) {
  const exercises = new Map();
  for (const workout of workouts) {
    const key = workout.exercise.trim().toLowerCase().replace(/\s+/g, ' ').replaceAll('ё', 'е');
    if (!exercises.has(key)) exercises.set(key, { title: workout.exercise, days: new Map() });
    const { days } = exercises.get(key);
    if (!days.has(workout.date)) days.set(workout.date, []);
    days.get(workout.date).push(workout);
  }
  return Array.from(exercises.values()).sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

function topSet(entries) {
  return entries.filter((entry) => entry.weight_kg !== null).reduce((best, entry) =>
    !best || entry.weight_kg > best.weight_kg || (entry.weight_kg === best.weight_kg && entry.reps > best.reps) ? entry : best, null);
}

const chartMetrics = {
  weight: { label: 'Максимальный вес', value: (day) => day.top?.weight_kg ?? null, format: formatWeight },
  reps: { label: 'Всего повторений', value: (day) => totalReps(day.entries), format: (value) => number.format(value) + ' повт.' },
  volume: { label: 'Объём по указанным весам', value: (day) => recordedVolume(day.entries), format: formatWeight },
};

function compareLatest(days) {
  const latestDay = days.find(({ top }) => top);
  if (!latestDay) return '<p class="hint">Для сравнения нужны записи с весом.</p>';
  const reference = latestDay.top;
  const comparableLoad = (row) => row.weight_kg === reference.weight_kg && row.rir === reference.rir;
  const comparableReps = (row) => row.reps === reference.reps && row.rir === reference.rir && row.weight_kg !== null;
  for (const day of days.filter(({ date }) => date < latestDay.date)) {
    const sameLoad = day.entries.filter(comparableLoad).sort((a, b) => b.reps - a.reps)[0];
    const sameReps = topSet(day.entries.filter(comparableReps));
    const previous = sameLoad || sameReps;
    if (!previous) continue;
    return `
      <p>${sameLoad ? 'Одинаковый вес' : 'Одинаковое число повторов'} · ${reference.rir === null ? 'RIR не указан в обеих записях' : `RIR ${reference.rir}`}</p>
      <div class="attempt stat-row"><span>${formatDate(day.date)}</span><b>${formatWeight(previous.weight_kg)} × ${previous.reps}</b></div>
      <div class="attempt stat-row"><span>${formatDate(latestDay.date)}</span><b>${formatWeight(reference.weight_kg)} × ${reference.reps}</b></div>`;
  }
  return '<p class="hint">Для последнего тяжёлого подхода пока нет предыдущей записи с таким же весом или числом повторов и таким же RIR.</p>';
}

export function renderTraining(app, { workouts, historyMissing }, fromCoach = false) {
  const exercises = byExercise(workouts);
  app.innerHTML = `
    <div class="me-sections">
      <a class="btn primary block" href="#/coach">Записать тренировку</a>
      ${historyMissing ? '<p class="hint">Старая Google Таблица сейчас недоступна. Показаны записи личного журнала.</p>' : ''}
      ${exercises.length ? `
        <label class="field"><span>Упражнение</span><select id="training-movement">
          ${exercises.map(({ title }, index) => `<option value="${index}">${esc(title)}</option>`).join('')}
        </select></label>
        <div class="me-sections" id="training-results"></div>
      ` : '<p class="empty-note">В журнале пока нет тренировок</p>'}
    </div>`;
  if (!exercises.length) return;
  const select = app.querySelector('#training-movement');
  const results = app.querySelector('#training-results');
  function renderExercise() {
    const exercise = exercises[Number(select.value)];
    const days = [...exercise.days].map(([date, entries]) =>
      ({ date, entries, top: topSet(entries) })).sort((a, b) => b.date.localeCompare(a.date));
    const all = days.flatMap(({ entries }) => entries);
    const record = topSet(all);
    const last = days.find(({ top }) => top)?.top ?? null;
    const exercisePath = `#/coach/${esc(encodeURIComponent(exercise.title))}`;
    const origin = fromCoach ? '/coach' : '';
    const bestByReps = new Map();
    for (const row of all) {
      if (row.weight_kg === null) continue;
      if (!bestByReps.has(row.reps) || bestByReps.get(row.reps).weight_kg < row.weight_kg) bestByReps.set(row.reps, row);
    }
    results.innerHTML = `
      <div class="stat-metrics">
        <div class="me-panel"><strong>${days.length}</strong><span>Тренировочных дней</span></div>
        <div class="me-panel"><strong>${totalSets(all)}</strong><span>Записанных подходов</span></div>
        <div class="me-panel"><strong>${formatWeight(record?.weight_kg ?? null)}</strong><span>Максимальный записанный вес</span></div>
      </div>
      <section class="me-panel me-sections exercise-help">
        <h2>Спросить Толика по журналу</h2>
        <div class="row-btns">
          <a class="btn primary" href="${exercisePath}/weight${origin}">Какой вес взять сегодня?</a>
          <a class="btn" href="${exercisePath}/progress${origin}">Как прогрессировать?</a>
        </div>
      </section>
      <section class="me-panel">
        <div class="section-head">
          <h2>Динамика по дням</h2>
          <label class="stat-period"><span>Показатель</span><select data-metric>
            ${Object.entries(chartMetrics).map(([key, { label }]) => `<option value="${key}" ${key === (last ? 'weight' : 'reps') ? 'selected' : ''}>${label}</option>`).join('')}
          </select></label>
        </div>
        <div data-series></div>
      </section>
      <section class="me-panel"><h2>Сравнение подходов</h2>${compareLatest(days)}</section>
      ${bestByReps.size ? `<section class="me-panel"><h2>Максимальный вес по числу повторов</h2>
        ${[...bestByReps.values()].sort((a, b) => a.reps - b.reps).map(({ date, reps, weight_kg }) => `
          <div class="attempt stat-row"><span>${reps} повт.<small>${formatDate(date)}</small></span><b>${formatWeight(weight_kg)}</b></div>`).join('')}
      </section>` : ''}
      <section class="me-panel">
        <h2>История по дням</h2>
        ${days.map(({ date, entries, top }) => `
          <details class="training-day">
            <summary><b>${formatDate(date)}</b><span>${totalSets(entries)} подх. · ${totalReps(entries)} повт.${top ? ` · максимум ${formatWeight(top.weight_kg)}` : ''}</span></summary>
            ${entries.map(({ sets, reps, weight_kg, rir, notes }) => `
              <div class="attempt stat-row"><span>${sets} × ${reps}${rir === null ? '' : ` · RIR ${rir}`}${notes ? `<small>${esc(notes)}</small>` : ''}</span>
                <b>${formatWeight(weight_kg)}</b></div>`).join('')}
          </details>`).join('')}
      </section>`;
    const metricSelect = results.querySelector('[data-metric]');
    const series = results.querySelector('[data-series]');
    const renderSeries = () => {
      const metric = chartMetrics[metricSelect.value];
      const chart = days.slice(0, 12).reverse().map((day) => ({ date: day.date, value: metric.value(day) }));
      const maximum = Math.max(1, ...chart.map(({ value }) => value ?? 0));
      series.innerHTML = `
        ${metricSelect.value === 'volume' ? '<p class="hint">Сумма: указанный вес × повторы × подходы. Записи без веса пропущены.</p>' : ''}
        <ul class="exercise-series" aria-label="${metric.label} по дням">
          ${chart.map(({ date, value }) => `<li>
            <time datetime="${date}">${shortDate.format(new Date(date))}</time>
            <span class="exercise-meter" aria-hidden="true"><i style="width:${(value ?? 0) / maximum * 100}%"></i></span>
            <b>${value === null ? 'Нет веса' : metric.format(value)}</b>
          </li>`).join('')}
        </ul>
        ${days.length > 12 ? '<p class="hint">Показаны последние 12 тренировочных дней.</p>' : ''}`;
    };
    metricSelect.addEventListener('change', renderSeries);
    renderSeries();
  }
  select.addEventListener('change', renderExercise);
  renderExercise();
}
