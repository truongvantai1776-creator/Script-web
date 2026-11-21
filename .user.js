// ==UserScript==
// @name         Safari Clipboard, Auto-Paste Input & Full Code UI
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Copy chữ/T HUB, mở tab mới, tự dán vào ô input đang focus trên trang hiện tại và lấy full code trang hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("safari-autopaste-ui")) return;

  let lastCopiedText = "";
  let lastFocusedInput = null;

  document.addEventListener(
    "focusin",
    (e) => {
      const el = e.target;
      if (!el || el.closest("#safari-autopaste-ui")) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) {
        lastFocusedInput = el;
      }
    },
    true
  );

  const root = document.createElement("div");
  root.id = "safari-autopaste-ui";
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
    <button id="sa-toggle-btn" type="button" style="
      background: #0ea5e9;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI</button>

    <div id="sa-panel" style="
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
        <strong>UI Safari & Full Code</strong>
        <button id="sa-close-btn" type="button" style="
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
        ">Đóng</button>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
        <div style="font-weight:600;margin-bottom:6px;">Từ Khóa & Dán Nhanh</div>
        <input id="sa-input" type="text" placeholder="Nhập chữ cần tìm (hoặc URL)..." style="
          width:100%;box-sizing:border-box;padding:7px 9px;margin-bottom:6px;
          border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;
        " />
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
          <button id="sa-copy-open-btn" type="button" style="
            flex:1;background:#16a34a;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">Copy & Mở Tab</button>
          <button id="sa-thub-btn" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;font-weight:600;
          ">T HUB</button>
        </div>
        <button id="sa-paste-focused-btn" type="button" style="
          width:100%;background:#7c3aed;color:#fff;border:none;border-radius:6px;
          padding:6px 10px;cursor:pointer;font-weight:600;
        ">Tự dán vào ô đang chọn trên trang</button>
        <div id="sa-status" style="font-size:11px;color:#94a3b8;margin-top:6px;">
          Không tự dán vào thanh địa chỉ tab mới/Safari được; bấm nút tím để dán vào ô input trên trang hiện tại.
        </div>
      </div>

      <div style="background:#1e293b;padding:8px;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="sa-get-code" type="button" style="
            background:#0284c7;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Lấy Full Code</button>
          <button id="sa-copy-code" type="button" style="
            background:#475569;color:#fff;border:none;border-radius:6px;
            padding:6px 10px;cursor:pointer;
          ">Copy</button>
        </div>
        <textarea id="sa-code-area" rows="8" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
          width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
          border:1px solid #334155;border-radius:6px;padding:6px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
        "></textarea>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("sa-toggle-btn");
  const closeBtn = document.getElementById("sa-close-btn");
  const panel = document.getElementById("sa-panel");
  const input = document.getElementById("sa-input");
  const copyOpenBtn = document.getElementById("sa-copy-open-btn");
  const thubBtn = document.getElementById("sa-thub-btn");
  const pasteFocusedBtn = document.getElementById("sa-paste-focused-btn");
  const statusEl = document.getElementById("sa-status");
  const getCodeBtn = document.getElementById("sa-get-code");
  const copyCodeBtn = document.getElementById("sa-copy-code");
  const codeArea = document.getElementById("sa-code-area");

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI" : "Mở UI";
  }

  function isDirectUrl(text) {
    return (
      /^https?:\/\//i.test(text) ||
      (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(text) && !/\s/.test(text))
    );
  }

  async function copyText(str) {
    lastCopiedText = str;
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

  async function readClipboardOrFallback() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) return text;
    } catch {}
    return input.value.trim() || lastCopiedText || "T HUB";
  }

  function fillTargetElement(el, text) {
    if (!el) return false;
    el.focus();
    if (el.isContentEditable) {
      el.textContent = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    const proto =
      el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, text);
    } else {
      el.value = text;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  async function runAction(raw) {
    const text = (raw || "").trim();
    if (!text) {
      window.open("about:blank", "_blank", "noopener,noreferrer");
      statusEl.textContent = "Đã mở tab mới.";
      return;
    }

    if (isDirectUrl(text)) {
      const url = /^https?:\/\//i.test(text) ? text : "https://" + text;
      window.open(url, "_blank", "noopener,noreferrer");
      statusEl.textContent = `Đã mở trang: ${url}`;
      return;
    }

    await copyText(text);
    window.open("about:blank", "_blank", "noopener,noreferrer");
    statusEl.textContent = `Đã copy "${text}" — thanh địa chỉ Safari không cho script tự dán trực tiếp.`;
  }

  toggleBtn.addEventListener("click", () => setOpen(panel.style.display !== "block"));
  closeBtn.addEventListener("click", () => setOpen(false));

  copyOpenBtn.addEventListener("click", () => runAction(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runAction(input.value);
    }
  });

  thubBtn.addEventListener("click", () => {
    input.value = "T HUB";
    runAction("T HUB");
  });

  pasteFocusedBtn.addEventListener("click", async () => {
    const textToPaste = await readClipboardOrFallback();
    const ok = fillTargetElement(lastFocusedInput, textToPaste);
    if (ok) {
      statusEl.textContent = `Đã dán "${textToPaste}" vào ô đang chọn trên trang.`;
    } else {
      statusEl.textContent = `Chưa thấy ô input nào được chọn trên trang (đã giữ sẵn "${textToPaste}").`;
    }
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
