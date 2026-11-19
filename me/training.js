import { esc } from '../js/util.js';

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeZone: 'UTC' });
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const formatDate = (value) => dateFormat.format(new Date(value));
const formatWeight = (value) => value === null ? '—' : number.format(value) + ' кг';

function byExercise(workouts) {
  const exercises = new Map();
  for (const workout of workouts) {
    const key = workout.exercise.trim().toLowerCase().replace(/\s+/g, ' ');
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

export function renderTraining(app, { workouts, historyMissing }) {
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
    const days = [...exercises[Number(select.value)].days].map(([date, entries]) =>
      ({ date, entries, top: topSet(entries) })).sort((a, b) => b.date.localeCompare(a.date));
    const weighted = days.filter(({ top }) => top);
    const record = topSet(days.flatMap(({ entries }) => entries));
    const lastWeight = weighted[0]?.top.weight_kg ?? null;
    const change = weighted.length > 1 ? lastWeight - weighted.at(-1).top.weight_kg : null;
    const chart = (weighted.length ? weighted : days).slice(0, 14).reverse().map(({ date, top, entries }) => ({
      date, value: top ? top.weight_kg : entries.reduce((sum, entry) => sum + entry.sets * entry.reps, 0),
    }));
    const maximum = Math.max(1, ...chart.map(({ value }) => value));
    results.innerHTML = `
      <div class="stat-metrics">
        <div class="me-panel"><strong>${formatWeight(lastWeight)}</strong><span>Последний макс. вес</span></div>
        <div class="me-panel"><strong>${formatWeight(record?.weight_kg ?? null)}</strong><span>Рекорд</span></div>
        <div class="me-panel"><strong>${change > 0 ? '+' : ''}${formatWeight(change)}</strong><span>С первой записи</span></div>
      </div>
      ${chart.length > 1 ? `<section class="me-panel">
        <h2>${weighted.length ? 'Максимальный вес по дням' : 'Повторения по дням'}</h2>
        <div class="activity-plot" aria-hidden="true">${chart.map(({ date, value }) =>
          `<i style="--height:${value / maximum * 100}%" title="${formatDate(date)} · ${weighted.length ? formatWeight(value) : value}"></i>`).join('')}</div>
        <div class="activity-labels"><span>${formatDate(chart[0].date)}</span><span>${formatDate(chart.at(-1).date)}</span></div>
      </section>` : ''}
      <section class="me-panel">
        <h2>История по дням</h2>
        ${days.map(({ date, entries, top }) => `
          <details class="training-day">
            <summary><b>${formatDate(date)}</b><span>${top ? `${formatWeight(top.weight_kg)} × ${top.reps}` : `${entries.reduce((sum, entry) => sum + entry.sets * entry.reps, 0)} повт.`}</span></summary>
            ${entries.map(({ sets, reps, weight_kg, rir, notes }) => `
              <div class="attempt stat-row"><span>${sets} × ${reps}${rir === null ? '' : ` · RIR ${rir}`}${notes ? `<small>${esc(notes)}</small>` : ''}</span>
                <b>${formatWeight(weight_kg)}</b></div>`).join('')}
          </details>`).join('')}
      </section>`;
  }
  select.addEventListener('change', renderExercise);
  renderExercise();
}
