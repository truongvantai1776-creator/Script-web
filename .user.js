// ==UserScript==
// @name         Clean New Tab & Full Code UI
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Mở tab mới không gắn sẵn trang tìm kiếm ngoài, hỗ trợ copy nhanh T HUB và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("clean-newtab-ui")) return;

  const root = document.createElement("div");
  root.id = "clean-newtab-ui";
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
    <button id="cn-toggle-btn" type="button" style="
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI</button>

    <div id="cn-panel" style="
      display: none;
      margin-top: 8px;
      width: 350px;
      max-height: 84vh;
      overflow-y: auto;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <strong>Tab Mới & Full Code</strong>
        <button id="cn-close-btn" type="button" style="
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
        ">Đóng</button>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
        <div style="font-weight:600;margin-bottom:6px;">Mở Tab Mới</div>
        <input id="cn-input" type="text" placeholder="Nhập URL (nếu có) hoặc để trống để mở tab mới..." style="
          width:100%;box-sizing:border-box;padding:7px 9px;margin-bottom:6px;
          border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;
        " />
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button id="cn-open-btn" type="button" style="
            flex:1;background:#16a34a;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">Mở Tab Mới</button>
          <button id="cn-thub-btn" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">Copy "T HUB" & Mở Tab</button>
        </div>
        <div id="cn-note" style="font-size:11px;color:#94a3b8;margin-top:6px;">
          Nhập URL/tên miền sẽ mở thẳng trang đó; không nhập hoặc nhập từ khóa thường sẽ mở tab mới không gắn trang tìm kiếm ngoài.
        </div>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="cn-get-code" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Lấy Full Code</button>
          <button id="cn-copy-code" type="button" style="
            background:#475569;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Copy</button>
        </div>
        <textarea id="cn-code-area" rows="8" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
          width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
          border:1px solid #334155;border-radius:6px;padding:6px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
        "></textarea>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("cn-toggle-btn");
  const closeBtn = document.getElementById("cn-close-btn");
  const panel = document.getElementById("cn-panel");
  const input = document.getElementById("cn-input");
  const openBtn = document.getElementById("cn-open-btn");
  const thubBtn = document.getElementById("cn-thub-btn");
  const getCodeBtn = document.getElementById("cn-get-code");
  const copyCodeBtn = document.getElementById("cn-copy-code");
  const codeArea = document.getElementById("cn-code-area");

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI" : "Mở UI";
  }

  function resolveDirectUrl(raw) {
    const text = (raw || "").trim();
    if (!text) return "about:blank";
    if (/^https?:\/\//i.test(text)) return text;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text)) {
      return "https://" + text;
    }
    return "about:blank";
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

  openBtn.addEventListener("click", () => {
    const target = resolveDirectUrl(input.value);
    window.open(target, "_blank", "noopener,noreferrer");
  });

  thubBtn.addEventListener("click", async () => {
    input.value = "T HUB";
    await copyText("T HUB");
    window.open("about:blank", "_blank", "noopener,noreferrer");
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
