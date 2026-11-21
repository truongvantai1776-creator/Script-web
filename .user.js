// ==UserScript==
// @name         T-HUB Web Inspector & Mini TikTok (In-UI)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Lấy full source code trang web hiện tại và xem trong UI không mở tab mới
// @author       T HUB
// @match        *://*/*
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) return;

    const host = document.createElement('div');
    host.id = 'thub-userscript-host';
    host.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 2147483647; pointer-events: none;';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
        * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        #toggle-btn {
            position: fixed;
            bottom: 80px;
            right: 15px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff0050, #00f2fe);
            color: #fff;
            border: 2px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            font-weight: bold;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            pointer-events: auto;
            user-select: none;
            touch-action: none;
        }
        #main-ui {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 92vw;
            max-width: 420px;
            height: 75vh;
            max-height: 620px;
            background: #121216;
            color: #f1f1f1;
            border-radius: 16px;
            border: 1px solid #2c2c35;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.75);
            display: none;
            flex-direction: column;
            overflow: hidden;
            pointer-events: auto;
        }
        #main-ui.open {
            display: flex;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #1a1a22;
            border-bottom: 1px solid #2c2c35;
        }
        .title {
            font-size: 15px;
            font-weight: 700;
            background: linear-gradient(90deg, #00f2fe, #ff0050);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .close-btn {
            background: #ff3b30;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .tabs {
            display: flex;
            background: #16161d;
            border-bottom: 1px solid #2c2c35;
        }
        .tab-btn {
            flex: 1;
            padding: 10px;
            background: transparent;
            border: none;
            color: #8e8e98;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }
        .tab-btn.active {
            color: #ffffff;
            border-bottom: 2px solid #00f2fe;
            background: #1f1f29;
        }
        .tab-content {
            flex: 1;
            display: none;
            flex-direction: column;
            overflow: hidden;
            padding: 12px;
        }
        .tab-content.active {
            display: flex;
        }
        .code-actions {
            display: flex;
            gap: 8px;
            margin-bottom: 10px;
        }
        .action-btn {
            flex: 1;
            padding: 8px 10px;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            color: #fff;
            background: #2b2b36;
        }
        .action-btn.primary { background: #007aff; }
        .action-btn.success { background: #28a745; }
        #code-viewer {
            flex: 1;
            width: 100%;
            background: #0a0a0d;
            color: #a6e22e;
            border: 1px solid #2c2c35;
            border-radius: 8px;
            padding: 10px;
            font-family: "Courier New", Courier, monospace;
            font-size: 11px;
            resize: none;
            outline: none;
            white-space: pre;
            overflow: auto;
        }
        #tab-tiktok {
            padding: 0;
            position: relative;
        }
        .tiktok-bar {
            display: flex;
            gap: 6px;
            padding: 8px 10px;
            background: #1a1a22;
            border-bottom: 1px solid #2c2c35;
        }
        .tiktok-bar input {
            flex: 1;
            background: #0d0d12;
            border: 1px solid #2c2c35;
            color: #fff;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
            outline: none;
        }
        .tiktok-bar button {
            background: #ff0050;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 0 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .tiktok-bar button.reload-btn {
            background: #2b2b36;
        }
        .frame-wrap {
            flex: 1;
            position: relative;
            background: #0d0d12;
            display: flex;
            flex-direction: column;
        }
        #tiktok-frame {
            flex: 1;
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
        }
        .frame-status {
            font-size: 11px;
            color: #b5b5c3;
            padding: 6px 10px;
            background: #16161d;
            border-top: 1px solid #2c2c35;
            text-align: center;
        }
    `;
    shadow.appendChild(style);

    const container = document.createElement('div');
    container.innerHTML = `
        <div id="toggle-btn" title="Mở/Tắt Menu">UI</div>

        <div id="main-ui">
            <div class="header">
                <span class="title">WEB CODE & TIKTOK</span>
                <button class="close-btn" id="close-ui-btn">Đóng UI</button>
            </div>

            <div class="tabs">
                <button class="tab-btn active" data-target="tab-code">Full Code Web</button>
                <button class="tab-btn" data-target="tab-tiktok">Lướt TikTok</button>
            </div>

            <div id="tab-code" class="tab-content active">
                <div class="code-actions">
                    <button class="action-btn primary" id="btn-refresh-code">Lấy lại Code</button>
                    <button class="action-btn success" id="btn-copy-code">Copy Code</button>
                    <button class="action-btn" id="btn-download-code">Tải .HTML</button>
                </div>
                <textarea id="code-viewer" readonly placeholder="Nhấn 'Lấy lại Code' để tải mã nguồn trang hiện tại..."></textarea>
            </div>

            <div id="tab-tiktok" class="tab-content">
                <div class="tiktok-bar">
                    <input type="text" id="tiktok-url" value="https://www.tiktok.com/foryou" placeholder="Nhập link TikTok hoặc @username...">
                    <button id="btn-go-tiktok">Đi</button>
                    <button class="reload-btn" id="btn-reload-tiktok">Tải lại</button>
                </div>
                <div class="frame-wrap">
                    <iframe id="tiktok-frame" src="about:blank" allow="autoplay; fullscreen; encrypted-media"></iframe>
                </div>
                <div class="frame-status" id="frame-status">Chế độ xem trực tiếp trong UI (không mở tab mới).</div>
            </div>
        </div>
    `;
    shadow.appendChild(container);

    const toggleBtn = shadow.getElementById('toggle-btn');
    const mainUI = shadow.getElementById('main-ui');
    const closeUiBtn = shadow.getElementById('close-ui-btn');
    const tabBtns = shadow.querySelectorAll('.tab-btn');
    const tabContents = shadow.querySelectorAll('.tab-content');

    const codeViewer = shadow.getElementById('code-viewer');
    const btnRefreshCode = shadow.getElementById('btn-refresh-code');
    const btnCopyCode = shadow.getElementById('btn-copy-code');
    const btnDownloadCode = shadow.getElementById('btn-download-code');

    const tiktokUrlInput = shadow.getElementById('tiktok-url');
    const btnGoTiktok = shadow.getElementById('btn-go-tiktok');
    const btnReloadTiktok = shadow.getElementById('btn-reload-tiktok');
    const tiktokFrame = shadow.getElementById('tiktok-frame');
    const frameStatus = shadow.getElementById('frame-status');

    let tiktokLoaded = false;

    function extractFullCode() {
        const doctype = document.doctype
            ? new XMLSerializer().serializeToString(document.doctype) + '\n'
            : '<!DOCTYPE html>\n';
        codeViewer.value = doctype + document.documentElement.outerHTML;
    }

    function toggleUI() {
        const isOpen = mainUI.classList.toggle('open');
        toggleBtn.textContent = isOpen ? 'Ẩn' : 'UI';
        if (isOpen && !codeViewer.value) {
            extractFullCode();
        }
    }

    function loadTikTokInFrame(rawUrl) {
        let val = (rawUrl || '').trim();
        if (!val) return;
        if (val.startsWith('@')) {
            val = `https://www.tiktok.com/${val}`;
        } else if (!val.startsWith('http')) {
            val = `https://www.tiktok.com/search?q=${encodeURIComponent(val)}`;
        }
        tiktokUrlInput.value = val;
        frameStatus.textContent = 'Đang tải nội dung trong khung UI...';
        tiktokFrame.src = val;
        tiktokLoaded = true;
    }

    tiktokFrame.addEventListener('load', () => {
        if (tiktokFrame.src === 'about:blank') return;
        frameStatus.textContent = 'Đã gửi yêu cầu tải. Nếu vẫn đen/trắng là trình duyệt đang chặn nhúng TikTok.';
    });

    closeUiBtn.addEventListener('click', () => {
        mainUI.classList.remove('open');
        toggleBtn.textContent = 'UI';
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            shadow.getElementById(targetId).classList.add('active');

            if (targetId === 'tab-tiktok' && !tiktokLoaded) {
                loadTikTokInFrame(tiktokUrlInput.value);
            }
        });
    });

    btnRefreshCode.addEventListener('click', () => {
        extractFullCode();
        btnRefreshCode.textContent = 'Đã cập nhật!';
        setTimeout(() => btnRefreshCode.textContent = 'Lấy lại Code', 1200);
    });

    btnCopyCode.addEventListener('click', () => {
        if (!codeViewer.value) extractFullCode();
        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(codeViewer.value);
        } else {
            codeViewer.select();
            document.execCommand('copy');
        }
        btnCopyCode.textContent = 'Đã Copy!';
        setTimeout(() => btnCopyCode.textContent = 'Copy Code', 1500);
    });

    btnDownloadCode.addEventListener('click', () => {
        if (!codeViewer.value) extractFullCode();
        const blob = new Blob([codeViewer.value], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const pageTitle = (document.title || 'source-code').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.href = url;
        a.download = `${pageTitle}.html`;
        a.click();
        URL.revokeObjectURL(url);
    });

    btnGoTiktok.addEventListener('click', () => {
        loadTikTokInFrame(tiktokUrlInput.value);
    });

    btnReloadTiktok.addEventListener('click', () => {
        loadTikTokInFrame(tiktokUrlInput.value);
    });

    let isDragging = false;
    let hasMoved = false;
    let startX, startY, initialLeft, initialTop;

    function onDragStart(e) {
        isDragging = true;
        hasMoved = false;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = toggleBtn.getBoundingClientRect();
        startX = clientX;
        startY = clientY;
        initialLeft = rect.left;
        initialTop = rect.top;
    }

    function onDragMove(e) {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - startX;
        const dy = clientY - startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasMoved = true;
        }

        if (hasMoved) {
            e.preventDefault();
            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;
            newLeft = Math.max(5, Math.min(window.innerWidth - 53, newLeft));
            newTop = Math.max(5, Math.min(window.innerHeight - 53, newTop));

            toggleBtn.style.left = newLeft + 'px';
            toggleBtn.style.top = newTop + 'px';
            toggleBtn.style.right = 'auto';
            toggleBtn.style.bottom = 'auto';
        }
    }

    function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        if (!hasMoved) {
            toggleUI();
        }
    }

    toggleBtn.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    toggleBtn.addEventListener('touchstart', onDragStart, { passive: false });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
})();
