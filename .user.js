// ==UserScript==
// @name         T-HUB Web Inspector & Multi-View Zoom (In-UI)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Lấy full code web, mở mặc định gtraffic.io/9n7gQST, thêm nhiều khung web và chỉnh zoom ngay trong UI
// @author       T HUB
// @match        *://*/*
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) return;

    const DEFAULT_URL = 'https://gtraffic.io/9n7gQST';

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

        /* Nút bật/tắt UI nổi */
        #toggle-btn {
            position: fixed;
            bottom: 80px;
            right: 15px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff0050, #00f2fe);
            color: #fff;
            border: 2px solid rgba(255, 255, 255, 0.85);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.45);
            font-weight: 700;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            pointer-events: auto;
            user-select: none;
            touch-action: none;
        }

        /* Cửa sổ UI chính */
        #main-ui {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 94vw;
            max-width: 480px;
            height: 80vh;
            max-height: 680px;
            background: #121216;
            color: #f1f1f1;
            border-radius: 16px;
            border: 1px solid #2c2c35;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            overflow: hidden;
            pointer-events: auto;
        }
        #main-ui.open {
            display: flex;
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            background: #1a1a22;
            border-bottom: 1px solid #2c2c35;
        }
        .title {
            font-size: 14px;
            font-weight: 700;
            background: linear-gradient(90deg, #00f2fe, #ff0050);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .close-btn {
            background: #ff3b30;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }

        /* Tab chính */
        .main-tabs {
            display: flex;
            background: #16161d;
            border-bottom: 1px solid #2c2c35;
        }
        .main-tab-btn {
            flex: 1;
            padding: 9px;
            background: transparent;
            border: none;
            color: #8e8e98;
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }
        .main-tab-btn.active {
            color: #fff;
            border-bottom: 2px solid #00f2fe;
            background: #1f1f29;
        }

        .tab-panel {
            flex: 1;
            display: none;
            flex-direction: column;
            overflow: hidden;
        }
        .tab-panel.active {
            display: flex;
        }

        /* Tab 1: Full Code Web */
        .code-panel {
            padding: 10px;
            gap: 8px;
        }
        .code-actions {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        .action-btn {
            flex: 1;
            min-width: 85px;
            padding: 7px 8px;
            border: none;
            border-radius: 8px;
            font-size: 11.5px;
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

        /* Tab 2: Đa trang & Zoom */
        .sub-tabs-bar {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 8px;
            background: #16161d;
            border-bottom: 1px solid #2c2c35;
            overflow-x: auto;
        }
        .sub-tab-chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 9px;
            border-radius: 7px;
            background: #22222c;
            color: #b8b8c6;
            font-size: 11.5px;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid transparent;
            white-space: nowrap;
        }
        .sub-tab-chip.active {
            background: #2c2c3d;
            color: #fff;
            border-color: #00f2fe;
        }
        .sub-tab-close {
            background: transparent;
            border: none;
            color: #ff6b6b;
            font-weight: 700;
            cursor: pointer;
            font-size: 12px;
            line-height: 1;
            padding: 0 2px;
        }
        .add-sub-tab-btn {
            padding: 5px 10px;
            border-radius: 7px;
            border: 1px dashed #4a4a5c;
            background: transparent;
            color: #00f2fe;
            font-size: 11.5px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
        }

        .nav-bar {
            display: flex;
            gap: 5px;
            padding: 7px 8px;
            background: #1a1a22;
            border-bottom: 1px solid #2c2c35;
        }
        .nav-bar input {
            flex: 1;
            min-width: 0;
            background: #0d0d12;
            border: 1px solid #2c2c35;
            color: #fff;
            padding: 6px 8px;
            border-radius: 6px;
            font-size: 11.5px;
            outline: none;
        }
        .nav-btn {
            background: #ff0050;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 0 10px;
            font-size: 11.5px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
        }
        .nav-btn.secondary {
            background: #2b2b36;
        }

        /* Thanh chỉnh tỉ lệ phóng to/thu nhỏ */
        .zoom-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            padding: 6px 10px;
            background: #15151c;
            border-bottom: 1px solid #2c2c35;
            font-size: 11.5px;
            color: #d2d2de;
        }
        .zoom-controls {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .zoom-btn {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            border: 1px solid #353544;
            background: #242430;
            color: #fff;
            font-weight: 700;
            cursor: pointer;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .zoom-reset {
            padding: 3px 7px;
            border-radius: 6px;
            border: 1px solid #353544;
            background: #242430;
            color: #00f2fe;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
        }
        #zoom-range {
            width: 82px;
            accent-color: #00f2fe;
            cursor: pointer;
        }
        #zoom-label {
            min-width: 38px;
            text-align: right;
            font-weight: 700;
            color: #00f2fe;
        }

        /* Vùng chứa các khung web */
        .viewport-stage {
            flex: 1;
            position: relative;
            overflow: auto;
            background: #0b0b0f;
        }
        .frame-slot {
            display: none;
            width: 100%;
            height: 100%;
            position: relative;
        }
        .frame-slot.active {
            display: block;
        }
        .scale-box {
            width: 100%;
            height: 100%;
            transform-origin: 0 0;
        }
        .scale-box iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
            background: #111116;
        }

        .status-bar {
            font-size: 11px;
            color: #b4b4c4;
            padding: 5px 10px;
            background: #16161d;
            border-top: 1px solid #2c2c35;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `;
    shadow.appendChild(style);

    const container = document.createElement('div');
    container.innerHTML = `
        <div id="toggle-btn" title="Mở/Tắt Menu">UI</div>

        <div id="main-ui">
            <div class="header">
                <span class="title">WEB CODE & MULTI-VIEW</span>
                <button class="close-btn" id="close-ui-btn">Đóng UI</button>
            </div>

            <div class="main-tabs">
                <button class="main-tab-btn" data-panel="panel-code">Full Code Web</button>
                <button class="main-tab-btn active" data-panel="panel-browser">Đa Trang & Zoom</button>
            </div>

            <!-- PANEL 1: LẤY FULL CODE -->
            <div id="panel-code" class="tab-panel code-panel">
                <div class="code-actions">
                    <button class="action-btn primary" id="btn-refresh-code">Lấy lại Code</button>
                    <button class="action-btn success" id="btn-copy-code">Copy Code</button>
                    <button class="action-btn" id="btn-download-code">Tải .HTML</button>
                </div>
                <textarea id="code-viewer" readonly placeholder="Nhấn 'Lấy lại Code' để tải mã nguồn trang hiện tại..."></textarea>
            </div>

            <!-- PANEL 2: ĐA TRANG & ZOOM TRONG UI -->
            <div id="panel-browser" class="tab-panel active">
                <div class="sub-tabs-bar" id="sub-tabs-bar">
                    <button class="add-sub-tab-btn" id="btn-add-tab">+ Thêm Web</button>
                </div>

                <div class="nav-bar">
                    <input type="text" id="url-input" placeholder="Nhập link web (vd: https://gtraffic.io/9n7gQST)...">
                    <button class="nav-btn" id="btn-go">Mở</button>
                    <button class="nav-btn secondary" id="btn-reload">Tải lại</button>
                </div>

                <div class="zoom-bar">
                    <span>Tỉ lệ khung:</span>
                    <div class="zoom-controls">
                        <button class="zoom-btn" id="btn-zoom-out" title="Thu nhỏ">-</button>
                        <input type="range" id="zoom-range" min="50" max="150" step="5" value="100">
                        <button class="zoom-btn" id="btn-zoom-in" title="Phóng to">+</button>
                        <span id="zoom-label">100%</span>
                        <button class="zoom-reset" id="btn-zoom-reset">100%</button>
                    </div>
                </div>

                <div class="viewport-stage" id="viewport-stage"></div>
                <div class="status-bar" id="status-bar">Mặc định: ${DEFAULT_URL}</div>
            </div>
        </div>
    `;
    shadow.appendChild(container);

    const toggleBtn = shadow.getElementById('toggle-btn');
    const mainUI = shadow.getElementById('main-ui');
    const closeUiBtn = shadow.getElementById('close-ui-btn');
    const mainTabBtns = shadow.querySelectorAll('.main-tab-btn');
    const tabPanels = shadow.querySelectorAll('.tab-panel');

    const codeViewer = shadow.getElementById('code-viewer');
    const btnRefreshCode = shadow.getElementById('btn-refresh-code');
    const btnCopyCode = shadow.getElementById('btn-copy-code');
    const btnDownloadCode = shadow.getElementById('btn-download-code');

    const subTabsBar = shadow.getElementById('sub-tabs-bar');
    const btnAddTab = shadow.getElementById('btn-add-tab');
    const urlInput = shadow.getElementById('url-input');
    const btnGo = shadow.getElementById('btn-go');
    const btnReload = shadow.getElementById('btn-reload');
    const viewportStage = shadow.getElementById('viewport-stage');
    const statusBar = shadow.getElementById('status-bar');

    const btnZoomOut = shadow.getElementById('btn-zoom-out');
    const btnZoomIn = shadow.getElementById('btn-zoom-in');
    const zoomRange = shadow.getElementById('zoom-range');
    const zoomLabel = shadow.getElementById('zoom-label');
    const btnZoomReset = shadow.getElementById('btn-zoom-reset');

    // Quản lý danh sách khung web con (mỗi khung có url và zoom riêng)
    const tabs = [];
    let activeTabId = null;
    let tabCounter = 0;

    function normalizeUrl(raw) {
        const trimmed = (raw || '').trim();
        if (!trimmed) return DEFAULT_URL;
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.includes('.') && !trimmed.includes(' ')) {
            return 'https://' + trimmed;
        }
        return 'https://www.google.com/search?q=' + encodeURIComponent(trimmed);
    }

    function shortLabel(url, index) {
        try {
            const u = new URL(url);
            const pathPart = u.pathname && u.pathname !== '/' ? u.pathname.slice(0, 12) : '';
            return `Web ${index + 1}: ${u.hostname.replace(/^www\./, '')}${pathPart}`;
        } catch (_) {
            return `Web ${index + 1}`;
        }
    }

    function getActiveTab() {
        return tabs.find(t => t.id === activeTabId) || null;
    }

    function applyZoomToTab(tab, zoomPercent) {
        const clamped = Math.max(50, Math.min(150, Number(zoomPercent) || 100));
        tab.zoom = clamped;
        const scale = clamped / 100;
        tab.scaleBox.style.transform = `scale(${scale})`;
        tab.scaleBox.style.width = `${100 / scale}%`;
        tab.scaleBox.style.height = `${100 / scale}%`;

        if (tab.id === activeTabId) {
            zoomRange.value = clamped;
            zoomLabel.textContent = `${clamped}%`;
        }
    }

    function renderSubTabs() {
        subTabsBar.querySelectorAll('.sub-tab-chip').forEach(el => el.remove());

        tabs.forEach((tab, idx) => {
            const chip = document.createElement('div');
            chip.className = 'sub-tab-chip' + (tab.id === activeTabId ? ' active' : '');
            chip.title = tab.url;

            const labelSpan = document.createElement('span');
            labelSpan.textContent = shortLabel(tab.url, idx);
            labelSpan.addEventListener('click', () => switchSubTab(tab.id));
            chip.appendChild(labelSpan);

            if (tabs.length > 1) {
                const closeSpan = document.createElement('button');
                closeSpan.className = 'sub-tab-close';
                closeSpan.textContent = '×';
                closeSpan.title = 'Đóng khung này';
                closeSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeSubTab(tab.id);
                });
                chip.appendChild(closeSpan);
            }

            subTabsBar.insertBefore(chip, btnAddTab);
        });
    }

    function switchSubTab(id) {
        activeTabId = id;
        tabs.forEach(t => {
            t.slot.classList.toggle('active', t.id === id);
        });
        const current = getActiveTab();
        if (current) {
            urlInput.value = current.url;
            zoomRange.value = current.zoom;
            zoomLabel.textContent = `${current.zoom}%`;
            statusBar.textContent = `Đang xem: ${current.url} (${current.zoom}%)`;
        }
        renderSubTabs();
    }

    function createSubTab(initialUrl = DEFAULT_URL, makeActive = true) {
        const id = 'webtab_' + (++tabCounter);
        const url = normalizeUrl(initialUrl);

        const slot = document.createElement('div');
        slot.className = 'frame-slot';

        const scaleBox = document.createElement('div');
        scaleBox.className = 'scale-box';

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');

        iframe.addEventListener('load', () => {
            if (activeTabId === id) {
                statusBar.textContent = `Đã tải khung: ${url} — Nếu bị đen/trắng là trang gốc chặn nhúng iframe.`;
            }
        });

        scaleBox.appendChild(iframe);
        slot.appendChild(scaleBox);
        viewportStage.appendChild(slot);

        const tabObj = { id, url, zoom: 100, slot, scaleBox, iframe };
        tabs.push(tabObj);
        applyZoomToTab(tabObj, 100);

        if (makeActive) {
            switchSubTab(id);
        } else {
            renderSubTabs();
        }
        return tabObj;
    }

    function closeSubTab(id) {
        if (tabs.length <= 1) return;
        const idx = tabs.findIndex(t => t.id === id);
        if (idx === -1) return;

        const [removed] = tabs.splice(idx, 1);
        removed.slot.remove();

        if (activeTabId === id) {
            const next = tabs[Math.max(0, idx - 1)];
            switchSubTab(next.id);
        } else {
            renderSubTabs();
        }
    }

    function navigateActiveTab(rawUrl) {
        const current = getActiveTab();
        if (!current) return;
        const url = normalizeUrl(rawUrl);
        current.url = url;
        urlInput.value = url;
        statusBar.textContent = `Đang tải: ${url}...`;
        current.iframe.src = url;
        renderSubTabs();
    }

    // Khởi tạo sẵn 1 khung mặc định trỏ tới https://gtraffic.io/9n7gQST
    createSubTab(DEFAULT_URL, true);

    // Sự kiện tạo thêm web mới trong UI
    btnAddTab.addEventListener('click', () => {
        createSubTab('https://example.com', true);
        urlInput.focus();
        urlInput.select();
    });

    btnGo.addEventListener('click', () => navigateActiveTab(urlInput.value));
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navigateActiveTab(urlInput.value);
    });

    btnReload.addEventListener('click', () => {
        const current = getActiveTab();
        if (!current) return;
        statusBar.textContent = `Đang tải lại: ${current.url}...`;
        current.iframe.src = current.url;
    });

    // Điều chỉnh phóng to / thu nhỏ
    zoomRange.addEventListener('input', () => {
        const current = getActiveTab();
        if (current) {
            applyZoomToTab(current, zoomRange.value);
            statusBar.textContent = `Tỉ lệ khung hiện tại: ${current.zoom}%`;
        }
    });

    btnZoomIn.addEventListener('click', () => {
        const current = getActiveTab();
        if (current) {
            applyZoomToTab(current, current.zoom + 10);
            statusBar.textContent = `Tỉ lệ khung hiện tại: ${current.zoom}%`;
        }
    });

    btnZoomOut.addEventListener('click', () => {
        const current = getActiveTab();
        if (current) {
            applyZoomToTab(current, current.zoom - 10);
            statusBar.textContent = `Tỉ lệ khung hiện tại: ${current.zoom}%`;
        }
    });

    btnZoomReset.addEventListener('click', () => {
        const current = getActiveTab();
        if (current) {
            applyZoomToTab(current, 100);
            statusBar.textContent = `Tỉ lệ khung hiện tại: 100%`;
        }
    });

    // Lấy Full Code Web
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

    closeUiBtn.addEventListener('click', () => {
        mainUI.classList.remove('open');
        toggleBtn.textContent = 'UI';
    });

    mainTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            mainTabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-panel');
            shadow.getElementById(targetId).classList.add('active');
            if (targetId === 'panel-code' && !codeViewer.value) {
                extractFullCode();
            }
        });
    });

    btnRefreshCode.addEventListener('click', () => {
        extractFullCode();
        btnRefreshCode.textContent = 'Đã cập nhật!';
        setTimeout(() => (btnRefreshCode.textContent = 'Lấy lại Code'), 1200);
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
        setTimeout(() => (btnCopyCode.textContent = 'Copy Code'), 1500);
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

    // Kéo thả nút nổi UI
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
            const newLeft = Math.max(5, Math.min(window.innerWidth - 53, initialLeft + dx));
            const newTop = Math.max(5, Math.min(window.innerHeight - 53, initialTop + dy));
            toggleBtn.style.left = newLeft + 'px';
            toggleBtn.style.top = newTop + 'px';
            toggleBtn.style.right = 'auto';
            toggleBtn.style.bottom = 'auto';
        }
    }

    function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        if (!hasMoved) toggleUI();
    }

    toggleBtn.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    toggleBtn.addEventListener('touchstart', onDragStart, { passive: false });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
})();
