// ==UserScript==
// @name         Mini Parallel Frames & Full Code UI
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  2 khung thu nhỏ chạy song song trong UI, nút T HUB copy + mở, mở tab mới khi bị chặn iframe và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("mini-parallel-ui")) return;

  const root = document.createElement("div");
  root.id = "mini-parallel-ui";
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
    <button id="mp-toggle-btn" type="button" style="
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI</button>

    <div id="mp-panel" style="
      display: none;
      margin-top: 8px;
      width: 420px;
      max-width: 95vw;
      max-height: 86vh;
      overflow-y: auto;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <strong>Khung Thu Nhỏ Song Song & Full Code</strong>
        <button id="mp-close-btn" type="button" style="
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
        ">Đóng</button>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
        <div style="font-weight:600;margin-bottom:6px;">Chạy Song Song Trong UI</div>
        <input id="mp-input" type="text" placeholder="Nhập từ khóa hoặc URL..." style="
          width:100%;box-sizing:border-box;padding:7px 9px;margin-bottom:6px;
          border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;
        " />
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          <button id="mp-run-btn" type="button" style="
            flex:1;background:#16a34a;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">Chạy Song Song</button>
          <button id="mp-thub-btn" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">T HUB</button>
          <button id="mp-tab1-btn" type="button" style="
            background:#334155;color:#fff;border:none;border-radius:6px;
            padding:6px 8px;cursor:pointer;font-size:12px;
          ">Tab 1</button>
          <button id="mp-tab2-btn" type="button" style="
            background:#334155;color:#fff;border:none;border-radius:6px;
            padding:6px 8px;cursor:pointer;font-size:12px;
          ">Tab 2</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">Khung A (Google)</div>
            <iframe id="mp-frame-1" src="about:blank" style="
              width:100%;height:180px;border:1px solid #475569;border-radius:6px;background:#ffffff;
            "></iframe>
          </div>
          <div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">Khung B (Bing / URL)</div>
            <iframe id="mp-frame-2" src="about:blank" style="
              width:100%;height:180px;border:1px solid #475569;border-radius:6px;background:#ffffff;
            "></iframe>
          </div>
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-top:5px;">
          Google thường chặn nhúng iframe nên Khung A có thể trống — bấm "Tab 1" hoặc "Tab 2" để mở thẳng trên trình duyệt.
        </div>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="mp-get-code" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Lấy Full Code</button>
          <button id="mp-copy-code" type="button" style="
            background:#475569;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Copy</button>
        </div>
        <textarea id="mp-code-area" rows="7" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
          width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
          border:1px solid #334155;border-radius:6px;padding:6px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
        "></textarea>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("mp-toggle-btn");
  const closeBtn = document.getElementById("mp-close-btn");
  const panel = document.getElementById("mp-panel");
  const input = document.getElementById("mp-input");
  const runBtn = document.getElementById("mp-run-btn");
  const thubBtn = document.getElementById("mp-thub-btn");
  const tab1Btn = document.getElementById("mp-tab1-btn");
  const tab2Btn = document.getElementById("mp-tab2-btn");
  const frame1 = document.getElementById("mp-frame-1");
  const frame2 = document.getElementById("mp-frame-2");
  const getCodeBtn = document.getElementById("mp-get-code");
  const copyCodeBtn = document.getElementById("mp-copy-code");
  const codeArea = document.getElementById("mp-code-area");

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI" : "Mở UI";
  }

  function getUrls(raw) {
    const text = (raw || "").trim();
    if (!text) {
      return {
        url1: "https://www.google.com/",
        url2: "https://www.bing.com/"
      };
    }
    if (/^https?:\/\//i.test(text) || (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text))) {
      const direct = /^https?:\/\//i.test(text) ? text : "https://" + text;
      return {
        url1: direct,
        url2: "https://www.bing.com/search?q=" + encodeURIComponent(text)
      };
    }
    const q = encodeURIComponent(text);
    return {
      url1: `https://www.google.com/search?q=${q}`,
      url2: `https://www.bing.com/search?q=${q}`
    };
  }

  function runParallel(raw) {
    const { url1, url2 } = getUrls(raw);
    frame1.src = url1;
    frame2.src = url2;
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

  runBtn.addEventListener("click", () => runParallel(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runParallel(input.value);
    }
  });

  thubBtn.addEventListener("click", async () => {
    input.value = "T HUB";
    await copyText("T HUB");
    runParallel("T HUB");
  });

  tab1Btn.addEventListener("click", () => {
    const { url1 } = getUrls(input.value);
    window.open(url1, "_blank", "noopener,noreferrer");
  });

  tab2Btn.addEventListener("click", () => {
    const { url2 } = getUrls(input.value);
    window.open(url2, "_blank", "noopener,noreferrer");
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
