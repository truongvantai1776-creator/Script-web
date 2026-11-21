// ==UserScript==
// @name         Safari Mode UI & Full Code
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Chuyển chế độ mặc định sang Safari, xem kết quả ngay trong UI hoặc mở tab mới, và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("safari-mode-ui-root")) return;

  const root = document.createElement("div");
  root.id = "safari-mode-ui-root";
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
    <button id="sf-toggle-btn" type="button" style="
      background: #0ea5e9;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI (Safari)</button>

    <div id="sf-panel" style="
      display: none;
      margin-top: 8px;
      width: 360px;
      max-height: 85vh;
      overflow-y: auto;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <strong>Safari UI & Full Code</strong>
        <button id="sf-close-btn" type="button" style="
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
        ">Đóng</button>
      </div>

      <!-- Ô nhập từ khóa / URL với chế độ mặc định Safari -->
      <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
        <div style="font-weight:600;margin-bottom:6px;">Chế độ hiện tại: <span style="color:#38bdf8;">Safari</span></div>
        <input id="sf-query-input" type="text" placeholder="Nhập từ khóa hoặc địa chỉ web..." style="
          width:100%;box-sizing:border-box;padding:7px 9px;
          border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;
        " />

        <div id="sf-picker" style="
          display: none;
          margin-top: 8px;
          padding: 8px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
        ">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">
            Trình duyệt: <strong id="sf-browser-label" style="color:#38bdf8;">Safari</strong> — <span id="sf-preview-text" style="color:#e2e8f0;"></span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
            <button class="sf-browser-btn" data-browser="safari" type="button" style="
              flex:1;background:#0ea5e9;color:#fff;border:none;border-radius:6px;
              padding:6px 8px;cursor:pointer;font-size:12px;font-weight:600;
            ">Safari</button>
            <button class="sf-browser-btn" data-browser="duckduckgo" type="button" style="
              flex:1;background:#0d9488;color:#fff;border:none;border-radius:6px;
              padding:6px 8px;cursor:pointer;font-size:12px;font-weight:600;
            ">DuckGo</button>
            <button class="sf-browser-btn" data-browser="bing" type="button" style="
              flex:1;background:#334155;color:#fff;border:none;border-radius:6px;
              padding:6px 8px;cursor:pointer;font-size:12px;font-weight:600;
            ">Bing</button>
          </div>
          <div style="display:flex;gap:6px;">
            <button id="sf-view-in-ui" type="button" style="
              flex:1;background:#16a34a;color:#fff;border:none;border-radius:6px;
              padding:7px 10px;cursor:pointer;font-size:12px;font-weight:600;
            ">Xem trong UI</button>
            <button id="sf-open-tab" type="button" style="
              background:#2563eb;color:#fff;border:none;border-radius:6px;
              padding:7px 10px;cursor:pointer;font-size:12px;font-weight:600;
            ">Mở tab Safari</button>
          </div>
        </div>

        <div id="sf-status" style="font-size:11px;color:#94a3b8;margin-top:6px;">Sẵn sàng ở chế độ Safari.</div>
        <iframe id="sf-frame" src="about:blank" style="
          width:100%;height:220px;margin-top:6px;border:1px solid #475569;
          border-radius:6px;background:#ffffff;
        "></iframe>
      </div>

      <!-- Lấy Full Code trang hiện tại -->
      <div style="background:#1e293b;padding:8px;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="sf-get-code" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Lấy Full Code</button>
          <button id="sf-copy-code" type="button" style="
            background:#475569;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Copy</button>
        </div>
        <textarea id="sf-code-area" rows="7" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
          width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
          border:1px solid #334155;border-radius:6px;padding:6px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
        "></textarea>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("sf-toggle-btn");
  const closeBtn = document.getElementById("sf-close-btn");
  const panel = document.getElementById("sf-panel");
  const queryInput = document.getElementById("sf-query-input");
  const picker = document.getElementById("sf-picker");
  const browserLabel = document.getElementById("sf-browser-label");
  const previewText = document.getElementById("sf-preview-text");
  const viewInUiBtn = document.getElementById("sf-view-in-ui");
  const openTabBtn = document.getElementById("sf-open-tab");
  const statusEl = document.getElementById("sf-status");
  const frame = document.getElementById("sf-frame");
  const getCodeBtn = document.getElementById("sf-get-code");
  const copyCodeBtn = document.getElementById("sf-copy-code");
  const codeArea = document.getElementById("sf-code-area");

  let currentBrowser = "safari";

  const browserNames = {
    safari: "Safari",
    duckduckgo: "DuckDuckGo",
    bing: "Bing"
  };

  function buildUrl(raw, browser) {
    const text = (raw || "").trim();
    if (!text) return "";

    if (/^https?:\/\//i.test(text)) return text;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text)) {
      return "https://" + text;
    }

    const encoded = encodeURIComponent(text);
    if (browser === "bing") {
      return `https://www.bing.com/search?q=${encoded}`;
    }
    if (browser === "duckduckgo") {
      return `https://html.duckduckgo.com/html/?q=${encoded}`;
    }
    return `https://html.duckduckgo.com/html/?q=${encoded}`;
  }

  function refreshPicker() {
    const val = queryInput.value.trim();
    if (val.length > 0) {
      picker.style.display = "block";
      previewText.textContent = val;
      browserLabel.textContent = browserNames[currentBrowser] || "Safari";
    } else {
      picker.style.display = "none";
      previewText.textContent = "";
    }
  }

  function loadInsideUi() {
    const targetUrl = buildUrl(queryInput.value, currentBrowser);
    if (!targetUrl) return;
    frame.src = targetUrl;
    statusEl.textContent = `[${browserNames[currentBrowser]}] Đang tải trong UI: ${targetUrl}`;
    frame.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI (Safari)" : "Mở UI (Safari)";
  }

  toggleBtn.addEventListener("click", () => setOpen(panel.style.display !== "block"));
  closeBtn.addEventListener("click", () => setOpen(false));
  queryInput.addEventListener("input", refreshPicker);

  queryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loadInsideUi();
    }
  });

  document.querySelectorAll(".sf-browser-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentBrowser = btn.getAttribute("data-browser") || "safari";
      refreshPicker();
      loadInsideUi();
    });
  });

  viewInUiBtn.addEventListener("click", loadInsideUi);

  openTabBtn.addEventListener("click", () => {
    const targetUrl = buildUrl(queryInput.value, currentBrowser);
    if (targetUrl) window.open(targetUrl, "_blank", "noopener,noreferrer");
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
