import { esc } from '../js/util.js';
import { callMeAssistant } from './coach.js';

export async function mountChat(app, sb, userId, isCurrent) {
  const status = await callMeAssistant(sb, { action: 'status' });
  if (!isCurrent()) return;
  const key = `irenu-me-chats:${userId}`;
  let chats = [];
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(stored)) chats = stored;
  } catch { /* A fresh chat remains available when storage is disabled. */ }
  const models = status.models.length ? status.models : [{ id: status.defaultModel, label: status.defaultModel }];
  let active = chats[0]?.id;
  let busy = false;
  let storageError = false;
  const root = document.createElement('div');
  root.className = 'me-sections chat-view';
  app.replaceChildren(root);

  function save() {
    try { localStorage.setItem(key, JSON.stringify(chats)); } catch { storageError = true; }
  }

  function createChat() {
    const chat = {
      id: crypto.randomUUID(), title: 'Новый чат', model: status.defaultModel,
      context: status.profile || '', messages: [],
    };
    chats = [chat, ...chats];
    active = chat.id;
    save();
  }

  function render() {
    const chat = chats.find(({ id }) => id === active);
    root.innerHTML = `
      <div class="chat-layout">
        <aside class="me-panel chat-sidebar">
          <button class="btn block" type="button" data-new>Новый чат</button>
          <label class="field"><span>Чаты на этом устройстве</span>
            <select data-chats>${chats.map(({ id, title }) =>
              `<option value="${esc(id)}" ${id === chat.id ? 'selected' : ''}>${esc(title)}</option>`).join('')}</select>
          </label>
        </aside>
        <section class="me-sections">
          <label class="field"><span>Модель</span><select data-model>
            ${models.map(({ id, label }) => `<option value="${esc(id)}" ${id === chat.model ? 'selected' : ''}>${esc(label)}</option>`).join('')}
          </select></label>
          <details class="me-panel">
            <summary>Контекст чата</summary>
            <label class="field"><span>О тебе и задаче</span><textarea data-context rows="4" maxlength="1500">${esc(chat.context)}</textarea></label>
            <p class="hint">Этот текст отправляется выбранной модели с каждым сообщением этого чата.</p>
          </details>
          <div class="coach-log" role="log" aria-label="Переписка">
            ${chat.messages.map(({ role, content }) => `<section class="me-panel">
              <h2>${role === 'user' ? 'Ты' : 'Помощник'}</h2><p class="coach-message">${esc(content)}</p>
            </section>`).join('')}
          </div>
          <form class="stack-form">
            <label class="field"><span>Сообщение</span><textarea name="message" rows="3" maxlength="4000" required placeholder="Например: набросай структуру презентации"></textarea></label>
            <p class="error" role="alert">${storageError ? 'История не сохранилась на устройстве.' : ''}</p>
            <button class="btn primary block" type="submit" ${status.ready ? '' : 'disabled'}>Отправить</button>
          </form>
        </section>
      </div>`;
    root.querySelector('[data-new]').onclick = () => { if (!busy) { createChat(); render(); } };
    root.querySelector('[data-chats]').onchange = (event) => { active = event.target.value; render(); };
    root.querySelector('[data-model]').onchange = (event) => { chat.model = event.target.value; save(); };
    root.querySelector('[data-context]').oninput = (event) => { chat.context = event.target.value; save(); };
    const form = root.querySelector('form');
    const send = form.querySelector('button');
    form.onsubmit = async (event) => {
      event.preventDefault();
      const content = form.elements.message.value.trim();
      if (!content || busy) return;
      busy = true;
      root.querySelectorAll('button, select, textarea').forEach((element) => { element.disabled = true; });
      send.textContent = 'Отвечаю…';
      const turn = { role: 'user', content };
      try {
        const result = await callMeAssistant(sb, {
          action: 'assistant', model: chat.model, context: chat.context,
          messages: [...chat.messages.slice(-7), turn].map((message) => ({ ...message, content: message.content.slice(0, 4000) })),
        });
        if (!chat.messages.length) chat.title = content.slice(0, 45);
        chat.messages.push(turn, { role: 'assistant', content: result.answer });
        save();
        if (isCurrent() && root.isConnected) render();
      } catch (error) {
        form.querySelector('.error').textContent = error.message;
        root.querySelectorAll('button, select, textarea').forEach((element) => { element.disabled = false; });
        send.textContent = 'Отправить';
      } finally { busy = false; }
    };
  }

  if (!active) createChat();
  render();
}
