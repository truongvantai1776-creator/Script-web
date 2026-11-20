// ==UserScript==
// @name         Universal UI - Timer Speedup & Web Code Grabber
// @namespace    http://tampermonkey.net/
// @version      13.0
// @description  Thử đẩy nhanh bộ đếm thời gian phía client và lấy code của trang web hiện tại
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById('custom-ui-root')) return;

    // Thử đẩy nhanh các interval/timeout đếm ngược ngắn/trung bình phía trình duyệt
    const origSetInterval = window.setInterval;
    const origSetTimeout = window.setTimeout;

    window.setInterval = function (fn, delay, ...args) {
        const fastDelay = typeof delay === 'number' && delay >= 500 ? Math.min(delay, 60) : delay;
        return origSetInterval.call(this, fn, fastDelay, ...args);
    };

    window.setTimeout = function (fn, delay, ...args) {
        const fastDelay = typeof delay === 'number' && delay >= 1000 ? Math.min(delay, 120) : delay;
        return origSetTimeout.call(this, fn, fastDelay, ...args);
    };

    const root = document.createElement('div');
    root.id = 'custom-ui-root';
    root.style.all = 'initial';
    root.style.position = 'fixed';
    root.style.zIndex = '2147483647';
    root.style.bottom = '20px';
    root.style.right = '20px';
    document.documentElement.appendChild(root);

    const shadow = root.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
        <style>
            .panel {
                width: 340px;
                max-width: calc(100vw - 32px);
                background: #111114;
                color: #f4f4f5;
                border: 1px solid rgba(255, 255, 255, 0.14);
                border-radius: 12px;
                padding: 12px;
                font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .row {
                display: flex;
                gap: 8px;
            }
            button {
                flex: 1;
                padding: 8px 10px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                background: #2563eb;
                color: #fff;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
            }
            button.sec {
                background: #27272a;
            }
            textarea {
                width: 100%;
                min-height: 150px;
                max-height: 240px;
                box-sizing: border-box;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.14);
                background: #09090b;
                color: #86efac;
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 11px;
                padding: 8px;
                resize: vertical;
            }
            .status {
                font-size: 11px;
                color: #93c5fd;
            }
        </style>
        <div class="panel">
            <div class="row">
                <button id="getCodeBtn">Lấy code web</button>
                <button class="sec" id="copyCodeBtn">Copy code</button>
            </div>
            <textarea id="codeBox" placeholder="Full code của trang web hiện tại..."></textarea>
            <div class="status" id="statusMsg">Đang chạy chế độ rút ngắn timer phía trình duyệt.</div>
        </div>
    `;

    const getCodeBtn = shadow.getElementById('getCodeBtn');
    const copyCodeBtn = shadow.getElementById('copyCodeBtn');
    const codeBox = shadow.getElementById('codeBox');
    const statusMsg = shadow.getElementById('statusMsg');

    function getFullCode() {
        const clone = document.documentElement.cloneNode(true);
        const ui = clone.querySelector('#custom-ui-root');
        if (ui) ui.remove();
        return '<!DOCTYPE html>\n' + clone.outerHTML;
    }

    getCodeBtn.addEventListener('click', () => {
        const html = getFullCode();
        codeBox.value = html;
        statusMsg.textContent = `Đã lấy ${html.length.toLocaleString()} ký tự code.`;
    });

    copyCodeBtn.addEventListener('click', async () => {
        const html = codeBox.value || getFullCode();
        codeBox.value = html;
        try {
            await navigator.clipboard.writeText(html);
            statusMsg.textContent = 'Đã copy code.';
        } catch (_) {
            codeBox.select();
            document.execCommand('copy');
            statusMsg.textContent = 'Đã copy code.';
        }
    });
})();
