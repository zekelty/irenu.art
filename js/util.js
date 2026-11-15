export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Текст → абзацы: пустая строка = новый абзац, перенос строки = <br>
export function paragraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Пропускаем только http(s), mailto, tg и относительные ссылки
export function safeUrl(url) {
  const u = String(url ?? '').trim();
  if (/^(https?:|mailto:|tg:)/i.test(u) || /^[./#]/.test(u)) return u;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return `https://${u}`;
  return '#';
}

export function hue(str) {
  let h = 0;
  for (const ch of String(str ?? '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h % 360;
}

export function initials(name, max = 2) {
  return String(name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, max)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase() || '?';
}

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// "Telegram | https://t.me/x" построчно ⇄ [{label,url}]
export function linksToText(links) {
  return (links || []).map((l) => (l.label && l.label !== l.url ? `${l.label} | ${l.url}` : l.url)).join('\n');
}
export function textToLinks(text) {
  return String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('|');
      if (i === -1) return { label: line, url: line };
      return { label: line.slice(0, i).trim(), url: line.slice(i + 1).trim() };
    });
}
