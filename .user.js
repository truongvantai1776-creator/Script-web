// ==UserScript==
// @name         Universal UI - Separate Buttons & Parallel Mini Browser (Safari)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Tách riêng từng nút chức năng và thêm trình duyệt con chạy song song trong UI
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
            .toggle-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 54px;
                height: 54px;
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
                transition: transform 0.15s ease, background 0.15s ease;
                user-select: none;
                touch-action: none;
            }
            .toggle-btn:hover {
                background: #27272a;
                transform: scale(1.05);
            }
            .main-ui {
                position: fixed;
                bottom: 84px;
                right: 20px;
                width: 375px;
                max-width: calc(100vw - 32px);
                max-height: calc(100vh - 108px);
                background: #111114;
                color: #f4f4f5;
                border: 1px solid rgba(255, 255, 255, 0.12);
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
                padding: 11px 14px;
                background: #18181c;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .ui-title {
                font-size: 14px;
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
                gap: 10px;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            .btn-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            .ui-btn {
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
            .ui-btn.active-mode {
                background: #2563eb;
                border-color: #60a5fa;
            }
            .ui-btn.browser-btn {
                grid-column: 1 / -1;
                background: #0f766e;
                border-color: #2dd4bf;
                color: #f0fdfa;
            }
            .ui-btn.browser-btn:hover {
                background: #115e59;
            }
            .panel {
                display: none;
                flex-direction: column;
                gap: 8px;
                padding: 10px;
                background: #0b0b0d;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
            }
            .panel.show {
                display: flex;
            }
            .section-label {
                font-size: 11px;
                font-weight: 700;
                color: #a1a1aa;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }
            .gallery {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
                max-height: 130px;
                overflow-y: auto;
            }
            .thumb-item {
                aspect-ratio: 1 / 1;
                border-radius: 6px;
                overflow: hidden;
                border: 2px solid transparent;
                background: #18181c;
                cursor: pointer;
                padding: 0;
            }
            .thumb-item.active {
                border-color: #3b82f6;
            }
            .thumb-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .preview-canvas {
                max-width: 100%;
                max-height: 140px;
                border-radius: 6px;
                background: #18181c;
                align-self: center;
            }
            .url-bar {
                display: flex;
                gap: 6px;
            }
            .url-input {
                flex: 1;
                min-width: 0;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.16);
                background: #18181c;
                color: #f4f4f5;
                font-size: 12px;
                padding: 7px 9px;
                outline: none;
            }
            .go-btn {
                padding: 7px 11px;
                border-radius: 8px;
                border: 1px solid #2dd4bf;
                background: #0f766e;
                color: #ffffff;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
            }
            .mini-frame {
                width: 100%;
                height: 260px;
                border: 1px solid rgba(255, 255, 255, 0.14);
                border-radius: 8px;
                background: #ffffff;
            }
            .data-box {
                width: 100%;
                min-height: 105px;
                max-height: 170px;
                box-sizing: border-box;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: #09090b;
                color: #86efac;
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11px;
                line-height: 1.35;
                padding: 8px 10px;
                resize: vertical;
                outline: none;
            }
            .threshold-row {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #d4d4d8;
            }
            input[type="range"] {
                width: 100%;
                accent-color: #3b82f6;
            }
            .status-msg {
                font-size: 11px;
                color: #93c5fd;
                min-height: 15px;
            }
        </style>

        <button class="toggle-btn" id="toggleBtn" title="Mở/Đóng UI">UI</button>

        <div class="main-ui" id="mainUi">
            <div class="ui-header">
                <span class="ui-title">Bảng Nút & Trình Duyệt Song Song</span>
                <button class="ui-close" id="closeBtn">&times;</button>
            </div>
            <div class="ui-body">
                <div class="btn-grid">
                    <button class="ui-btn" id="btnGetImages">1. Lấy ảnh</button>
                    <button class="ui-btn" id="btnGray">2. Trắng đen (Xám)</button>
                    <button class="ui-btn" id="btnBW">3. Đen & Trắng</button>
                    <button class="ui-btn" id="btnBits">4. Xuất chuỗi Bit</button>
                    <button class="ui-btn browser-btn" id="btnMiniBrowser">5. Trình duyệt trong trình duyệt (Chạy song song)</button>
                </div>

                <!-- Khu vực ảnh & phân tích -->
                <div class="panel" id="imagePanel">
                    <div class="section-label">Chọn 1 ảnh trên trang</div>
                    <div class="gallery" id="gallery"></div>
                    <canvas class="preview-canvas" id="previewCanvas"></canvas>
                    <div class="threshold-row">
                        <span>Ngưỡng đen/trắng</span>
                        <span id="thresholdVal">128</span>
                    </div>
                    <input type="range" id="thresholdSlider" min="0" max="255" value="128" />
                </div>

                <!-- Khu vực trình duyệt con chạy song song -->
                <div class="panel" id="browserPanel">
                    <div class="section-label">Trình duyệt song song (Safari)</div>
                    <div class="url-bar">
                        <input class="url-input" type="url" id="subUrlInput" value="https://example.com" placeholder="Nhập địa chỉ web (https://...)" />
                        <button class="go-btn" id="subGoBtn">Mở</button>
                    </div>
                    <iframe class="mini-frame" id="subBrowserFrame" src="https://example.com" referrerpolicy="no-referrer"></iframe>
                </div>

                <!-- Khu vực hiển thị kết quả bit/thông tin -->
                <div class="panel show" id="resultPanel">
                    <div class="section-label">Kết quả / Chuỗi Bit</div>
                    <textarea class="data-box" id="resultBox" placeholder="Bấm các nút phía trên để sử dụng..."></textarea>
                </div>

                <div class="status-msg" id="statusMsg">Sẵn sàng trên Safari.</div>
            </div>
        </div>
    `;

    const toggleBtn = shadow.getElementById('toggleBtn');
    const mainUi = shadow.getElementById('mainUi');
    const closeBtn = shadow.getElementById('closeBtn');

    const btnGetImages = shadow.getElementById('btnGetImages');
    const btnGray = shadow.getElementById('btnGray');
    const btnBW = shadow.getElementById('btnBW');
    const btnBits = shadow.getElementById('btnBits');
    const btnMiniBrowser = shadow.getElementById('btnMiniBrowser');

    const imagePanel = shadow.getElementById('imagePanel');
    const browserPanel = shadow.getElementById('browserPanel');
    const gallery = shadow.getElementById('gallery');
    const previewCanvas = shadow.getElementById('previewCanvas');
    const thresholdSlider = shadow.getElementById('thresholdSlider');
    const thresholdVal = shadow.getElementById('thresholdVal');

    const subUrlInput = shadow.getElementById('subUrlInput');
    const subGoBtn = shadow.getElementById('subGoBtn');
    const subBrowserFrame = shadow.getElementById('subBrowserFrame');

    const resultBox = shadow.getElementById('resultBox');
    const statusMsg = shadow.getElementById('statusMsg');

    const ctx = previewCanvas.getContext('2d', { willReadFrequently: true });
    let currentImgEl = null;
    let currentFilterMode = null;

    function setActiveButton(activeBtn) {
        [btnGetImages, btnGray, btnBW, btnBits, btnMiniBrowser].forEach((b) => {
            b.classList.toggle('active-mode', b === activeBtn);
        });
    }

    let isOpen = false;
    function setOpen(state) {
        isOpen = state;
        mainUi.classList.toggle('open', isOpen);
    }

    closeBtn.addEventListener('click', () => setOpen(false));

    // Kéo thả nút mở UI + bấm để mở/đóng
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let origRight = 20;
    let origBottom = 20;

    toggleBtn.addEventListener('pointerdown', (e) => {
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        origRight = parseInt(toggleBtn.style.right || '20', 10);
        origBottom = parseInt(toggleBtn.style.bottom || '20', 10);
        toggleBtn.setPointerCapture(e.pointerId);
    });

    toggleBtn.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
        if (!moved) return;

        const nextRight = Math.max(8, Math.min(window.innerWidth - 60, origRight - dx));
        const nextBottom = Math.max(8, Math.min(window.innerHeight - 60, origBottom - dy));
        toggleBtn.style.right = nextRight + 'px';
        toggleBtn.style.bottom = nextBottom + 'px';
    });

    toggleBtn.addEventListener('pointerup', () => {
        if (!dragging) return;
        dragging = false;
        if (!moved) {
            setOpen(!isOpen);
        }
    });

    async function drawSourceToCanvas(imgEl) {
        const draw = (srcImg) => {
            const w = srcImg.naturalWidth || srcImg.width;
            const h = srcImg.naturalHeight || srcImg.height;
            if (!w || !h) throw new Error('Ảnh chưa tải xong.');

            const maxSide = 320;
            const scale = Math.min(1, maxSide / Math.max(w, h));
            previewCanvas.width = Math.max(1, Math.round(w * scale));
            previewCanvas.height = Math.max(1, Math.round(h * scale));
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            ctx.drawImage(srcImg, 0, 0, previewCanvas.width, previewCanvas.height);
            ctx.getImageData(0, 0, 1, 1);
        };

        try {
            draw(imgEl);
            return true;
        } catch (_) {
            const srcUrl = imgEl.currentSrc || imgEl.src;
            if (!srcUrl) return false;
            try {
                const corsImg = new Image();
                corsImg.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    corsImg.onload = resolve;
                    corsImg.onerror = reject;
                    corsImg.src = srcUrl;
                });
                draw(corsImg);
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    // Nút 1: Lấy tất cả ảnh
    btnGetImages.addEventListener('click', () => {
        setActiveButton(btnGetImages);
        imagePanel.classList.add('show');
        gallery.innerHTML = '';

        const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
            if (root.contains(img)) return false;
            return Boolean(img.currentSrc || img.src);
        });

        if (!imgs.length) {
            statusMsg.textContent = 'Không tìm thấy ảnh nào trên trang này.';
            return;
        }

        imgs.forEach((img, idx) => {
            const btn = document.createElement('button');
            btn.className = 'thumb-item';
            const thumb = document.createElement('img');
            thumb.src = img.currentSrc || img.src;
            thumb.alt = `Ảnh ${idx + 1}`;
            btn.appendChild(thumb);

            btn.addEventListener('click', async () => {
                gallery.querySelectorAll('.thumb-item').forEach((el) => el.classList.remove('active'));
                btn.classList.add('active');
                currentImgEl = img;
                currentFilterMode = null;
                const ok = await drawSourceToCanvas(img);
                statusMsg.textContent = ok
                    ? `Đã chọn Ảnh #${idx + 1}. Bấm nút Trắng đen, Đen & Trắng hoặc Xuất chuỗi Bit.`
                    : `Ảnh #${idx + 1} bị chặn CORS, hãy thử ảnh khác.`;
            });

            gallery.appendChild(btn);
        });

        statusMsg.textContent = `Đã lấy ${imgs.length} ảnh. Chạm vào 1 ảnh để chọn.`;
    });

    async function runGrayOrBW(mode) {
        if (!currentImgEl) {
            imagePanel.classList.add('show');
            statusMsg.textContent = 'Hãy bấm "1. Lấy ảnh" và chạm vào 1 ảnh trước.';
            return;
        }

        const ok = await drawSourceToCanvas(currentImgEl);
        if (!ok) {
            statusMsg.textContent = 'Không đọc được pixel ảnh này (chặn CORS).';
            return;
        }

        currentFilterMode = mode;
        const threshold = Number(thresholdSlider.value || 128);
        const imgData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const d = imgData.data;

        let lightCount = 0;
        let darkCount = 0;

        for (let i = 0; i < d.length; i += 4) {
            const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
            if (mode === 'gray') {
                d[i] = lum;
                d[i + 1] = lum;
                d[i + 2] = lum;
                if (lum >= threshold) lightCount++;
                else darkCount++;
            } else {
                const v = lum >= threshold ? 255 : 0;
                d[i] = v;
                d[i + 1] = v;
                d[i + 2] = v;
                if (v === 255) lightCount++;
                else darkCount++;
            }
        }

        ctx.putImageData(imgData, 0, 0);
        const total = lightCount + darkCount;
        resultBox.value =
            `Chế độ: ${mode === 'gray' ? 'Trắng đen (Xám)' : 'Đen & Trắng'}\n` +
            `Ngưỡng: ${threshold}\n` +
            `Sáng/Trắng: ${lightCount} (${((lightCount / total) * 100).toFixed(1)}%)\n` +
            `Tối/Đen: ${darkCount} (${((darkCount / total) * 100).toFixed(1)}%)`;
        statusMsg.textContent = `Đã xử lý ${mode === 'gray' ? 'trắng đen (xám)' : 'đen & trắng'}.`;
    }

    // Nút 2: Trắng đen (Xám)
    btnGray.addEventListener('click', () => {
        setActiveButton(btnGray);
        imagePanel.classList.add('show');
        runGrayOrBW('gray');
    });

    // Nút 3: Đen & Trắng
    btnBW.addEventListener('click', () => {
        setActiveButton(btnBW);
        imagePanel.classList.add('show');
        runGrayOrBW('bw');
    });

    thresholdSlider.addEventListener('input', () => {
        thresholdVal.textContent = thresholdSlider.value;
        if (currentFilterMode) {
            runGrayOrBW(currentFilterMode);
        }
    });

    // Nút 4: Xuất chuỗi Bit
    btnBits.addEventListener('click', async () => {
        setActiveButton(btnBits);
        if (!currentImgEl) {
            imagePanel.classList.add('show');
            statusMsg.textContent = 'Hãy bấm "1. Lấy ảnh" và chạm vào 1 ảnh trước.';
            return;
        }

        const ok = await drawSourceToCanvas(currentImgEl);
        if (!ok) {
            statusMsg.textContent = 'Không đọc được pixel ảnh này (chặn CORS).';
            return;
        }

        const threshold = Number(thresholdSlider.value || 128);
        const imgData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const d = imgData.data;

        const cols = Math.min(96, previewCanvas.width);
        const rows = Math.max(1, Math.round((previewCanvas.height / previewCanvas.width) * cols * 0.55));
        const stepX = previewCanvas.width / cols;
        const stepY = previewCanvas.height / rows;

        const lines = [];
        for (let r = 0; r < rows; r++) {
            const py = Math.min(previewCanvas.height - 1, Math.floor(r * stepY));
            let row = '';
            for (let c = 0; c < cols; c++) {
                const px = Math.min(previewCanvas.width - 1, Math.floor(c * stepX));
                const idx = (py * previewCanvas.width + px) * 4;
                const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
                row += lum >= threshold ? '1' : '0';
            }
            lines.push(row);
        }

        resultBox.value = lines.join('\n');
        statusMsg.textContent = `Đã xuất chuỗi bit (${cols}x${rows}).`;
    });

    // Nút 5: Bật/tắt trình duyệt con chạy song song trong UI
    btnMiniBrowser.addEventListener('click', () => {
        const willShow = !browserPanel.classList.contains('show');
        browserPanel.classList.toggle('show', willShow);
        btnMiniBrowser.classList.toggle('active-mode', willShow);
        statusMsg.textContent = willShow
            ? 'Đã mở trình duyệt con chạy song song với trang Safari chính.'
            : 'Đã thu gọn trình duyệt con.';
    });

    function navigateMiniBrowser() {
        let raw = subUrlInput.value.trim();
        if (!raw) return;
        if (!/^https?:\/\//i.test(raw)) {
            raw = 'https://' + raw;
        }
        subUrlInput.value = raw;
        subBrowserFrame.src = raw;
        statusMsg.textContent = 'Đang tải trang trong trình duyệt con: ' + raw;
    }

    subGoBtn.addEventListener('click', navigateMiniBrowser);
    subUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navigateMiniBrowser();
    });
})();
