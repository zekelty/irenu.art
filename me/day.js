import { esc } from '../js/util.js';
import { callMeAssistant, showChatPending } from './coach.js';

const dateLabel = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeZone: 'UTC' });
const pageSize = 20;

function today() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function formatDay(summary = {}) {
  const { mood, events, reflection, feedback } = summary;
  return `
    ${mood ? `<p><b>Настроение</b> · ${esc(mood)}</p>` : ''}
    ${Array.isArray(events) && events.length ? `<h3>Что произошло</h3>
      <ul>${events.map((event) => `<li>${esc(event)}</li>`).join('')}</ul>` : ''}
    ${reflection ? `<h3>Итог дня</h3><p>${esc(reflection)}</p>` : ''}
    ${feedback ? `<h3>Отклик</h3><p>${esc(feedback)}</p>` : ''}`;
}

export function mountDayReview(app, sb) {
  app.innerHTML = `
    <div class="me-sections day-review">
      <form class="stack-form me-panel">
        <label class="field"><span>Дата</span><input type="date" name="date" value="${today()}" required></label>
        <label class="field"><span>Как прошёл день?</span>
          <textarea name="note" rows="5" maxlength="4000" placeholder="Что получилось, что не пошло и как ты себя чувствовал?" required></textarea>
        </label>
        <p class="hint" data-provider></p>
        <p class="error" role="alert"></p>
        <button class="btn primary block" type="submit" disabled>Подвести итог</button>
      </form>
      <div data-day-draft></div>
      <section class="me-sections">
        <h2 class="group-title">Мои записи</h2>
        <div data-day-list class="me-sections"></div>
        <button class="btn block" type="button" data-more-days hidden>Показать ещё</button>
      </section>
    </div>`;
  const view = app.querySelector('.day-review');
  const form = view.querySelector('form');
  const { date, note } = form.elements;
  const errorLine = form.querySelector('.error');
  const submit = form.querySelector('button');
  const draft = view.querySelector('[data-day-draft]');
  const list = view.querySelector('[data-day-list]');
  const more = view.querySelector('[data-more-days]');
  let offset = 0;

  async function loadDays(append = false) {
    const from = append ? offset : 0;
    more.disabled = true;
    if (!append) list.innerHTML = '<p class="hint">Загружаю записи…</p>';
    try {
      const { data, error } = await sb.from('me_day_entries').select('id,date,note,summary')
        .order('date', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false })
        .range(from, from + pageSize);
      if (error) throw error;
      if (!view.isConnected) return;
      const entries = data.slice(0, pageSize).map(({ date, note, summary }) => `
        <details class="me-panel day-entry">
          <summary><b>${esc(summary?.title || 'Итоги дня')}</b><small>${dateLabel.format(new Date(date))}</small></summary>
          ${formatDay(summary || {})}
          <details><summary>Исходная запись</summary><p>${esc(note)}</p></details>
        </details>`).join('');
      if (append) list.insertAdjacentHTML('beforeend', entries);
      else list.innerHTML = entries || '<p class="hint">Здесь появятся сохранённые итоги.</p>';
      offset = from + pageSize;
      more.hidden = data.length <= pageSize;
    } catch {
      if (!append) list.innerHTML = '<p class="hint">Не удалось загрузить записи.</p>';
      else list.insertAdjacentHTML('beforeend', '<p class="hint">Не удалось загрузить следующую страницу.</p>');
    } finally { more.disabled = false; }
  }

  more.onclick = () => loadDays(true);
  loadDays();
  callMeAssistant(sb, { action: 'status' }).then(({ ready, provider }) => {
    submit.disabled = !ready;
    view.querySelector('[data-provider]').textContent = ready
      ? `Для черновика текст отправляется в ${provider}. Итог сохраняется после подтверждения.`
      : 'Модель пока недоступна.';
  }).catch((error) => { errorLine.textContent = error.message; });

  function showReview(entry) {
    draft.innerHTML = `<section class="me-panel day-entry">
      <h2>${esc(entry.summary.title)}</h2>
      <p class="hint">${dateLabel.format(new Date(entry.date))} · черновик</p>
      ${formatDay(entry.summary)}
      <div class="row-btns"><button class="btn primary" type="button" data-save>Сохранить итог</button>
        <button class="btn" type="button" data-cancel>Отменить</button></div>
      <p class="error" role="alert"></p>
    </section>`;
    const save = draft.querySelector('[data-save]');
    const cancel = draft.querySelector('[data-cancel]');
    cancel.onclick = () => draft.replaceChildren();
    save.onclick = async () => {
      save.disabled = cancel.disabled = submit.disabled = true;
      save.textContent = 'Сохраняю…';
      try {
        const { error } = await sb.from('me_day_entries').upsert(entry, { onConflict: 'id', ignoreDuplicates: true });
        if (error) throw error;
        if (!view.isConnected) return;
        draft.innerHTML = '<p class="hint" role="status">Итог дня сохранён.</p>';
        if (note.value.trim() === entry.note) note.value = '';
        await loadDays();
      } catch {
        draft.querySelector('.error').textContent = 'Не удалось сохранить итог. Попробуй ещё раз.';
        save.textContent = 'Повторить сохранение';
        save.disabled = cancel.disabled = false;
      } finally { submit.disabled = false; }
    };
  }

  form.onsubmit = async (event) => {
    event.preventDefault();
    const text = note.value.trim();
    if (!text || submit.disabled) return;
    const selectedDate = date.value;
    note.blur();
    submit.disabled = true;
    errorLine.textContent = '';
    draft.replaceChildren();
    const pending = showChatPending(draft, 'Собираю итоги дня…');
    try {
      const { summary } = await callMeAssistant(sb, { action: 'day_review', date: selectedDate, note: text });
      if (view.isConnected) showReview({ id: crypto.randomUUID(), date: selectedDate, note: text, summary });
    } catch (error) { errorLine.textContent = error.message; }
    finally {
      pending.remove();
      submit.disabled = false;
    }
  };
}
