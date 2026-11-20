// ==UserScript==
// @name         Universal UI - Get Web Code & Instant G Result
// @namespace    http://tampermonkey.net/
// @version      12.0
// @description  Chỉ giữ tính năng lấy code trong web và nút xanh G hiện kết quả ngay lập tức
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById('custom-ui-root')) return;

    const root = document.createElement('div');
    root.id = 'custom-ui-root';
    root.style.all = 'initial';
    root.style.position = 'fixed';
    root.style.zIndex = '2147483647';
    root.style.top = '0';
    root.style.left = '0';
    root.style.width = '0';
    root.style.height = '0';
    document.documentElement.appendChild(root);

    const shadow = root.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
        <style>
            .g-btn {
                position: fixed;
                bottom: 84px;
                right: 20px;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: 2px solid #93c5fd;
                background: #2563eb;
                color: #ffffff;
                font-size: 16px;
                font-weight: 800;
                font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
                cursor: pointer;
                box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.12s ease, background 0.12s ease;
                user-select: none;
                touch-action: none;
            }
            .g-btn:hover {
                background: #1d4ed8;
                transform: scale(1.05);
            }
            .toggle-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: none;
                background: #18181b;
                color: #ffffff;
                font-size: 13px;
                font-weight: 700;
                font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
                cursor: pointer;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.38);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.12s ease, background 0.12s ease;
                user-select: none;
                touch-action: none;
            }
            .toggle-btn:hover {
                background: #27272a;
                transform: scale(1.05);
            }
            .main-ui {
                position: fixed;
                bottom: 142px;
                right: 20px;
                width: 370px;
                max-width: calc(100vw - 32px);
                max-height: calc(100vh - 165px);
                background: #111114;
                color: #f4f4f5;
                border: 1px solid rgba(255, 255, 255, 0.14);
                border-radius: 14px;
                box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
                font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            .main-ui.open {
                display: flex;
            }
            .ui-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 14px;
                background: #18181c;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .ui-title {
                font-size: 13px;
                font-weight: 700;
            }
            .ui-close {
                background: transparent;
                border: none;
                color: #a1a1aa;
                font-size: 20px;
                line-height: 1;
                cursor: pointer;
                padding: 2px 6px;
            }
            .ui-close:hover {
                color: #ffffff;
            }
            .ui-body {
                padding: 12px 14px;
                display: flex;
                flex-direction: column;
                gap: 9px;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            .row {
                display: flex;
                gap: 8px;
            }
            .ui-btn {
                flex: 1;
                padding: 9px 10px;
                border-radius: 9px;
                border: 1px solid rgba(255, 255, 255, 0.14);
                background: #27272a;
                color: #ffffff;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
            }
            .ui-btn:hover {
                background: #3f3f46;
            }
            .ui-btn.blue {
                background: #2563eb;
                border-color: #60a5fa;
            }
            .ui-btn.blue:hover {
                background: #1d4ed8;
            }
            .section-label {
                font-size: 11px;
                font-weight: 700;
                color: #a1a1aa;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }
            .result-box {
                width: 100%;
                min-height: 95px;
                max-height: 140px;
                box-sizing: border-box;
                border-radius: 8px;
                border: 1px solid rgba(96, 165, 250, 0.35);
                background: #0b1120;
                color: #dbeafe;
                font-size: 12px;
                line-height: 1.45;
                padding: 8px 10px;
                resize: vertical;
                outline: none;
            }
            .code-box {
                width: 100%;
                min-height: 140px;
                max-height: 220px;
                box-sizing: border-box;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.14);
                background: #09090b;
                color: #86efac;
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11px;
                line-height: 1.35;
                padding: 8px 10px;
                resize: vertical;
                outline: none;
            }
            .status-msg {
                font-size: 11px;
                color: #93c5fd;
                min-height: 15px;
            }
        </style>

        <button class="g-btn" id="gBtn" title="Hiện kết quả ngay">G</button>
        <button class="toggle-btn" id="toggleBtn" title="Mở/Đóng UI">UI</button>

        <div class="main-ui" id="mainUi">
            <div class="ui-header">
                <span class="ui-title">Lấy Code Web & Kết Quả G</span>
                <button class="ui-close" id="closeBtn">&times;</button>
            </div>
            <div class="ui-body">
                <div class="row">
                    <button class="ui-btn blue" id="getCodeBtn">Lấy code trang web</button>
                    <button class="ui-btn" id="copyCodeBtn">Copy code</button>
                </div>

                <div class="section-label">Kết quả nhanh (Nút G)</div>
                <textarea class="result-box" id="quickResultBox" placeholder="Bấm nút xanh G để hiện kết quả ngay lập tức..."></textarea>

                <div class="section-label">Full Code HTML của trang web</div>
                <textarea class="code-box" id="codeBox" placeholder="Code của trang web sẽ hiện ở đây..."></textarea>

                <div class="status-msg" id="statusMsg">Sẵn sàng.</div>
            </div>
        </div>
    `;

    const gBtn = shadow.getElementById('gBtn');
    const toggleBtn = shadow.getElementById('toggleBtn');
    const mainUi = shadow.getElementById('mainUi');
    const closeBtn = shadow.getElementById('closeBtn');
    const getCodeBtn = shadow.getElementById('getCodeBtn');
    const copyCodeBtn = shadow.getElementById('copyCodeBtn');
    const quickResultBox = shadow.getElementById('quickResultBox');
    const codeBox = shadow.getElementById('codeBox');
    const statusMsg = shadow.getElementById('statusMsg');

    let isOpen = false;
    function setOpen(state) {
        isOpen = state;
        mainUi.classList.toggle('open', isOpen);
    }

    closeBtn.addEventListener('click', () => setOpen(false));

    function makeDraggableButton(btn, onClickAction) {
        let dragging = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let origRight = 20;
        let origBottom = 20;

        btn.addEventListener('pointerdown', (e) => {
            dragging = true;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            origRight = parseInt(btn.style.right || '20', 10);
            origBottom = parseInt(btn.style.bottom || '20', 10);
            btn.setPointerCapture(e.pointerId);
        });

        btn.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
            if (!moved) return;

            const nextRight = Math.max(8, Math.min(window.innerWidth - 56, origRight - dx));
            const nextBottom = Math.max(8, Math.min(window.innerHeight - 56, origBottom - dy));
            btn.style.right = nextRight + 'px';
            btn.style.bottom = nextBottom + 'px';
        });

        btn.addEventListener('pointerup', () => {
            if (!dragging) return;
            dragging = false;
            if (!moved) {
                onClickAction();
            }
        });
    }

    function extractPageCode() {
        const clone = document.documentElement.cloneNode(true);
        const injected = clone.querySelector('#custom-ui-root');
        if (injected) injected.remove();
        return '<!DOCTYPE html>\n' + clone.outerHTML;
    }

    // Nút xanh G: hiện kết quả ngay lập tức (không chờ đợi)
    function showInstantResult() {
        setOpen(true);
        const htmlCode = extractPageCode();
        codeBox.value = htmlCode;

        const cleanText = (document.body.innerText || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 450);

        const linkCount = Array.from(document.querySelectorAll('a[href]')).filter((a) => !root.contains(a)).length;
        const imgCount = Array.from(document.querySelectorAll('img')).filter((img) => !root.contains(img)).length;

        quickResultBox.value =
            `URL: ${location.href}\n` +
            `Tiêu đề: ${document.title || '(Không có)'}\n` +
            `Độ dài code: ${htmlCode.length.toLocaleString()} ký tự | Link: ${linkCount} | Ảnh: ${imgCount}\n` +
            `Nội dung nổi bật: ${cleanText || '(Trống)'}`;

        statusMsg.textContent = 'Đã hiện kết quả ngay lập tức từ nút G.';
    }

    makeDraggableButton(gBtn, showInstantResult);
    makeDraggableButton(toggleBtn, () => setOpen(!isOpen));

    getCodeBtn.addEventListener('click', () => {
        const htmlCode = extractPageCode();
        codeBox.value = htmlCode;
        statusMsg.textContent = `Đã lấy code trang (${htmlCode.length.toLocaleString()} ký tự).`;
    });

    copyCodeBtn.addEventListener('click', async () => {
        const content = codeBox.value || extractPageCode();
        codeBox.value = content;
        try {
            await navigator.clipboard.writeText(content);
            statusMsg.textContent = 'Đã copy full code.';
        } catch (_) {
            codeBox.select();
            document.execCommand('copy');
            statusMsg.textContent = 'Đã copy full code.';
        }
    });
})();
