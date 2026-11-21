// ==UserScript==
// @name         Parallel UI Search & Quick Tab Opener
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Nút mở tab mới có sẵn từ khóa (như T HUB), tìm song song 2 khung trên UI và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("parallel-ui-root")) return;

  const root = document.createElement("div");
  root.id = "parallel-ui-root";
  root.style.cssText = `
    position: fixed;
    bottom: 18px;
    right: 18px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
    font-size: 13px;
    color: #f8fafc;
  `;

  root.innerHTML = `
    <button id="pu-toggle-btn" type="button" style="
      background: #0ea5e9;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI</button>

    <div id="pu-panel" style="
      display: none;
      margin-top: 8px;
      width: 420px;
      max-width: 94vw;
      max-height: 86vh;
      overflow-y: auto;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <strong>UI Tìm Song Song & Tab Nhanh</strong>
        <button id="pu-close-btn" type="button" style="
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
        ">Đóng</button>
      </div>

      <!-- Nút nhanh mở tab mới với từ khóa có sẵn -->
      <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
        <div style="font-weight:600;margin-bottom:6px;">Mở Tab Mới Có Sẵn Từ Khóa</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button id="pu-quick-thub" type="button" style="
            background:#2563eb;color:#fff;border:none;border-radius:6px;
            padding:6px 12px;cursor:pointer;font-weight:600;
          ">T HUB (Mở Tab Mới)</button>
          <button id="pu-quick-thub-ui" type="button" style="
            background:#0d9488;color:#fff;border:none;border-radius:6px;
            padding:6px 12px;cursor:pointer;font-weight:600;
          ">T HUB (Xem Trong UI)</button>
        </div>
      </div>

      <!-- Tìm kiếm đa khung song song trên UI -->
      <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
        <div style="font-weight:600;margin-bottom:6px;">Tìm Trên UI Song Song (2 Khung)</div>
        <input id="pu-search-input" type="text" placeholder="Nhập từ khóa hoặc URL để tải 2 khung song song..." style="
          width:100%;box-sizing:border-box;padding:7px 9px;margin-bottom:6px;
          border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;
        " />
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="pu-run-parallel" type="button" style="
            flex:1;background:#16a34a;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">Chạy Song Song Trong UI</button>
          <button id="pu-open-tab-query" type="button" style="
            background:#334155;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Mở Tab Mới</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">Khung 1 (DuckDuckGo)</div>
            <iframe id="pu-frame-1" src="about:blank" style="
              width:100%;height:190px;border:1px solid #475569;border-radius:6px;background:#fff;
            "></iframe>
          </div>
          <div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">Khung 2 (Bing / URL)</div>
            <iframe id="pu-frame-2" src="about:blank" style="
              width:100%;height:190px;border:1px solid #475569;border-radius:6px;background:#fff;
            "></iframe>
          </div>
        </div>
      </div>

      <!-- Lấy Full Code trang hiện tại -->
      <div style="background:#1e293b;padding:8px;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="pu-get-code" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Lấy Full Code</button>
          <button id="pu-copy-code" type="button" style="
            background:#475569;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Copy</button>
        </div>
        <textarea id="pu-code-area" rows="6" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
          width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
          border:1px solid #334155;border-radius:6px;padding:6px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
        "></textarea>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("pu-toggle-btn");
  const closeBtn = document.getElementById("pu-close-btn");
  const panel = document.getElementById("pu-panel");
  const quickThubBtn = document.getElementById("pu-quick-thub");
  const quickThubUiBtn = document.getElementById("pu-quick-thub-ui");
  const searchInput = document.getElementById("pu-search-input");
  const runParallelBtn = document.getElementById("pu-run-parallel");
  const openTabQueryBtn = document.getElementById("pu-open-tab-query");
  const frame1 = document.getElementById("pu-frame-1");
  const frame2 = document.getElementById("pu-frame-2");
  const getCodeBtn = document.getElementById("pu-get-code");
  const copyCodeBtn = document.getElementById("pu-copy-code");
  const codeArea = document.getElementById("pu-code-area");

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI" : "Mở UI";
  }

  function openSearchNewTab(keyword) {
    const q = encodeURIComponent((keyword || "").trim());
    if (!q) return;
    window.open(`https://duckduckgo.com/?q=${q}`, "_blank", "noopener,noreferrer");
  }

  function runParallelInUi(raw) {
    const text = (raw || "").trim();
    if (!text) return;

    if (/^https?:\/\//i.test(text) || (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text))) {
      const url = /^https?:\/\//i.test(text) ? text : "https://" + text;
      frame1.src = url;
      frame2.src = `https://www.bing.com/search?q=${encodeURIComponent(text)}`;
      return;
    }

    const encoded = encodeURIComponent(text);
    frame1.src = `https://html.duckduckgo.com/html/?q=${encoded}`;
    frame2.src = `https://www.bing.com/search?q=${encoded}`;
  }

  toggleBtn.addEventListener("click", () => setOpen(panel.style.display !== "block"));
  closeBtn.addEventListener("click", () => setOpen(false));

  quickThubBtn.addEventListener("click", () => {
    openSearchNewTab("T HUB");
  });

  quickThubUiBtn.addEventListener("click", () => {
    searchInput.value = "T HUB";
    runParallelInUi("T HUB");
  });

  runParallelBtn.addEventListener("click", () => {
    runParallelInUi(searchInput.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runParallelInUi(searchInput.value);
    }
  });

  openTabQueryBtn.addEventListener("click", () => {
    openSearchNewTab(searchInput.value);
  });

  getCodeBtn.addEventListener("click", () => {
    codeArea.value = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
  });

  copyCodeBtn.addEventListener("click", async () => {
    if (!codeArea.value) return;
    try {
      await navigator.clipboard.writeText(codeArea.value);
      copyCodeBtn.textContent = "Đã copy";
      setTimeout(() => (copyCodeBtn.textContent = "Copy"), 1200);
    } catch {
      codeArea.select();
      document.execCommand("copy");
    }
  });
})();
