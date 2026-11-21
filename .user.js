// ==UserScript==
// @name         Web OS Mini Browser & Source Inspector
// @namespace    https://tampermonkey.net/
// @version      1.0.0
// @description  Cửa sổ OS kéo thả, mini browser đa tab, inspector xem/tải code HTML và ghi chú nhanh
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__WEB_OS_USERSCRIPT_LOADED__) return;
  window.__WEB_OS_USERSCRIPT_LOADED__ = true;

  const STYLE_ID = 'wos-us-style';
  const ROOT_ID = 'wos-us-root';

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID} {
      --wos-bg: rgba(17, 24, 39, 0.92);
      --wos-solid: #111827;
      --wos-border: rgba(255, 255, 255, 0.14);
      --wos-text: #f9fafb;
      --wos-muted: #9ca3af;
      --wos-accent: #3b82f6;
      --wos-danger: #ef4444;
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483646;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
      color: var(--wos-text);
    }

    #${ROOT_ID}.theme-emerald {
      --wos-accent: #10b981;
    }

    #${ROOT_ID}.theme-sunset {
      --wos-accent: #f43f5e;
    }

    #${ROOT_ID} * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    .wos-fab {
      position: fixed;
      right: 16px;
      bottom: 16px;
      height: 40px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid var(--wos-border);
      background: var(--wos-solid);
      color: var(--wos-text);
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
      pointer-events: auto;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .wos-window {
      position: fixed;
      top: 48px;
      left: 16px;
      width: min(760px, calc(100vw - 32px));
      height: min(500px, calc(100vh - 84px));
      background: var(--wos-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--wos-border);
      border-radius: 14px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      display: none;
      flex-direction: column;
      overflow: hidden;
      pointer-events: auto;
      user-select: none;
    }

    .wos-window.open {
      display: flex;
    }

    .wos-window.maximized {
      top: 8px !important;
      left: 8px !important;
      width: calc(100vw - 16px) !important;
      height: calc(100vh - 16px) !important;
    }

    .wos-header {
      height: 40px;
      padding: 0 10px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid var(--wos-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      cursor: grab;
      touch-action: none;
    }

    .wos-header:active {
      cursor: grabbing;
    }

    .wos-title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .wos-win-actions {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .wos-btn {
      height: 28px;
      padding: 0 9px;
      border-radius: 8px;
      border: 1px solid var(--wos-border);
      background: rgba(255, 255, 255, 0.06);
      color: var(--wos-text);
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }

    .wos-btn:hover {
      background: rgba(255, 255, 255, 0.14);
    }

    .wos-btn.primary {
      background: var(--wos-accent);
      border-color: transparent;
      color: #fff;
      font-weight: 600;
    }

    .wos-btn.danger:hover {
      background: var(--wos-danger);
      border-color: transparent;
      color: #fff;
    }

    .wos-modebar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.25);
      border-bottom: 1px solid var(--wos-border);
      overflow-x: auto;
    }

    .wos-modebar .wos-btn.active {
      background: var(--wos-accent);
      border-color: transparent;
      color: #fff;
    }

    .wos-panel {
      flex: 1;
      min-height: 0;
      display: none;
      flex-direction: column;
    }

    .wos-panel.active {
      display: flex;
    }

    .wos-tabs {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px 0;
      background: rgba(0, 0, 0, 0.2);
      overflow-x: auto;
    }

    .wos-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      max-width: 170px;
      padding: 6px 10px;
      border-radius: 8px 8px 0 0;
      background: rgba(255, 255, 255, 0.05);
      color: var(--wos-muted);
      font-size: 12px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .wos-tab.active {
      background: var(--wos-solid);
      color: var(--wos-text);
    }

    .wos-nav {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      background: var(--wos-solid);
      border-bottom: 1px solid var(--wos-border);
    }

    .wos-input {
      flex: 1;
      min-width: 70px;
      height: 30px;
      padding: 0 10px;
      border-radius: 8px;
      border: 1px solid var(--wos-border);
      background: rgba(0, 0, 0, 0.35);
      color: var(--wos-text);
      font-size: 12px;
      outline: none;
      user-select: text;
    }

    .wos-frames {
      position: relative;
      flex: 1;
      min-height: 0;
      background: #0f172a;
    }

    .wos-frame {
      width: 100%;
      height: 100%;
      border: none;
      background: #ffffff;
      display: none;
    }

    .wos-frame.active {
      display: block;
    }

    .wos-pad {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      height: 100%;
    }

    .wos-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .wos-textarea {
      flex: 1;
      width: 100%;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid var(--wos-border);
      background: rgba(2, 6, 23, 0.9);
      color: #e2e8f0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      resize: none;
      outline: none;
      user-select: text;
    }

    .wos-toast {
      position: fixed;
      top: 14px;
      right: 14px;
      padding: 8px 12px;
      border-radius: 9px;
      background: var(--wos-solid);
      border: 1px solid var(--wos-border);
      font-size: 12px;
      opacity: 0;
      pointer-events: none;
      transition: 0.2s ease;
    }

    .wos-toast.show {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = `
    <button class="wos-fab" id="wos-fab">⊞ Web OS</button>

    <div class="wos-window" id="wos-win">
      <div class="wos-header" id="wos-header">
        <div class="wos-title">⊞ Web OS — Browser & Source Tools</div>
        <div class="wos-win-actions">
          <button class="wos-btn" id="wos-max" title="Phóng to">▢</button>
          <button class="wos-btn" id="wos-min" title="Thu nhỏ">—</button>
          <button class="wos-btn danger" id="wos-close" title="Ẩn">✕</button>
        </div>
      </div>

      <div class="wos-modebar">
        <button class="wos-btn active" data-mode="browser">🌐 Đa Tab</button>
        <button class="wos-btn" data-mode="inspector">&lt;/&gt; Code & Export</button>
        <button class="wos-btn" data-mode="notes">📝 Ghi chú</button>
        <button class="wos-btn" id="wos-theme-btn">🎨 Theme</button>
      </div>

      <!-- Panel 1: Multi-Tab Browser -->
      <div class="wos-panel active" id="panel-browser">
        <div class="wos-tabs" id="wos-tabs">
          <button class="wos-btn" id="wos-add-tab">+</button>
        </div>
        <div class="wos-nav">
          <button class="wos-btn" id="wos-reload">↻</button>
          <input class="wos-input" id="wos-url" type="text" placeholder="Nhập URL hoặc từ khóa..." />
          <button class="wos-btn primary" id="wos-go">Mở</button>
          <button class="wos-btn" id="wos-grab">Lấy code</button>
        </div>
        <div class="wos-frames" id="wos-frames"></div>
      </div>

      <!-- Panel 2: Source Inspector & Export -->
      <div class="wos-panel" id="panel-inspector">
        <div class="wos-pad">
          <div class="wos-row">
            <button class="wos-btn primary" id="wos-load-host-src">Code trang hiện tại</button>
            <button class="wos-btn" id="wos-preview-code">Chạy thành tab mới</button>
            <button class="wos-btn" id="wos-copy-code">Copy</button>
            <button class="wos-btn" id="wos-download-html">Tải .html</button>
          </div>
          <textarea class="wos-textarea" id="wos-code" spellcheck="false" placeholder="Mã nguồn HTML hiển thị hoặc dán tại đây..."></textarea>
        </div>
      </div>

      <!-- Panel 3: Notes -->
      <div class="wos-panel" id="panel-notes">
        <div class="wos-pad">
          <div class="wos-row">
            <button class="wos-btn primary" id="wos-save-note">Lưu</button>
            <button class="wos-btn" id="wos-clear-note">Xoá</button>
          </div>
          <textarea class="wos-textarea" id="wos-note-area" placeholder="Ghi chú nhanh..."></textarea>
        </div>
      </div>
    </div>

    <div class="wos-toast" id="wos-toast"></div>
  `;
  document.body.appendChild(root);

  const $ = (sel) => root.querySelector(sel);
  const win = $('#wos-win');
  const header = $('#wos-header');

  function toast(msg) {
    const el = $('#wos-toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2000);
  }

  function setOpen(open) {
    win.classList.toggle('open', open);
  }

  $('#wos-fab').onclick = () => setOpen(!win.classList.contains('open'));
  $('#wos-min').onclick = () => setOpen(false);
  $('#wos-close').onclick = () => setOpen(false);
  $('#wos-max').onclick = () => win.classList.toggle('maximized');

  const themes = ['', 'theme-emerald', 'theme-sunset'];
  let themeIdx = 0;
  $('#wos-theme-btn').onclick = () => {
    themeIdx = (themeIdx + 1) % themes.length;
    root.className = themes[themeIdx];
    toast('Đã đổi theme');
  };

  // Drag window (mouse + touch)
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
  header.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || win.classList.contains('maximized')) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = win.offsetLeft;
    oy = win.offsetTop;
    header.setPointerCapture(e.pointerId);
  });
  header.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    win.style.left = Math.max(0, ox + (e.clientX - sx)) + 'px';
    win.style.top = Math.max(0, oy + (e.clientY - sy)) + 'px';
  });
  header.addEventListener('pointerup', () => { dragging = false; });

  // Mode switcher
  function switchMode(mode) {
    root.querySelectorAll('.wos-modebar .wos-btn[data-mode]').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    root.querySelectorAll('.wos-panel').forEach((p) => {
      p.classList.toggle('active', p.id === 'panel-' + mode);
    });
  }

  root.querySelectorAll('.wos-modebar .wos-btn[data-mode]').forEach((btn) => {
    btn.onclick = () => switchMode(btn.dataset.mode);
  });

  // Multi-tab browser
  const tabs = [];
  let activeTabId = null;
  let seq = 1;

  function defaultPageHtml() {
    return `<!DOCTYPE html><html><body style="margin:0;padding:20px;font-family:sans-serif;background:#0f172a;color:#f8fafc;">
      <h3 style="margin-top:0;">Mini Browser Tab</h3>
      <p style="color:#94a3b8;font-size:13px;">Nhập URL ở thanh trên hoặc bấm <b>Lấy code</b> để xem/tải HTML.</p>
    </body></html>`;
  }

  function createTab(title = 'Tab mới', srcdoc = defaultPageHtml(), url = '') {
    const id = 'wos-t-' + (seq++);
    const iframe = document.createElement('iframe');
    iframe.className = 'wos-frame';
    iframe.id = 'frame-' + id;
    iframe.sandbox = 'allow-scripts allow-forms allow-same-origin allow-popups';
    if (srcdoc) iframe.srcdoc = srcdoc;
    else if (url) iframe.src = url;

    $('#wos-frames').appendChild(iframe);
    tabs.push({ id, title, url, srcdoc });
    selectTab(id);
  }

  function selectTab(id) {
    activeTabId = id;
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    root.querySelectorAll('.wos-frame').forEach((f) => {
      f.classList.toggle('active', f.id === 'frame-' + id);
    });
    $('#wos-url').value = tab.url || '';
    renderTabs();
  }

  function removeTab(id, e) {
    if (e) e.stopPropagation();
    if (tabs.length <= 1) return toast('Giữ tối thiểu 1 tab');
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    $('#frame-' + id)?.remove();
    tabs.splice(idx, 1);
    if (activeTabId === id) {
      selectTab(tabs[Math.max(0, idx - 1)].id);
    } else {
      renderTabs();
    }
  }

  function renderTabs() {
    const strip = $('#wos-tabs');
    const addBtn = $('#wos-add-tab');
    strip.querySelectorAll('.wos-tab').forEach((el) => el.remove());

    tabs.forEach((tab) => {
      const el = document.createElement('div');
      el.className = 'wos-tab' + (tab.id === activeTabId ? ' active' : '');
      el.onclick = () => selectTab(tab.id);

      const label = document.createElement('span');
      label.textContent = tab.title;
      label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

      const close = document.createElement('span');
      close.textContent = '×';
      close.style.cssText = 'padding-left:4px;font-weight:700;';
      close.onclick = (e) => removeTab(tab.id, e);

      el.appendChild(label);
      el.appendChild(close);
      strip.insertBefore(el, addBtn);
    });
  }

  function normalizeUrl(raw) {
    const v = raw.trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (v.includes('.') && !v.includes(' ')) return 'https://' + v;
    return 'https://duckduckgo.com/?q=' + encodeURIComponent(v);
  }

  function goUrl(raw) {
    const tab = tabs.find((t) => t.id === activeTabId);
    const target = normalizeUrl(raw);
    if (!tab || !target) return;

    tab.url = target;
    tab.srcdoc = '';
    tab.title = target.replace(/^https?:\/\//i, '').split('/')[0] || target;

    const frame = $('#frame-' + tab.id);
    frame.removeAttribute('srcdoc');
    frame.src = target;
    renderTabs();
  }

  $('#wos-add-tab').onclick = () => createTab();
  $('#wos-go').onclick = () => goUrl($('#wos-url').value);
  $('#wos-url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goUrl(e.target.value);
  });
  $('#wos-reload').onclick = () => {
    const frame = $('#frame-' + activeTabId);
    if (!frame) return;
    if (frame.hasAttribute('srcdoc')) frame.srcdoc = frame.srcdoc;
    else frame.src = frame.src;
    toast('Đã tải lại tab');
  };

  // Inspector & Export
  function grabSource() {
    const tab = tabs.find((t) => t.id === activeTabId);
    const area = $('#wos-code');
    if (tab && tab.srcdoc) {
      area.value = tab.srcdoc;
      toast('Đã lấy code tab hiện tại');
      return;
    }
    const frame = tab && $('#frame-' + tab.id);
    try {
      if (frame && frame.contentDocument && frame.contentDocument.documentElement) {
        area.value = frame.contentDocument.documentElement.outerHTML;
        toast('Đã lấy code iframe');
        return;
      }
    } catch (_) {}

    const clone = document.documentElement.cloneNode(true);
    clone.querySelector('#' + ROOT_ID)?.remove();
    clone.querySelector('#' + STYLE_ID)?.remove();
    area.value = '<!DOCTYPE html>\n' + clone.outerHTML;
    toast('Đã lấy code trang chính (đã lọc UI userscript)');
  }

  $('#wos-grab').onclick = () => {
    grabSource();
    switchMode('inspector');
  };
  $('#wos-load-host-src').onclick = grabSource;

  $('#wos-preview-code').onclick = () => {
    const code = $('#wos-code').value;
    if (!code.trim()) return toast('Chưa có code');
    createTab('Preview', code, '');
    switchMode('browser');
  };

  $('#wos-copy-code').onclick = () => {
    navigator.clipboard?.writeText($('#wos-code').value)
      .then(() => toast('Đã copy code'))
      .catch(() => toast('Không thể copy tự động'));
  };

  $('#wos-download-html').onclick = () => {
    const code = $('#wos-code').value;
    if (!code.trim()) return toast('Chưa có code để tải');
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page-source.html';
    a.click();
    URL.revokeObjectURL(url);
    toast('Đã tải page-source.html');
  };

  // Notes
  const NOTE_KEY = 'wos_us_notes_v1';
  $('#wos-note-area').value = localStorage.getItem(NOTE_KEY) || '';
  $('#wos-save-note').onclick = () => {
    localStorage.setItem(NOTE_KEY, $('#wos-note-area').value);
    toast('Đã lưu ghi chú');
  };
  $('#wos-clear-note').onclick = () => {
    $('#wos-note-area').value = '';
    localStorage.removeItem(NOTE_KEY);
    toast('Đã xoá ghi chú');
  };

  createTab('Home');
})();
