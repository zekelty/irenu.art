import { esc } from '../js/util.js';
import { COURSE_PREFIX, ENGLISH } from './english.js';

const percent = (score, total) => total ? Math.round(100 * score / total) : 0;
const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
const plural = new Intl.PluralRules('ru-RU');
const attemptWord = (count) => ({ one: 'попытка', few: 'попытки', many: 'попыток' }[plural.select(count)] || 'попыток');

export function testSummary(attempts) {
  const summaries = new Map();
  for (const attempt of attempts) {
    if (!summaries.has(attempt.test_id)) summaries.set(attempt.test_id, { count: 0, score: 0, total: 0, best: 0 });
    const result = summaries.get(attempt.test_id);
    result.count++;
    result.score += attempt.score;
    result.total += attempt.total;
    result.best = Math.max(result.best, percent(attempt.score, attempt.total));
  }
  return summaries;
}

function dayStart(daysAgo) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function activity(attempts, days) {
  const buckets = Array.from({ length: days }, (_, index) => {
    const start = dayStart(days - index - 1);
    return { date: shortDate.format(start), start, count: 0 };
  });
  for (const attempt of attempts) {
    const date = new Date(attempt.created_at);
    date.setHours(0, 0, 0, 0);
    const bucket = buckets.find((item) => +item.start === +date);
    if (bucket) bucket.count++;
  }
  if (!buckets.some((item) => item.count)) return '<p class="hint">За этот период попыток пока нет.</p>';
  const max = Math.max(...buckets.map((item) => item.count));
  return `<div class="activity-plot" aria-hidden="true">
      ${buckets.map(({ date, count }) => `<i style="--height:${count / max * 100}%" title="${date} · ${count}"></i>`).join('')}
    </div>
    <div class="activity-labels"><span>${buckets[0].date}</span><span>${buckets.at(-1).date}</span></div>
    <details><summary>Попытки по дням</summary>
      ${buckets.filter((item) => item.count).map((item) => `<div class="attempt"><span>${item.date}</span><b>${item.count}</b></div>`).join('')}
    </details>`;
}

function metrics(items) {
  return `<div class="stat-metrics">${items.map(([value, label]) => `
    <div class="me-panel"><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>`;
}

export function renderStats(app, { boards, tests, attempts }) {
  const testsById = new Map(tests.map((test) => [test.id, test]));
  const lessons = ENGLISH.flatMap((group) => group.lessons);
  const lessonKeys = new Set(lessons.map((lesson) => COURSE_PREFIX + lesson.slug));
  const allSummaries = testSummary(attempts);
  const completed = tests.filter((test) => lessonKeys.has(test.source_key) && allSummaries.get(test.id)?.best >= 80).length;
  const boardStats = boards.map((board) => {
    const columns = board.data?.columns || [];
    const total = columns.reduce((sum, column) => sum + (column.cards?.length || 0), 0);
    const done = columns.at(-1)?.cards?.length || 0;
    return { ...board, total, done, columns };
  }).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const newestFirst = [...attempts].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  app.innerHTML = `
    <div class="me-sections">
      <a class="tile cut" href="#/training"><b>Тренировки</b><small>Рабочий вес и история по упражнениям</small></a>
      <section aria-labelledby="study-stats">
        <div class="section-head">
          <h2 id="study-stats">Учёба</h2>
          <label class="stat-period"><span>Период</span><select>
            <option value="7">7 дней</option><option value="30" selected>30 дней</option>
            <option value="90">90 дней</option><option value="0">Всё время</option>
          </select></label>
        </div>
        <div id="study-details"></div>
      </section>
      <section aria-labelledby="english-stats">
        <h2 class="group-title" id="english-stats">Курс английского</h2>
        <a class="tile cut" href="#/english"><b>${completed} / ${lessons.length}</b><small>Уроков зачтено за всё время</small>
          <span class="bar"><i style="width:${percent(completed, lessons.length)}%"></i></span></a>
      </section>
      <section aria-labelledby="board-stats">
        <h2 class="group-title" id="board-stats">Доски сейчас</h2>
        ${metrics([
          [boards.length, 'Досок'],
          [boardStats.reduce((sum, board) => sum + board.total, 0), 'Карточек'],
          [boardStats.reduce((sum, board) => sum + board.done, 0), 'В последних колонках'],
        ])}
        <div class="tiles spaced-tiles">${boardStats.map((board) => `
          <a class="tile cut" href="#/board/${esc(board.id)}">
            <b>${esc(board.title)}</b>
            <small>${board.columns.map((column) => `${esc(column.title)} · ${column.cards?.length || 0}`).join(' / ') || 'Нет колонок'}</small>
            <small>Обновлено ${fullDate.format(new Date(board.updated_at))}</small>
            <span class="bar"><i style="width:${percent(board.done, board.total)}%"></i></span>
          </a>`).join('')}</div>
        ${boards.length ? '' : '<p class="hint">После создания доски здесь появятся её карточки.</p>'}
      </section>
    </div>`;

  const period = app.querySelector('.stat-period select');
  const details = app.querySelector('#study-details');
  const renderPeriod = () => {
    const days = Number(period.value);
    const from = days ? dayStart(days - 1) : null;
    const filtered = from ? newestFirst.filter((row) => new Date(row.created_at) >= from) : newestFirst;
    const results = testSummary(filtered);
    const correct = filtered.reduce((sum, row) => sum + row.score, 0);
    const total = filtered.reduce((sum, row) => sum + row.total, 0);
    const chartDays = Math.min(days || 30, 30);
    details.innerHTML = `
      ${metrics([[filtered.length, 'Попыток'], [results.size, 'Тестов и уроков'], [total ? percent(correct, total) + '%' : '—', 'Правильных ответов']])}
      <section class="me-panel stat-chart"><h3>Активность за последние ${chartDays} дней</h3>${activity(filtered, chartDays)}</section>
      ${filtered.length ? `
        <details class="me-panel">
          <summary>Результаты по тестам и урокам</summary>
          ${[...results].map(([id, result]) => {
            const test = testsById.get(id);
            const lesson = test?.source_key?.startsWith(COURSE_PREFIX);
            const href = lesson ? `#/english/${esc(test.source_key.slice(COURSE_PREFIX.length))}` : `#/test/${esc(id)}`;
            return `<a class="attempt stat-row" href="${href}"><span>${esc(test?.title || 'Тест')}<small>${result.count} ${attemptWord(result.count)} · в среднем ${percent(result.score, result.total)}%</small></span>
              <b>${result.best}%</b></a>`;
          }).join('')}
        </details>
        <section class="me-panel recent-attempts">
          <h3>Последние попытки</h3>
          ${filtered.slice(0, 10).map((row) => `
            <div class="attempt stat-row"><span>${esc(testsById.get(row.test_id)?.title || 'Тест')}<small>${fullDate.format(new Date(row.created_at))}</small></span>
              <b>${row.score} / ${row.total} · ${percent(row.score, row.total)}%</b></div>`).join('')}
        </section>` : ''}`;
  };
  period.addEventListener('change', renderPeriod);
  renderPeriod();
}
