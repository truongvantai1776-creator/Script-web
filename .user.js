// ==UserScript==
// @name         Full PC Browser UI & Full Code
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Mô phỏng giao diện trình duyệt PC đa tab, phóng to toàn màn hình, kéo thả, thanh bookmark (T HUB), mở tab Safari ngoài và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("full-pc-browser-root")) return;

  // --- QUẢN LÝ TRẠNG THÁI ĐA TAB ---
  let tabs = [
    { id: 1, title: "Trang mới", url: "about:blank", history: ["about:blank"], historyIndex: 0 }
  ];
  let activeTabId = 1;
  let nextTabId = 2;
  let isMaximized = false;
  let savedRect = null;

  // --- TẠO ROOT CONTAINER ---
  const root = document.createElement("div");
  root.id = "full-pc-browser-root";
  root.style.cssText = `
    position: fixed;
    bottom: 18px;
    right: 18px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    color: #f8fafc;
  `;

  root.innerHTML = `
    <button id="pcb-launcher" type="button" style="
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: 1px solid #60a5fa;
      border-radius: 999px;
      padding: 9px 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    ">Mở Trình Duyệt PC</button>

    <div id="pcb-window" style="
      display: none;
      width: 460px;
      height: 540px;
      max-width: 96vw;
      max-height: 88vh;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
      flex-direction: column;
      overflow: hidden;
    ">
      <!-- 1. THANH TIÊU ĐỀ & THANH TAB KIỂU CHROME/EDGE PC -->
      <div id="pcb-top-bar" style="
        display: flex;
        align-items: center;
        background: #020617;
        padding: 6px 8px 0 10px;
        border-bottom: 1px solid #1e293b;
        cursor: move;
        user-select: none;
        touch-action: none;
        gap: 8px;
      ">
        <!-- 3 nút điều khiển cửa sổ -->
        <div style="display:flex;align-items:center;gap:6px;padding-bottom:6px;flex-shrink:0;">
          <button id="pcb-win-close" title="Đóng UI" type="button" style="width:12px;height:12px;border-radius:50%;background:#ef4444;border:none;padding:0;cursor:pointer;"></button>
          <button id="pcb-win-min" title="Thu nhỏ" type="button" style="width:12px;height:12px;border-radius:50%;background:#eab308;border:none;padding:0;cursor:pointer;"></button>
          <button id="pcb-win-max" title="Phóng to / Thu vừa" type="button" style="width:12px;height:12px;border-radius:50%;background:#22c55e;border:none;padding:0;cursor:pointer;"></button>
        </div>

        <!-- Danh sách Tabs -->
        <div id="pcb-tabs-list" style="
          display: flex;
          align-items: flex-end;
          gap: 4px;
          overflow-x: auto;
          flex: 1;
          scrollbar-width: none;
        "></div>

        <!-- Nút thêm Tab (+) -->
        <button id="pcb-new-tab" title="Mở tab mới" type="button" style="
          background: #1e293b;
          color: #cbd5e1;
          border: none;
          border-radius: 6px;
          width: 24px;
          height: 24px;
          margin-bottom: 4px;
          cursor: pointer;
          font-weight: bold;
          flex-shrink: 0;
        ">+</button>
      </div>

      <!-- 2. THANH CÔNG CỤ & ĐỊA CHỈ (OMNIBOX) -->
      <div style="
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 8px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
      ">
        <button id="pcb-back" title="Lùi" type="button" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">←</button>
        <button id="pcb-forward" title="Tới" type="button" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">→</button>
        <button id="pcb-reload" title="Tải lại" type="button" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">↻</button>

        <div style="
          flex: 1;
          display: flex;
          align-items: center;
          background: #0f172a;
          border: 1px solid #475569;
          border-radius: 999px;
          padding: 3px 10px;
          min-width: 0;
        ">
          <span style="color:#64748b;margin-right:6px;font-size:11px;">🔒</span>
          <input id="pcb-url-input" type="text" placeholder="Nhập URL hoặc tìm kiếm..." style="
            flex: 1;
            min-width: 0;
            background: transparent;
            border: none;
            color: #f8fafc;
            outline: none;
            font-size: 12px;
          " />
        </div>

        <button id="pcb-go" type="button" style="
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 5px 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
        ">Đi</button>

        <button id="pcb-ext-safari" title="Mở URL này bằng tab Safari ngoài" type="button" style="
          background: #0ea5e9;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 5px 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        ">↗ Tab</button>

        <button id="pcb-toggle-devtools" title="Lấy Full Code trang hiện tại" type="button" style="
          background: #475569;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 5px 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        ">&lt;/&gt;</button>
      </div>

      <!-- 3. THANH DẤU TRANG (BOOKMARKS BAR) -->
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background: #162032;
        border-bottom: 1px solid #334155;
        overflow-x: auto;
        font-size: 11px;
      ">
        <button id="pcb-bm-thub" type="button" style="background:#0284c7;color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;font-weight:600;white-space:nowrap;">📋 T HUB</button>
        <button class="pcb-bm-link" data-url="https://en.m.wikipedia.org" type="button" style="background:#334155;color:#e2e8f0;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;white-space:nowrap;">Wikipedia</button>
        <button class="pcb-bm-link" data-url="https://example.com" type="button" style="background:#334155;color:#e2e8f0;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;white-space:nowrap;">Example</button>
        <span id="pcb-toast" style="color:#38bdf8;margin-left:auto;white-space:nowrap;"></span>
      </div>

      <!-- 4. KHU VỰC HIỂN THỊ CHÍNH (VIEWPORT + DEVTOOLS FULL CODE) -->
      <div style="flex:1;display:flex;flex-direction:column;min-height:0;position:relative;background:#ffffff;">
        <iframe id="pcb-viewport" src="about:blank" style="
          flex: 1;
          width: 100%;
          border: none;
          background: #ffffff;
        "></iframe>

        <!-- Ngăn DevTools lấy Full Code trang web hiện tại -->
        <div id="pcb-devtools-drawer" style="
          display: none;
          height: 48%;
          background: #0f172a;
          border-top: 2px solid #3b82f6;
          padding: 8px;
          flex-direction: column;
          color: #f8fafc;
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:6px;">
            <strong style="font-size:12px;color:#60a5fa;">DevTools — Full Code Trang Hiện Tại</strong>
            <div style="display:flex;gap:5px;">
              <button id="pcb-code-fetch" type="button" style="background:#2563eb;color:#fff;border:none;border-radius:5px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:600;">Lấy Code</button>
              <button id="pcb-code-copy" type="button" style="background:#16a34a;color:#fff;border:none;border-radius:5px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:600;">Copy</button>
              <button id="pcb-code-dl" type="button" style="background:#7c3aed;color:#fff;border:none;border-radius:5px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:600;">Tải .html</button>
            </div>
          </div>
          <textarea id="pcb-code-output" readonly placeholder="Bấm 'Lấy Code' để trích xuất toàn bộ HTML của trang web đang mở..." style="
            flex: 1;
            width: 100%;
            box-sizing: border-box;
            background: #020617;
            color: #a5f3fc;
            border: 1px solid #334155;
            border-radius: 6px;
            padding: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 11px;
            resize: none;
          "></textarea>
        </div>
      </div>

      <!-- 5. THANH TRẠNG THÁI (STATUS BAR) -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 10px;
        background: #020617;
        border-top: 1px solid #1e293b;
        font-size: 10px;
        color: #94a3b8;
      ">
        <span id="pcb-status-text">Sẵn sàng • Nhập URL để tải trong khung hoặc bấm ↗ Tab để mở ngoài</span>
        <span>PC Mode</span>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // --- THAM CHIẾU PHẦN TỬ ---
  const launcher = document.getElementById("pcb-launcher");
  const win = document.getElementById("pcb-window");
  const topBar = document.getElementById("pcb-top-bar");
  const winClose = document.getElementById("pcb-win-close");
  const winMin = document.getElementById("pcb-win-min");
  const winMax = document.getElementById("pcb-win-max");
  const tabsList = document.getElementById("pcb-tabs-list");
  const newTabBtn = document.getElementById("pcb-new-tab");
  const backBtn = document.getElementById("pcb-back");
  const forwardBtn = document.getElementById("pcb-forward");
  const reloadBtn = document.getElementById("pcb-reload");
  const urlInput = document.getElementById("pcb-url-input");
  const goBtn = document.getElementById("pcb-go");
  const extSafariBtn = document.getElementById("pcb-ext-safari");
  const toggleDevtoolsBtn = document.getElementById("pcb-toggle-devtools");
  const bmThubBtn = document.getElementById("pcb-bm-thub");
  const toastEl = document.getElementById("pcb-toast");
  const viewport = document.getElementById("pcb-viewport");
  const devtoolsDrawer = document.getElementById("pcb-devtools-drawer");
  const codeFetchBtn = document.getElementById("pcb-code-fetch");
  const codeCopyBtn = document.getElementById("pcb-code-copy");
  const codeDlBtn = document.getElementById("pcb-code-dl");
  const codeOutput = document.getElementById("pcb-code-output");
  const statusText = document.getElementById("pcb-status-text");

  function showToast(msg) {
    toastEl.textContent = msg;
    setTimeout(() => {
      if (toastEl.textContent === msg) toastEl.textContent = "";
    }, 2000);
  }

  async function copyText(str) {
    try {
      await navigator.clipboard.writeText(str);
    } catch {
      const temp = document.createElement("textarea");
      temp.value = str;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
    }
  }

  function resolveInput(raw) {
    const text = (raw || "").trim();
    if (!text || text === "about:blank") return "about:blank";
    if (/^https?:\/\//i.test(text)) return text;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text)) {
      return "https://" + text;
    }
    return "https://www.google.com/search?q=" + encodeURIComponent(text);
  }

  function extractTitle(url) {
    if (!url || url === "about:blank") return "Trang mới";
    try {
      const u = new URL(url);
      if (u.hostname.includes("google.") && u.searchParams.get("q")) {
        return "Tìm: " + u.searchParams.get("q");
      }
      return u.hostname.replace(/^www\./, "");
    } catch {
      return url.slice(0, 18);
    }
  }

  function getActiveTab() {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }

  function renderTabs() {
    tabsList.innerHTML = "";
    tabs.forEach((tab) => {
      const isActive = tab.id === activeTabId;
      const tabEl = document.createElement("div");
      tabEl.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        background: ${isActive ? "#1e293b" : "#0f172a"};
        color: ${isActive ? "#ffffff" : "#94a3b8"};
        border-radius: 8px 8px 0 0;
        border: 1px solid ${isActive ? "#334155" : "transparent"};
        border-bottom: none;
        cursor: pointer;
        max-width: 130px;
        font-size: 11px;
        flex-shrink: 0;
      `;

      const titleSpan = document.createElement("span");
      titleSpan.textContent = tab.title;
      titleSpan.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;";
      tabEl.appendChild(titleSpan);

      if (tabs.length > 1) {
        const closeSpan = document.createElement("span");
        closeSpan.textContent = "×";
        closeSpan.style.cssText = "font-weight:bold;padding:0 2px;border-radius:4px;";
        closeSpan.addEventListener("click", (e) => {
          e.stopPropagation();
          closeTab(tab.id);
        });
        tabEl.appendChild(closeSpan);
      }

      tabEl.addEventListener("click", () => switchTab(tab.id));
      tabsList.appendChild(tabEl);
    });
  }

  function syncViewportToTab(tab) {
    urlInput.value = tab.url === "about:blank" ? "" : tab.url;
    viewport.src = tab.url;
    backBtn.style.opacity = tab.historyIndex > 0 ? "1" : "0.4";
    forwardBtn.style.opacity = tab.historyIndex < tab.history.length - 1 ? "1" : "0.4";
    statusText.textContent = tab.url === "about:blank" ? "Tab mới trống" : `Đang tải: ${tab.url}`;
  }

  function switchTab(id) {
    activeTabId = id;
    const tab = getActiveTab();
    renderTabs();
    syncViewportToTab(tab);
  }

  function createNewTab(initialUrl = "about:blank") {
    const id = nextTabId++;
    const resolved = resolveInput(initialUrl);
    const newTab = {
      id,
      title: extractTitle(resolved),
      url: resolved,
      history: [resolved],
      historyIndex: 0
    };
    tabs.push(newTab);
    switchTab(id);
  }

  function closeTab(id) {
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1 || tabs.length <= 1) return;
    tabs.splice(idx, 1);
    if (activeTabId === id) {
      const nextTab = tabs[Math.max(0, idx - 1)];
      activeTabId = nextTab.id;
    }
    renderTabs();
    syncViewportToTab(getActiveTab());
  }

  function navigateActiveTab(rawInput) {
    const targetUrl = resolveInput(rawInput);
    const tab = getActiveTab();
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(targetUrl);
    tab.historyIndex = tab.history.length - 1;
    tab.url = targetUrl;
    tab.title = extractTitle(targetUrl);
    renderTabs();
    syncViewportToTab(tab);
  }

  // --- SỰ KIỆN MỞ / ĐÓNG / PHÓNG TO CỬA SỔ ---
  function openWindow() {
    launcher.style.display = "none";
    win.style.display = "flex";
    renderTabs();
  }

  function closeWindow() {
    win.style.display = "none";
    launcher.style.display = "inline-block";
  }

  launcher.addEventListener("click", openWindow);
  winClose.addEventListener("click", closeWindow);
  winMin.addEventListener("click", closeWindow);

  winMax.addEventListener("click", () => {
    if (!isMaximized) {
      const rect = root.getBoundingClientRect();
      savedRect = {
        left: root.style.left,
        top: root.style.top,
        right: root.style.right,
        bottom: root.style.bottom,
        width: win.style.width,
        height: win.style.height
      };
      root.style.left = "8px";
      root.style.top = "8px";
      root.style.right = "auto";
      root.style.bottom = "auto";
      win.style.width = "calc(100vw - 16px)";
      win.style.height = "calc(100vh - 16px)";
      win.style.maxWidth = "none";
      win.style.maxHeight = "none";
      isMaximized = true;
    } else {
      root.style.left = savedRect?.left || "auto";
      root.style.top = savedRect?.top || "auto";
      root.style.right = savedRect?.right || "18px";
      root.style.bottom = savedRect?.bottom || "18px";
      win.style.width = savedRect?.width || "460px";
      win.style.height = savedRect?.height || "540px";
      win.style.maxWidth = "96vw";
      win.style.maxHeight = "88vh";
      isMaximized = false;
    }
  });

  // --- KÉO THẢ CỬA SỔ ---
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let winStartX = 0;
  let winStartY = 0;

  topBar.addEventListener("pointerdown", (e) => {
    if (isMaximized || e.target.closest("button") || e.target.closest("#pcb-tabs-list")) return;
    isDragging = true;
    const rect = root.getBoundingClientRect();
    root.style.left = rect.left + "px";
    root.style.top = rect.top + "px";
    root.style.right = "auto";
    root.style.bottom = "auto";
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    winStartX = rect.left;
    winStartY = rect.top;
    topBar.setPointerCapture(e.pointerId);
  });

  topBar.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - 100, winStartX + (e.clientX - dragStartX)));
    const y = Math.max(0, Math.min(window.innerHeight - 60, winStartY + (e.clientY - dragStartY)));
    root.style.left = x + "px";
    root.style.top = y + "px";
  });

  topBar.addEventListener("pointerup", () => {
    isDragging = false;
  });

  // --- SỰ KIỆN ĐIỀU HƯỚNG & TAB ---
  newTabBtn.addEventListener("click", () => createNewTab("about:blank"));

  goBtn.addEventListener("click", () => navigateActiveTab(urlInput.value));
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigateActiveTab(urlInput.value);
    }
  });

  backBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab.historyIndex > 0) {
      tab.historyIndex--;
      tab.url = tab.history[tab.historyIndex];
      tab.title = extractTitle(tab.url);
      renderTabs();
      syncViewportToTab(tab);
    }
  });

  forwardBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab.historyIndex < tab.history.length - 1) {
      tab.historyIndex++;
      tab.url = tab.history[tab.historyIndex];
      tab.title = extractTitle(tab.url);
      renderTabs();
      syncViewportToTab(tab);
    }
  });

  reloadBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    viewport.src = tab.url;
    showToast("Đã tải lại khung");
  });

  extSafariBtn.addEventListener("click", () => {
    const target = resolveInput(urlInput.value) !== "about:blank"
      ? resolveInput(urlInput.value)
      : (getActiveTab().url !== "about:blank" ? getActiveTab().url : "https://www.google.com/");
    window.open(target, "_blank", "noopener,noreferrer");
  });

  // --- BOOKMARKS ---
  bmThubBtn.addEventListener("click", async () => {
    await copyText("T HUB");
    urlInput.value = "T HUB";
    showToast('Đã copy "T HUB"');
  });

  document.querySelectorAll(".pcb-bm-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      if (url) navigateActiveTab(url);
    });
  });

  // --- DEVTOOLS FULL CODE TRANG HIỆN TẠI ---
  toggleDevtoolsBtn.addEventListener("click", () => {
    const isHidden = devtoolsDrawer.style.display === "none";
    devtoolsDrawer.style.display = isHidden ? "flex" : "none";
  });

  codeFetchBtn.addEventListener("click", () => {
    codeOutput.value = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
    showToast("Đã lấy Full Code");
  });

  codeCopyBtn.addEventListener("click", async () => {
    if (!codeOutput.value) {
      codeOutput.value = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
    }
    await copyText(codeOutput.value);
    showToast("Đã copy Full Code");
  });

  codeDlBtn.addEventListener("click", () => {
    const html = codeOutput.value || ("<!DOCTYPE html>\n" + document.documentElement.outerHTML);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (document.title || "page").replace(/[\\/:*?"<>|]/g, "_") + ".html";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Đang tải file .html");
  });
})();
