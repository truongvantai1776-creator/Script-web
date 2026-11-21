// ==UserScript==
// @name         Main UI Frame & Full Code
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Mở ngay trong UI chính bằng iframe (kèm nút mở tab mới nếu trang chặn nhúng), nút T HUB và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("main-ui-frame-script")) return;

  const root = document.createElement("div");
  root.id = "main-ui-frame-script";
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
    <button id="mu-toggle-btn" type="button" style="
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI</button>

    <div id="mu-panel" style="
      display: none;
      margin-top: 8px;
      width: 370px;
      max-width: 94vw;
      max-height: 85vh;
      overflow-y: auto;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <strong>UI Chính & Full Code</strong>
        <button id="mu-close-btn" type="button" style="
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
        ">Đóng</button>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
        <div style="font-weight:600;margin-bottom:6px;">Mở Ngay Trong UI Chính</div>
        <input id="mu-input" type="text" placeholder="Nhập từ khóa hoặc URL..." style="
          width:100%;box-sizing:border-box;padding:7px 9px;margin-bottom:6px;
          border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;
        " />
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
          <button id="mu-open-ui-btn" type="button" style="
            flex:1;background:#16a34a;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">Mở trong UI</button>
          <button id="mu-open-tab-btn" type="button" style="
            background:#334155;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">Mở tab mới</button>
          <button id="mu-thub-btn" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">T HUB</button>
        </div>
        <iframe id="mu-frame" src="about:blank" style="
          width:100%;height:220px;border:1px solid #475569;border-radius:6px;background:#ffffff;
        "></iframe>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
          Nếu trang đích (như Google) chặn nhúng iframe, khung sẽ không hiển thị — dùng nút "Mở tab mới" để mở trực tiếp.
        </div>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="mu-get-code" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Lấy Full Code</button>
          <button id="mu-copy-code" type="button" style="
            background:#475569;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Copy</button>
        </div>
        <textarea id="mu-code-area" rows="7" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
          width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
          border:1px solid #334155;border-radius:6px;padding:6px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
        "></textarea>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("mu-toggle-btn");
  const closeBtn = document.getElementById("mu-close-btn");
  const panel = document.getElementById("mu-panel");
  const input = document.getElementById("mu-input");
  const openUiBtn = document.getElementById("mu-open-ui-btn");
  const openTabBtn = document.getElementById("mu-open-tab-btn");
  const thubBtn = document.getElementById("mu-thub-btn");
  const frame = document.getElementById("mu-frame");
  const getCodeBtn = document.getElementById("mu-get-code");
  const copyCodeBtn = document.getElementById("mu-copy-code");
  const codeArea = document.getElementById("mu-code-area");

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI" : "Mở UI";
  }

  function buildUrl(raw) {
    const text = (raw || "").trim();
    if (!text) return "https://www.google.com/";
    if (/^https?:\/\//i.test(text)) return text;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text)) {
      return "https://" + text;
    }
    return "https://www.google.com/search?q=" + encodeURIComponent(text);
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

  toggleBtn.addEventListener("click", () => setOpen(panel.style.display !== "block"));
  closeBtn.addEventListener("click", () => setOpen(false));

  openUiBtn.addEventListener("click", () => {
    frame.src = buildUrl(input.value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      frame.src = buildUrl(input.value);
    }
  });

  openTabBtn.addEventListener("click", () => {
    window.open(buildUrl(input.value), "_blank", "noopener,noreferrer");
  });

  thubBtn.addEventListener("click", async () => {
    input.value = "T HUB";
    await copyText("T HUB");
    frame.src = buildUrl("T HUB");
  });

  getCodeBtn.addEventListener("click", () => {
    codeArea.value = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
  });

  copyCodeBtn.addEventListener("click", async () => {
    if (!codeArea.value) return;
    await copyText(codeArea.value);
    copyCodeBtn.textContent = "Đã copy";
    setTimeout(() => (copyCodeBtn.textContent = "Copy"), 1200);
  });
})();
