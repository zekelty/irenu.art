import { esc } from '../js/util.js';

export async function callMeAssistant(sb, body) {
  const { data, error } = await sb.functions.invoke('me-coach', { body });
  if (!error) return data;
  const detail = await error.context?.json?.().catch(() => null);
  throw new Error(detail?.error || (error.context?.status === 404
    ? 'Сервер ещё не подключён.'
    : 'Не удалось связаться с сервером. Попробуй позже.'));
}

export function mountCoach(app, sb) {
  app.innerHTML = `
    <div class="me-sections coach">
      <p class="hint" data-connection role="status">Проверяю подключение…</p>
      <a class="btn block" href="#/training">Журнал и прогресс тренировок</a>
      <div class="coach-log" role="log" aria-label="Переписка с Толиком"></div>
      <div data-draft></div>
      <form class="stack-form">
        <label class="field" data-model-field hidden><span>Модель</span><select name="model"></select></label>
        <label class="field"><span>Сообщение тренеру</span>
          <textarea name="message" rows="3" maxlength="2000" required placeholder="Запиши: сегодня жим 60 кг, 3 подхода по 8"></textarea>
        </label>
        <label class="coach-comment"><input type="checkbox" name="history" disabled>
          <span data-history-label>Передать последние записи тренировок модели для анализа</span>
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

  function addMessage(role, content) {
    const entry = document.createElement('section');
    entry.className = 'me-panel';
    entry.innerHTML = `<h2>${role === 'user' ? 'Ты' : 'Толик'}</h2><p class="coach-message"></p>`;
    entry.lastElementChild.textContent = content;
    log.append(entry);
  }

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
        addMessage('assistant', 'Тренировка сохранена в личном журнале.');
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
    const { provider, models, defaultModel } = status;
    if (provider) view.querySelector('[data-history-label]').textContent =
      `Передать последние записи тренировок в ${provider} для анализа`;
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
    send.disabled = true;
    send.textContent = 'Тренер отвечает…';
    errorLine.textContent = '';
    draft.replaceChildren();
    const turn = { role: 'user', content };
    try {
      const date = new Date();
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      const result = await request({
        action: 'chat',
        model: model.value || undefined,
        messages: [...messages.slice(-7), turn],
        useHistory: history.checked,
        today: date.toISOString().slice(0, 10),
      });
      if (!view.isConnected) return;
      addMessage('user', content);
      addMessage('assistant', result.answer);
      if (result.historyMissing) errorLine.textContent = 'Старая Google Таблица недоступна. Использованы записи личного журнала.';
      messages.push(turn, {
        role: 'assistant',
        content: JSON.stringify({ answer: result.answer, draft: result.draft?.entries }).slice(0, 2000),
      });
      message.value = '';
      if (result.draft && canWrite) showDraft(result.draft);
    } catch (error) {
      errorLine.textContent = error.message;
    } finally {
      send.disabled = false;
      send.textContent = 'Отправить';
    }
  });
}
