import { esc } from '../js/util.js';

export function mountCoach(app, sb) {
  app.innerHTML = `
    <div class="me-sections coach">
      <p class="hint" data-connection role="status">Проверяю подключение…</p>
      <div class="coach-log" role="log" aria-label="Переписка с тренером"></div>
      <div data-draft></div>
      <form class="stack-form">
        <label class="field"><span>Сообщение тренеру</span>
          <textarea name="message" rows="3" maxlength="2000" required placeholder="Запиши: сегодня жим 60 кг, 3 подхода по 8"></textarea>
        </label>
        <label class="coach-comment"><input type="checkbox" name="history" disabled>
          <span>Передать последние записи из Google Таблицы в OpenAI для анализа</span>
        </label>
        <p class="error" role="alert"></p>
        <button class="btn primary block" disabled type="submit">Отправить</button>
      </form>
    </div>`;
  const view = app.querySelector('.coach');
  const form = view.querySelector('form');
  const { message, history } = form.elements;
  const log = view.querySelector('.coach-log');
  const draft = view.querySelector('[data-draft]');
  const errorLine = form.querySelector('.error');
  const send = form.querySelector('button');
  const connection = view.querySelector('[data-connection]');
  const messages = [];
  let canWrite = false;

  async function request(body) {
    const { data, error } = await sb.functions.invoke('me-coach', { body });
    if (error) {
      const detail = await error.context?.json?.().catch(() => null);
      const message = detail?.error || (error.context?.status === 404
        ? 'Сервер тренера ещё не подключён.'
        : 'Не удалось связаться с тренером. Попробуй позже.');
      throw new Error(message);
    }
    return data;
  }

  function addMessage(role, content) {
    const entry = document.createElement('section');
    entry.className = 'me-panel';
    entry.innerHTML = `<h2>${role === 'user' ? 'Ты' : 'Тренер'}</h2><p class="coach-message"></p>`;
    entry.lastElementChild.textContent = content;
    log.append(entry);
  }

  function showDraft({ columns, rows, entries }) {
    draft.innerHTML = `
      <section class="me-panel coach-draft">
        <h2>Черновик для Google Таблицы</h2>
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
        const result = await request({ action: 'append', entries });
        if (!view.isConnected) return;
        draft.replaceChildren();
        addMessage('assistant', `Запись добавлена в Google Таблицу (${result.range}).`);
        messages.push({ role: 'assistant', content: 'Предыдущий черновик уже записан в таблицу.' });
      } catch (error) {
        draft.querySelector('.error').textContent = error.message + ' Перед повторной попыткой проверь таблицу.';
        save.textContent = 'Запись не подтверждена';
        cancel.disabled = false;
      } finally {
        send.disabled = false;
      }
    };
  }

  request({ action: 'status' }).then((status) => {
    history.disabled = !status.canRead;
    canWrite = status.canWrite;
    if (!status.ready) {
      connection.textContent = 'Тренер появится после подключения ключа OpenAI в Supabase.';
      return;
    }
    connection.textContent = canWrite
      ? 'Можно разбирать историю и записывать тренировки в Google Таблицу.'
        : 'Тренер подключён. Google Таблица пока не настроена.';
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
        messages: [...messages.slice(-7), turn],
        useHistory: history.checked,
        today: date.toISOString().slice(0, 10),
      });
      if (!view.isConnected) return;
      addMessage('user', content);
      addMessage('assistant', result.answer);
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
