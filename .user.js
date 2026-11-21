// ==UserScript==
// @name         Browser Frame Wrapper & Full Code UI
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Khung điều khiển kiểu thanh địa chỉ quanh iframe, mở tab mới khi bị chặn nhúng và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("browser-wrapper-ui")) return;

  const root = document.createElement("div");
  root.id = "browser-wrapper-ui";
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
    <button id="bw-toggle-btn" type="button" style="
      background: #0ea5e9;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI</button>

    <div id="bw-panel" style="
      display: none;
      margin-top: 8px;
      width: 380px;
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
        <strong>Khung iFrame & Full Code</strong>
        <button id="bw-close-btn" type="button" style="
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
        ">Đóng</button>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
        <div style="display:flex;gap:4px;margin-bottom:6px;">
          <button id="bw-back-btn" type="button" title="Lùi" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">←</button>
          <button id="bw-forward-btn" type="button" title="Tới" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">→</button>
          <button id="bw-reload-btn" type="button" title="Tải lại khung" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">↻</button>
          <input id="bw-url-input" type="text" placeholder="Nhập URL (vd: https://example.com)..." style="
            flex:1;min-width:0;padding:5px 8px;border-radius:6px;
            border:1px solid #475569;background:#0f172a;color:#fff;
          " />
          <button id="bw-go-btn" type="button" style="
            background:#16a34a;color:#fff;border:none;border-radius:6px;
            padding:5px 10px;cursor:pointer;font-weight:600;
          ">Tải</button>
        </div>

        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="bw-thub-btn" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:5px 9px;cursor:pointer;font-size:12px;font-weight:600;
          ">Copy "T HUB"</button>
          <button id="bw-ext-btn" type="button" style="
            background:#334155;color:#fff;border:none;border-radius:6px;
            padding:5px 9px;cursor:pointer;font-size:12px;
          ">Mở tab mới</button>
        </div>

        <iframe id="bw-frame" src="about:blank" style="
          width:100%;height:220px;border:1px solid #475569;border-radius:6px;background:#ffffff;
        "></iframe>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
          Lưu ý: đây chỉ là thẻ iframe; nhiều trang chặn nhúng sẽ hiện trống hoặc báo từ chối kết nối.
        </div>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="bw-get-code" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Lấy Full Code</button>
          <button id="bw-copy-code" type="button" style="
            background:#475569;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Copy</button>
        </div>
        <textarea id="bw-code-area" rows="7" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
          width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
          border:1px solid #334155;border-radius:6px;padding:6px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
        "></textarea>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("bw-toggle-btn");
  const closeBtn = document.getElementById("bw-close-btn");
  const panel = document.getElementById("bw-panel");
  const backBtn = document.getElementById("bw-back-btn");
  const forwardBtn = document.getElementById("bw-forward-btn");
  const reloadBtn = document.getElementById("bw-reload-btn");
  const urlInput = document.getElementById("bw-url-input");
  const goBtn = document.getElementById("bw-go-btn");
  const thubBtn = document.getElementById("bw-thub-btn");
  const extBtn = document.getElementById("bw-ext-btn");
  const frame = document.getElementById("bw-frame");
  const getCodeBtn = document.getElementById("bw-get-code");
  const copyCodeBtn = document.getElementById("bw-copy-code");
  const codeArea = document.getElementById("bw-code-area");

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI" : "Mở UI";
  }

  function normalizeUrl(raw) {
    const text = (raw || "").trim();
    if (!text) return "";
    if (/^https?:\/\//i.test(text)) return text;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text)) {
      return "https://" + text;
    }
    return "";
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

  goBtn.addEventListener("click", () => {
    const url = normalizeUrl(urlInput.value);
    if (url) frame.src = url;
  });

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const url = normalizeUrl(urlInput.value);
      if (url) frame.src = url;
    }
  });

  backBtn.addEventListener("click", () => {
    try {
      frame.contentWindow.history.back();
    } catch {}
  });

  forwardBtn.addEventListener("click", () => {
    try {
      frame.contentWindow.history.forward();
    } catch {}
  });

  reloadBtn.addEventListener("click", () => {
    try {
      frame.contentWindow.location.reload();
    } catch {
      frame.src = frame.src;
    }
  });

  extBtn.addEventListener("click", () => {
    const url = normalizeUrl(urlInput.value) || frame.src;
    if (url && url !== "about:blank") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  });

  thubBtn.addEventListener("click", async () => {
    await copyText("T HUB");
    thubBtn.textContent = 'Đã copy "T HUB"';
    setTimeout(() => (thubBtn.textContent = 'Copy "T HUB"'), 1200);
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
