(function () {
  'use strict';
  var ENDPOINT = 'https://hoi-loc.2k3xsleep.workers.dev/ask';
  var AVATAR = 'assets/chat-avatar.jpg';
  var CHIPS = [
    'Lộc đang làm ở đâu?',
    'Moma Portal là gì?',
    'Kỹ năng của Lộc là gì?',
    'Lộc có dự án cá nhân nào?',
    'Liên hệ với Lộc thế nào?'
  ];
  var GREETING = 'Chào bạn, mình là Hỏi Lộc — trợ lý AI của Lộc. Bạn muốn biết gì về công việc, dự án hay kinh nghiệm của Lộc? Cứ hỏi mình nhé.';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function linkify(escaped) {
    return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  var fab = document.createElement('button');
  fab.className = 'hl-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Mở khung chat Hỏi Lộc');
  fab.innerHTML = '<img src="' + AVATAR + '" alt=""><span>Hỏi Lộc</span><i class="hl-dot"></i>';

  var panel = document.createElement('section');
  panel.className = 'hl-panel';
  panel.setAttribute('aria-label', 'Chatbot Hỏi Lộc');
  panel.innerHTML =
    '<div class="hl-head"><img src="' + AVATAR + '" alt="Avatar Hỏi Lộc"><div class="hl-titles"><b>Hỏi Lộc</b><small>Trợ lý AI · trả lời về Lộc và công việc</small></div><button class="hl-close" type="button" aria-label="Đóng">✕</button></div>' +
    '<div class="hl-body"></div>' +
    '<div class="hl-typing"><i></i><i></i><i></i></div>' +
    '<div class="hl-chips"></div>' +
    '<form class="hl-form"><input type="text" maxlength="300" placeholder="Hỏi về Lộc…" autocomplete="off"><button type="submit">Gửi</button></form>' +
    '<p class="hl-note">AI có thể trả lời chưa chính xác — thông tin chính thức ở các mục trên trang.</p>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var body = panel.querySelector('.hl-body');
  var typing = panel.querySelector('.hl-typing');
  var chipsBox = panel.querySelector('.hl-chips');
  var form = panel.querySelector('.hl-form');
  var input = panel.querySelector('input');
  var sendBtn = panel.querySelector('.hl-form button');
  var history = [];
  var greeted = false;
  var busy = false;

  function addMsg(role, text) {
    var d = document.createElement('div');
    d.className = 'hl-msg ' + (role === 'user' ? 'user' : 'bot');
    d.innerHTML = linkify(esc(text));
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }

  function renderChips() {
    chipsBox.innerHTML = '';
    CHIPS.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hl-chip';
      b.textContent = q;
      b.addEventListener('click', function () { ask(q); });
      chipsBox.appendChild(b);
    });
  }

  function ask(q) {
    q = (q || '').trim();
    if (!q || busy) return;
    busy = true;
    sendBtn.disabled = true;
    addMsg('user', q);
    input.value = '';
    typing.style.display = 'flex';
    body.scrollTop = body.scrollHeight;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, history: history.slice(-6) })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var answer = (data && data.answer) ? data.answer : 'Mình chưa trả lời được câu này, bạn thử hỏi cách khác nhé.';
        addMsg('bot', answer);
        history.push({ role: 'user', content: q });
        history.push({ role: 'assistant', content: answer });
      })
      .catch(function () {
        addMsg('bot', 'Mình chưa kết nối được tới máy chủ, bạn thử lại sau ít phút nhé — hoặc liên hệ Lộc qua email locn9730@gmail.com.');
      })
      .finally(function () {
        typing.style.display = 'none';
        busy = false;
        sendBtn.disabled = false;
        input.focus();
      });
  }

  function toggle(open) {
    var willOpen = typeof open === 'boolean' ? open : !panel.classList.contains('open');
    panel.classList.toggle('open', willOpen);
    if (willOpen && !greeted) {
      greeted = true;
      addMsg('bot', GREETING);
      renderChips();
    }
    if (willOpen) input.focus();
  }

  fab.addEventListener('click', function () { toggle(); });
  panel.querySelector('.hl-close').addEventListener('click', function () { toggle(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
})();
