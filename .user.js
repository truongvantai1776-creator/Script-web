// ==UserScript==
// @name         Desktop Browser Window & Full Code UI
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  Cửa sổ nổi kiểu trình duyệt PC (kéo thanh tiêu đề, thanh địa chỉ + điều hướng iframe, mở tab mới, nút T HUB và lấy full code trang hiện tại)
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self || document.getElementById("pc-browser-window-ui")) return;

  const root = document.createElement("div");
  root.id = "pc-browser-window-ui";
  root.style.cssText = `
    position: fixed;
    bottom: 18px;
    right: 18px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 13px;
    color: #f8fafc;
  `;

  root.innerHTML = `
    <button id="pc-toggle-btn" type="button" style="
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    ">Mở UI</button>

    <div id="pc-window" style="
      display: none;
      margin-top: 8px;
      width: 410px;
      max-width: 95vw;
      max-height: 86vh;
      overflow-y: auto;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
    ">
      <!-- Thanh tiêu đề kiểu cửa sổ PC -->
      <div id="pc-titlebar" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
        border-radius: 12px 12px 0 0;
        cursor: move;
        user-select: none;
        touch-action: none;
      ">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span>
          <span style="width:10px;height:10px;border-radius:50%;background:#eab308;display:inline-block;"></span>
          <span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block;"></span>
          <strong style="margin-left:4px;font-size:12px;">PC Browser UI</strong>
        </div>
        <button id="pc-close-btn" type="button" style="
          background: transparent;
          color: #94a3b8;
          border: 1px solid #475569;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
          font-size: 11px;
        ">Đóng</button>
      </div>

      <div style="padding:12px;">
        <!-- Thanh địa chỉ & điều hướng -->
        <div style="background:#1e293b;padding:8px;border-radius:8px;margin-bottom:10px;">
          <div style="display:flex;gap:4px;margin-bottom:6px;">
            <button id="pc-back-btn" type="button" title="Lùi" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">←</button>
            <button id="pc-forward-btn" type="button" title="Tới" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">→</button>
            <button id="pc-reload-btn" type="button" title="Tải lại" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">↻</button>
            <input id="pc-addr-input" type="text" placeholder="Nhập URL hoặc từ khóa..." style="
              flex:1;min-width:0;padding:5px 8px;border-radius:6px;
              border:1px solid #475569;background:#0f172a;color:#fff;
            " />
            <button id="pc-go-btn" type="button" style="
              background:#16a34a;color:#fff;border:none;border-radius:6px;
              padding:5px 10px;cursor:pointer;font-weight:600;
            ">Đi</button>
          </div>

          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
            <button id="pc-thub-btn" type="button" style="
              background:#0284c7;color:#fff;border:none;border-radius:6px;
              padding:5px 9px;cursor:pointer;font-size:12px;font-weight:600;
            ">T HUB</button>
            <button id="pc-newtab-btn" type="button" style="
              background:#334155;color:#fff;border:none;border-radius:6px;
              padding:5px 9px;cursor:pointer;font-size:12px;
            ">Mở tab mới</button>
          </div>

          <iframe id="pc-frame" src="about:blank" style="
            width:100%;height:220px;border:1px solid #475569;border-radius:6px;background:#ffffff;
          "></iframe>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
            Khung dùng iframe: các trang chặn nhúng (X-Frame-Options / CSP) có thể không hiển thị — dùng "Mở tab mới" nếu cần.
          </div>
        </div>

        <!-- Lấy Full Code trang hiện tại -->
        <div style="background:#1e293b;padding:8px;border-radius:8px;">
          <div style="font-weight:600;margin-bottom:6px;">Full Code Trang Hiện Tại</div>
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <button id="pc-get-code" type="button" style="
              background:#0284c7;color:#fff;border:none;border-radius:6px;
              padding:6px 10px;cursor:pointer;
            ">Lấy Full Code</button>
            <button id="pc-copy-code" type="button" style="
              background:#475569;color:#fff;border:none;border-radius:6px;
              padding:6px 10px;cursor:pointer;
            ">Copy</button>
          </div>
          <textarea id="pc-code-area" rows="7" placeholder="Mã nguồn HTML sẽ hiển thị tại đây..." style="
            width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;
            border:1px solid #334155;border-radius:6px;padding:6px;
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
          "></textarea>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById("pc-toggle-btn");
  const closeBtn = document.getElementById("pc-close-btn");
  const win = document.getElementById("pc-window");
  const titlebar = document.getElementById("pc-titlebar");
  const backBtn = document.getElementById("pc-back-btn");
  const forwardBtn = document.getElementById("pc-forward-btn");
  const reloadBtn = document.getElementById("pc-reload-btn");
  const addrInput = document.getElementById("pc-addr-input");
  const goBtn = document.getElementById("pc-go-btn");
  const thubBtn = document.getElementById("pc-thub-btn");
  const newTabBtn = document.getElementById("pc-newtab-btn");
  const frame = document.getElementById("pc-frame");
  const getCodeBtn = document.getElementById("pc-get-code");
  const copyCodeBtn = document.getElementById("pc-copy-code");
  const codeArea = document.getElementById("pc-code-area");

  function setOpen(open) {
    win.style.display = open ? "block" : "none";
    toggleBtn.textContent = open ? "Ẩn UI" : "Mở UI";
  }

  function buildTargetUrl(raw) {
    const text = (raw || "").trim();
    if (!text) return "";
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

  // Kéo thả cửa sổ theo thanh tiêu đề
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  titlebar.addEventListener("pointerdown", (e) => {
    if (e.target === closeBtn) return;
    dragging = true;
    const rect = root.getBoundingClientRect();
    root.style.left = rect.left + "px";
    root.style.top = rect.top + "px";
    root.style.right = "auto";
    root.style.bottom = "auto";
    startX = e.clientX;
    startY = e.clientY;
    origLeft = rect.left;
    origTop = rect.top;
    titlebar.setPointerCapture(e.pointerId);
  });

  titlebar.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const nextLeft = origLeft + (e.clientX - startX);
    const nextTop = origTop + (e.clientY - startY);
    root.style.left = Math.max(0, nextLeft) + "px";
    root.style.top = Math.max(0, nextTop) + "px";
  });

  titlebar.addEventListener("pointerup", () => {
    dragging = false;
  });

  toggleBtn.addEventListener("click", () => setOpen(win.style.display !== "block"));
  closeBtn.addEventListener("click", () => setOpen(false));

  goBtn.addEventListener("click", () => {
    const url = buildTargetUrl(addrInput.value);
    if (url) frame.src = url;
  });

  addrInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const url = buildTargetUrl(addrInput.value);
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

  newTabBtn.addEventListener("click", () => {
    const url = buildTargetUrl(addrInput.value) || (frame.src !== "about:blank" ? frame.src : "https://www.google.com/");
    window.open(url, "_blank", "noopener,noreferrer");
  });

  thubBtn.addEventListener("click", async () => {
    await copyText("T HUB");
    addrInput.value = "T HUB";
    thubBtn.textContent = 'Đã copy "T HUB"';
    setTimeout(() => (thubBtn.textContent = "T HUB"), 1200);
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
