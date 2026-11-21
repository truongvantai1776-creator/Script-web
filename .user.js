// ==UserScript==
// @name         Safari Tab Opener UI & Full Code
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Nhập từ khóa hoặc URL bất kỳ để hiện nút mở tab mới nhanh, xem trong UI và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("safari-tab-ui-root")) return;

  const root = document.createElement("div");
  root.id = "safari-tab-ui-root";
  root.style.cssText = `
    position: fixed;
    bottom: 18px;
    right: 18px;
    z-index: 2147483647;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #f8fafc;
  `;

  root.innerHTML = `
    <button id="st-toggle-btn" type="button" style="
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI</button>

    <div id="st-panel" style="
      display: none;
      margin-top: 8px;
      width: 360px;
      max-height: 84vh;
      overflow-y: auto;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <strong>UI Mở Tab & Full Code</strong>
        <button id="st-close-btn" type="button" style="
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
        ">Đóng</button>
      </div>

      <!-- Ô nhập từ khóa hoặc URL -->
      <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
        <div style="font-weight:600;margin-bottom:6px;">Nhập Từ Khóa / URL</div>
        <input id="st-query-input" type="text" placeholder="Nhập từ khóa hoặc địa chỉ web..." style="
          width:100%;box-sizing:border-box;padding:7px 9px;
          border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;
        " />

        <!-- Tự hiện khi có nội dung nhập -->
        <div id="st-action-box" style="
          display: none;
          margin-top: 8px;
          padding: 8px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
        ">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">
            Nội dung: <span id="st-preview-text" style="color:#e2e8f0;font-weight:600;"></span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button id="st-open-tab" type="button" style="
              flex:1;background:#0ea5e9;color:#fff;border:none;border-radius:6px;
              padding:7px 10px;cursor:pointer;font-weight:600;font-size:12px;
            ">Mở tab mới (Safari)</button>
            <button id="st-open-frame" type="button" style="
              background:#7c3aed;color:#fff;border:none;border-radius:6px;
              padding:7px 10px;cursor:pointer;font-size:12px;
            ">Xem trong UI</button>
          </div>
        </div>

        <iframe id="st-frame" src="about:blank" style="
          width:100%;height:170px;margin-top:8px;border:1px solid #475569;
          border-radius:6px;background:#ffffff;
        "></iframe>
      </div>

      <!-- Lấy Full Code trang hiện tại -->
      <div style="background:#1e293b;padding:8px;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="st-get-code" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Lấy Full Code</button>
          <button id="st-copy-code" type="button" style="
            background:#475569;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Copy</button>
        </div>
        <textarea id="st-code-area" rows="7" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
          width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
          border:1px solid #334155;border-radius:6px;padding:6px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
        "></textarea>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("st-toggle-btn");
  const closeBtn = document.getElementById("st-close-btn");
  const panel = document.getElementById("st-panel");
  const queryInput = document.getElementById("st-query-input");
  const actionBox = document.getElementById("st-action-box");
  const previewText = document.getElementById("st-preview-text");
  const openTabBtn = document.getElementById("st-open-tab");
  const openFrameBtn = document.getElementById("st-open-frame");
  const frame = document.getElementById("st-frame");
  const getCodeBtn = document.getElementById("st-get-code");
  const copyCodeBtn = document.getElementById("st-copy-code");
  const codeArea = document.getElementById("st-code-area");

  function resolveUrl(rawInput) {
    const text = (rawInput || "").trim();
    if (!text) return "";
    if (/^https?:\/\//i.test(text)) return text;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text)) {
      return "https://" + text;
    }
    return "https://www.google.com/search?q=" + encodeURIComponent(text);
  }

  function refreshActionBox() {
    const val = queryInput.value.trim();
    if (val.length > 0) {
      actionBox.style.display = "block";
      previewText.textContent = val;
    } else {
      actionBox.style.display = "none";
      previewText.textContent = "";
    }
  }

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI" : "Mở UI";
  }

  toggleBtn.addEventListener("click", () => setOpen(panel.style.display !== "block"));
  closeBtn.addEventListener("click", () => setOpen(false));

  queryInput.addEventListener("input", refreshActionBox);

  queryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const targetUrl = resolveUrl(queryInput.value);
      if (targetUrl) window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  });

  openTabBtn.addEventListener("click", () => {
    const targetUrl = resolveUrl(queryInput.value);
    if (targetUrl) window.open(targetUrl, "_blank", "noopener,noreferrer");
  });

  openFrameBtn.addEventListener("click", () => {
    const targetUrl = resolveUrl(queryInput.value);
    if (targetUrl) frame.src = targetUrl;
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
