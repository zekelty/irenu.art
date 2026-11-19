import { esc } from '../js/util.js';

export async function callMeAssistant(sb, body) {
  const { data, error } = await sb.functions.invoke('me-coach', { body });
  if (!error) return data;
  const detail = await error.context?.json?.().catch(() => null);
  throw new Error(detail?.error || (error.context?.status === 404
    ? 'Сервер ещё не подключён.'
    : 'Не удалось связаться с сервером. Попробуй позже.'));
}

export function appendChatMessage(log, author, content) {
  const entry = document.createElement('section');
  entry.className = 'me-panel chat-bubble';
  entry.innerHTML = '<h2></h2><p class="coach-message"></p>';
  entry.firstElementChild.textContent = author;
  entry.lastElementChild.textContent = content;
  log.append(entry);
  return entry;
}

export function showChatPending(log, label) {
  const pending = document.createElement('div');
  pending.className = 'me-panel chat-pending';
  pending.setAttribute('role', 'status');
  pending.innerHTML = '<span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span><span></span>';
  pending.lastElementChild.textContent = label;
  log.append(pending);
  requestAnimationFrame(() => {
    if (pending.isConnected) pending.scrollIntoView({ block: 'nearest' });
  });
  return pending;
}

export function mountCoach(app, sb, userId, { exercise = '', mode } = {}) {
  app.innerHTML = `
    <div class="me-sections coach">
      <p class="hint" data-connection role="status">Проверяю подключение…</p>
      <a class="btn block" href="#/training/coach">Журнал и прогресс тренировок</a>
      ${exercise ? `<p class="hint coach-focus">История упражнения: <b>${esc(exercise)}</b> · <a href="#/coach">Все упражнения</a></p>` : ''}
      <div class="coach-log" role="log" aria-label="Переписка с Толиком"></div>
      <div data-draft></div>
      <form class="stack-form">
        <label class="field" data-model-field hidden><span>Модель</span><select name="model"></select></label>
        <label class="field"><span>Сообщение тренеру</span>
          <textarea name="message" rows="3" maxlength="2000" required placeholder="Запиши: сегодня жим 60 кг, 3 подхода по 8"></textarea>
        </label>
        <label class="coach-comment"><input type="checkbox" name="history" disabled>
          <span data-history-label>Добавлять журнал и программу тренировок к запросу</span>
        </label>
        <p class="error" role="alert"></p>
        <button class="btn primary block" disabled type="submit">Отправить</button>
      </form>
    </div>`;
  const view = app.querySelector('.coach');
  const form = view.querySelector('form');
  const { message, history, model } = form.elements;
  const log = view.querySelector('.coach-log');
  const draft = view.querySelector('[data-draft]');
  const errorLine = form.querySelector('.error');
  const send = form.querySelector('button');
  const connection = view.querySelector('[data-connection]');
  const messages = [];
  let canWrite = false;

  const request = (body) => callMeAssistant(sb, body);
  const historyKey = `irenu-me-training-history:${userId}`;
  try { history.checked = sessionStorage.getItem(historyKey) === 'on'; } catch { /* optional preference */ }
  if (exercise) {
    history.checked = true;
    message.value = mode === 'weight'
      ? `Какой рабочий вес взять сегодня в упражнении «${exercise}»? Укажи подходы и повторы по моему журналу и программе.`
      : `Как мне дальше прогрессировать в упражнении «${exercise}»? Сравни сопоставимые тренировки из журнала.`;
  }
  history.addEventListener('change', () => {
    try { sessionStorage.setItem(historyKey, history.checked ? 'on' : 'off'); } catch { /* optional preference */ }
  });

  function showDraft({ columns, rows, entries, sessionId }) {
    draft.innerHTML = `
      <section class="me-panel coach-draft">
        <h2>Черновик тренировки</h2>
        <div class="coach-draft-scroll"><table>
          <thead><tr>${columns.map((cell) => `<th scope="col">${esc(cell)}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
        <p class="hint">Для правки напиши её тренеру следующим сообщением.</p>
        <div class="row-btns">
          <button class="btn primary" type="button" data-save>Записать тренировку</button>
          <button class="btn" type="button" data-cancel>Отменить</button>
        </div>
        <p class="error" role="alert"></p>
      </section>`;
    const save = draft.querySelector('[data-save]');
    const cancel = draft.querySelector('[data-cancel]');
    cancel.onclick = () => { draft.replaceChildren(); };
    save.onclick = async () => {
      save.disabled = cancel.disabled = send.disabled = true;
      save.textContent = 'Записываю…';
      try {
        await request({ action: 'append', entries, sessionId });
        if (!view.isConnected) return;
        draft.replaceChildren();
        appendChatMessage(log, 'Толик', 'Тренировка сохранена в личном журнале.');
        messages.push({ role: 'assistant', content: 'Предыдущий черновик уже записан в личный журнал.' });
      } catch (error) {
        draft.querySelector('.error').textContent = error.message;
        save.textContent = 'Повторить запись';
        save.disabled = false;
        cancel.disabled = false;
      } finally {
        send.disabled = false;
      }
    };
  }

  request({ action: 'status' }).then((status) => {
    canWrite = status.canWrite;
    if (!status.ready) {
      connection.textContent = 'Тренер появится после подключения ключа провайдера в Supabase.';
      return;
    }
    history.disabled = !status.canRead;
    if (history.disabled) history.checked = false;
    const { provider, models, defaultModel } = status;
    if (provider) view.querySelector('[data-history-label]').textContent =
      `Добавлять журнал и программу тренировок к запросу в ${provider}`;
    if (models?.length) {
      model.replaceChildren(...models.map(({ id, label }) => new Option(label, id)));
      if (defaultModel) model.value = defaultModel;
      view.querySelector('[data-model-field]').hidden = false;
    }
    connection.textContent = canWrite
      ? 'Тренировки сохраняются в личном журнале.'
      : 'Тренер подключён. Личный журнал пока недоступен.';
    send.disabled = false;
  }).catch((error) => { connection.textContent = error.message; });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (send.disabled) return;
    const content = message.value.trim();
    if (!content) return;
    const useHistory = history.checked;
    message.blur();
    message.value = '';
    send.disabled = true;
    send.textContent = 'Толик отвечает…';
    errorLine.textContent = '';
    draft.replaceChildren();
    const turn = { role: 'user', content };
    const bubble = appendChatMessage(log, 'Ты', content);
    const pending = showChatPending(log, useHistory ? 'Толик анализирует журнал…' : 'Толик готовит ответ…');
    try {
      const date = new Date();
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      const result = await request({
        action: 'chat',
        model: model.value || undefined,
        exercise: exercise || undefined,
        messages: [...messages.slice(-7), turn],
        useHistory,
        today: date.toISOString().slice(0, 10),
      });
      if (!view.isConnected) return;
      const reply = appendChatMessage(log, 'Толик', result.answer);
      if (Number.isInteger(result.historyDays)) {
        const meta = document.createElement('p');
        meta.className = 'hint';
        meta.textContent = result.historyDays
          ? `В контексте тренировочных дней: ${result.historyDays}`
          : 'В журнале не нашлось записей для анализа.';
        reply.append(meta);
      }
      if (result.historyMissing) errorLine.textContent = 'Старая Google Таблица недоступна. Использованы записи личного журнала.';
      messages.push(turn, {
        role: 'assistant',
        content: JSON.stringify({ answer: result.answer, draft: result.draft?.entries }).slice(0, 2000),
      });
      if (result.draft && canWrite) showDraft(result.draft);
    } catch (error) {
      bubble.remove();
      if (!message.value) message.value = content;
      errorLine.textContent = error.message;
    } finally {
      pending.remove();
      send.disabled = false;
      send.textContent = 'Отправить';
    }
  });
}
