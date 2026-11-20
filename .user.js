// ==UserScript==
// @name         Mini Browser Search UI & Full Code
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Nhập từ khóa hoặc URL bất kỳ để hiện phần chọn trình duyệt mini, xem trong UI và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("mini-browser-ui-root")) return;

  const root = document.createElement("div");
  root.id = "mini-browser-ui-root";
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
    <button id="mb-toggle-btn" type="button" style="
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI</button>

    <div id="mb-panel" style="
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
        <strong>Safari Mini UI & Full Code</strong>
        <button id="mb-close-btn" type="button" style="
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
        <div style="font-weight:600;margin-bottom:6px;">Tìm Từ Khóa / Mở URL</div>
        <input id="mb-query-input" type="text" placeholder="Nhập từ khóa bất kỳ hoặc địa chỉ web..." style="
          width:100%;box-sizing:border-box;padding:7px 9px;
          border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;
        " />

        <!-- Phần chọn trình duyệt / công cụ tự hiện khi có nội dung nhập -->
        <div id="mb-browser-picker" style="
          display: none;
          margin-top: 8px;
          padding: 8px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
        ">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">
            Chọn trình duyệt / công cụ cho: <span id="mb-preview-text" style="color:#e2e8f0;font-weight:600;"></span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="mb-engine-btn" data-engine="google" type="button" style="
              flex:1;background:#2563eb;color:#fff;border:none;border-radius:6px;
              padding:6px 8px;cursor:pointer;font-size:12px;
            ">Google</button>
            <button class="mb-engine-btn" data-engine="duckduckgo" type="button" style="
              flex:1;background:#0d9488;color:#fff;border:none;border-radius:6px;
              padding:6px 8px;cursor:pointer;font-size:12px;
            ">DuckGo</button>
            <button class="mb-engine-btn" data-engine="direct" type="button" style="
              flex:1;background:#7c3aed;color:#fff;border:none;border-radius:6px;
              padding:6px 8px;cursor:pointer;font-size:12px;
            ">Mở URL</button>
          </div>
          <div style="display:flex;gap:6px;margin-top:6px;">
            <button id="mb-open-tab-btn" type="button" style="
              width:100%;background:#334155;color:#fff;border:none;border-radius:6px;
              padding:5px 8px;cursor:pointer;font-size:12px;
            ">Mở ở tab mới (nếu trang chặn iframe)</button>
          </div>
        </div>

        <iframe id="mb-frame" src="about:blank" style="
          width:100%;height:190px;margin-top:8px;border:1px solid #475569;
          border-radius:6px;background:#ffffff;
        "></iframe>
      </div>

      <!-- Lấy Full Code trang hiện tại -->
      <div style="background:#1e293b;padding:8px;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="mb-get-code" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Lấy Full Code</button>
          <button id="mb-copy-code" type="button" style="
            background:#475569;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Copy</button>
        </div>
        <textarea id="mb-code-area" rows="7" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
          width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
          border:1px solid #334155;border-radius:6px;padding:6px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
        "></textarea>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("mb-toggle-btn");
  const closeBtn = document.getElementById("mb-close-btn");
  const panel = document.getElementById("mb-panel");
  const queryInput = document.getElementById("mb-query-input");
  const browserPicker = document.getElementById("mb-browser-picker");
  const previewText = document.getElementById("mb-preview-text");
  const openTabBtn = document.getElementById("mb-open-tab-btn");
  const frame = document.getElementById("mb-frame");
  const getCodeBtn = document.getElementById("mb-get-code");
  const copyCodeBtn = document.getElementById("mb-copy-code");
  const codeArea = document.getElementById("mb-code-area");

  let selectedEngine = "google";

  function buildTargetUrl(rawInput, engine) {
    const text = (rawInput || "").trim();
    if (!text) return "";

    const looksLikeDomainOrUrl =
      /^https?:\/\//i.test(text) ||
      (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text));

    if (engine === "direct" || (looksLikeDomainOrUrl && engine !== "google" && engine !== "duckduckgo")) {
      return /^https?:\/\//i.test(text) ? text : "https://" + text;
    }

    const encoded = encodeURIComponent(text);
    if (engine === "duckduckgo") {
      return `https://duckduckgo.com/?q=${encoded}`;
    }
    return `https://www.google.com/search?q=${encoded}&igu=1`;
  }

  function refreshPickerVisibility() {
    const val = queryInput.value.trim();
    if (val.length > 0) {
      browserPicker.style.display = "block";
      previewText.textContent = val;
    } else {
      browserPicker.style.display = "none";
      previewText.textContent = "";
    }
  }

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI" : "Mở UI";
  }

  toggleBtn.addEventListener("click", () => setOpen(panel.style.display !== "block"));
  closeBtn.addEventListener("click", () => setOpen(false));

  queryInput.addEventListener("input", refreshPickerVisibility);

  queryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const url = buildTargetUrl(queryInput.value, selectedEngine);
      if (url) frame.src = url;
    }
  });

  document.querySelectorAll(".mb-engine-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedEngine = btn.getAttribute("data-engine") || "google";
      const url = buildTargetUrl(queryInput.value, selectedEngine);
      if (url) frame.src = url;
    });
  });

  openTabBtn.addEventListener("click", () => {
    const url = buildTargetUrl(queryInput.value, selectedEngine);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
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
