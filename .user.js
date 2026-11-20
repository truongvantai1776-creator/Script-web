// ==UserScript==
// @name         Universal UI - All Images & Bit/BW Analyzer (No API)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Lấy toàn bộ ảnh trên trang vào UI, chọn 1 ảnh và phân tích trắng đen / bit không cần API
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
                width: 52px;
                height: 52px;
                border-radius: 50%;
                border: none;
                background: #18181b;
                color: #ffffff;
                font-size: 13px;
                font-weight: 700;
                font-family: system-ui, -apple-system, sans-serif;
                cursor: pointer;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
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
                width: 370px;
                max-width: calc(100vw - 32px);
                max-height: calc(100vh - 110px);
                background: #111114;
                color: #f4f4f5;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 14px;
                box-shadow: 0 14px 36px rgba(0, 0, 0, 0.5);
                font-family: system-ui, -apple-system, sans-serif;
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
                padding: 12px 14px;
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
                font-size: 18px;
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
            }
            .row {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .ui-btn {
                flex: 1;
                padding: 8px 10px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.14);
                background: #27272a;
                color: #ffffff;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
            }
            .ui-btn:hover {
                background: #3f3f46;
            }
            .ui-btn.primary {
                background: #2563eb;
                border-color: #3b82f6;
            }
            .ui-btn.primary:hover {
                background: #1d4ed8;
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
                max-height: 145px;
                overflow-y: auto;
                padding: 6px;
                background: #0b0b0d;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
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
            .thumb-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .thumb-item.active {
                border-color: #3b82f6;
            }
            .preview-wrap {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                padding: 8px;
                background: #0b0b0d;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
            }
            .preview-canvas {
                max-width: 100%;
                max-height: 150px;
                border-radius: 6px;
                background: #18181c;
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
            .bit-box {
                width: 100%;
                min-height: 95px;
                max-height: 150px;
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
            .status-msg {
                font-size: 11px;
                color: #93c5fd;
                min-height: 15px;
            }
        </style>

        <button class="toggle-btn" id="toggleBtn" title="Mở/Đóng UI">UI</button>

        <div class="main-ui" id="mainUi">
            <div class="ui-header">
                <span class="ui-title">Ảnh & Phân Tích Trắng Đen / Bit</span>
                <button class="ui-close" id="closeBtn">&times;</button>
            </div>
            <div class="ui-body">
                <button class="ui-btn primary" id="loadAllBtn">Lấy tất cả ảnh trên trang</button>

                <div class="section-label">Danh sách ảnh (bấm để chọn 1 ảnh)</div>
                <div class="gallery" id="gallery"></div>

                <div class="preview-wrap">
                    <canvas class="preview-canvas" id="previewCanvas"></canvas>
                </div>

                <div class="threshold-row">
                    <span>Ngưỡng trắng/đen (0 - 255)</span>
                    <span id="thresholdVal">128</span>
                </div>
                <input type="range" id="thresholdSlider" min="0" max="255" value="128" />

                <div class="row">
                    <button class="ui-btn" id="grayBtn">Trắng đen (Xám)</button>
                    <button class="ui-btn" id="bwBtn">Đen & Trắng (1-bit)</button>
                    <button class="ui-btn primary" id="bitStreamBtn">Xuất chuỗi Bit</button>
                </div>

                <div class="section-label">Dữ liệu phân tích / Chuỗi Bit (0 & 1)</div>
                <textarea class="bit-box" id="bitBox" placeholder="Chọn 1 ảnh rồi bấm Trắng đen, Đen & Trắng hoặc Xuất chuỗi Bit..."></textarea>

                <div class="status-msg" id="statusMsg">Sẵn sàng (không cần API).</div>
            </div>
        </div>
    `;

    const toggleBtn = shadow.getElementById('toggleBtn');
    const mainUi = shadow.getElementById('mainUi');
    const closeBtn = shadow.getElementById('closeBtn');
    const loadAllBtn = shadow.getElementById('loadAllBtn');
    const gallery = shadow.getElementById('gallery');
    const previewCanvas = shadow.getElementById('previewCanvas');
    const thresholdSlider = shadow.getElementById('thresholdSlider');
    const thresholdVal = shadow.getElementById('thresholdVal');
    const grayBtn = shadow.getElementById('grayBtn');
    const bwBtn = shadow.getElementById('bwBtn');
    const bitStreamBtn = shadow.getElementById('bitStreamBtn');
    const bitBox = shadow.getElementById('bitBox');
    const statusMsg = shadow.getElementById('statusMsg');

    const ctx = previewCanvas.getContext('2d', { willReadFrequently: true });
    let currentImgEl = null;
    let currentMode = 'original';

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

    thresholdSlider.addEventListener('input', () => {
        thresholdVal.textContent = thresholdSlider.value;
        if (currentImgEl && currentMode !== 'original') {
            applyFilter(currentMode);
        }
    });

    // Lấy toàn bộ ảnh trên trang đưa vào gallery
    function collectAllImages() {
        gallery.innerHTML = '';
        const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
            if (root.contains(img)) return false;
            const src = img.currentSrc || img.src || '';
            return Boolean(src);
        });

        if (!imgs.length) {
            statusMsg.textContent = 'Không tìm thấy thẻ ảnh nào trên trang này.';
            return;
        }

        imgs.forEach((img, idx) => {
            const btn = document.createElement('button');
            btn.className = 'thumb-item';
            btn.title = `Ảnh #${idx + 1}`;

            const thumb = document.createElement('img');
            thumb.src = img.currentSrc || img.src;
            thumb.alt = `Ảnh ${idx + 1}`;

            btn.appendChild(thumb);
            btn.addEventListener('click', () => {
                gallery.querySelectorAll('.thumb-item').forEach((el) => el.classList.remove('active'));
                btn.classList.add('active');
                selectImage(img, idx + 1);
            });

            gallery.appendChild(btn);
        });

        statusMsg.textContent = `Đã đưa ${imgs.length} ảnh vào UI. Chạm vào 1 ảnh để phân tích.`;
    }

    // Vẽ ảnh được chọn lên canvas (có thử crossOrigin nếu bị chặn)
    async function drawSourceToCanvas(imgEl) {
        const draw = (srcImg) => {
            const w = srcImg.naturalWidth || srcImg.width;
            const h = srcImg.naturalHeight || srcImg.height;
            if (!w || !h) throw new Error('Ảnh chưa tải xong hoặc kích thước 0.');

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

    async function selectImage(imgEl, indexNum) {
        currentImgEl = imgEl;
        currentMode = 'original';
        const ok = await drawSourceToCanvas(imgEl);
        if (ok) {
            statusMsg.textContent = `Đã chọn Ảnh #${indexNum} (${previewCanvas.width}x${previewCanvas.height}px).`;
        } else {
            statusMsg.textContent = `Ảnh #${indexNum} bị chặn CORS nên không đọc pixel được.`;
        }
    }

    // Áp dụng kiểu phân tích: 'gray' (trắng đen xám) hoặc 'bw' (đen & trắng 1-bit)
    async function applyFilter(mode) {
        if (!currentImgEl) {
            statusMsg.textContent = 'Hãy chọn 1 ảnh trong danh sách trước.';
            return;
        }

        const ok = await drawSourceToCanvas(currentImgEl);
        if (!ok) {
            statusMsg.textContent = 'Không đọc được pixel của ảnh này (chặn CORS).';
            return;
        }

        currentMode = mode;
        const threshold = Number(thresholdSlider.value || 128);
        const imgData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const data = imgData.data;

        let whitePixels = 0;
        let blackPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
            const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            if (mode === 'gray') {
                data[i] = lum;
                data[i + 1] = lum;
                data[i + 2] = lum;
                if (lum >= threshold) whitePixels++;
                else blackPixels++;
            } else if (mode === 'bw') {
                const val = lum >= threshold ? 255 : 0;
                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
                if (val === 255) whitePixels++;
                else blackPixels++;
            }
        }

        ctx.putImageData(imgData, 0, 0);
        const total = whitePixels + blackPixels;
        const pctWhite = total ? ((whitePixels / total) * 100).toFixed(1) : '0.0';
        const pctBlack = total ? ((blackPixels / total) * 100).toFixed(1) : '0.0';

        bitBox.value =
            `Chế độ: ${mode === 'gray' ? 'Trắng đen (Grayscale)' : 'Đen & Trắng (1-bit)'}\n` +
            `Kích thước phân tích: ${previewCanvas.width} x ${previewCanvas.height}\n` +
            `Ngưỡng: ${threshold}\n` +
            `Pixel sáng/trắng: ${whitePixels} (${pctWhite}%)\n` +
            `Pixel tối/đen: ${blackPixels} (${pctBlack}%)`;

        statusMsg.textContent = `Đã chuyển sang ${mode === 'gray' ? 'trắng đen (xám)' : 'đen & trắng'}.`;
    }

    // Xuất chuỗi bit 0 / 1 từ ảnh đang chọn
    async function exportBitStream() {
        if (!currentImgEl) {
            statusMsg.textContent = 'Hãy chọn 1 ảnh trong danh sách trước.';
            return;
        }

        const ok = await drawSourceToCanvas(currentImgEl);
        if (!ok) {
            statusMsg.textContent = 'Không đọc được pixel của ảnh này (chặn CORS).';
            return;
        }

        currentMode = 'bw';
        const threshold = Number(thresholdSlider.value || 128);
        const imgData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const data = imgData.data;

        // Thu gọn lưới bit tối đa 96 cột để xem và copy dễ trên điện thoại
        const targetCols = Math.min(96, previewCanvas.width);
        const stepX = previewCanvas.width / targetCols;
        const targetRows = Math.max(1, Math.round((previewCanvas.height / previewCanvas.width) * targetCols * 0.55));
        const stepY = previewCanvas.height / targetRows;

        const lines = [];
        for (let r = 0; r < targetRows; r++) {
            const py = Math.min(previewCanvas.height - 1, Math.floor(r * stepY));
            let rowBits = '';
            for (let c = 0; c < targetCols; c++) {
                const px = Math.min(previewCanvas.width - 1, Math.floor(c * stepX));
                const idx = (py * previewCanvas.width + px) * 4;
                const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                rowBits += lum >= threshold ? '1' : '0';
            }
            lines.push(rowBits);
        }

        const bitText = lines.join('\n');
        bitBox.value = bitText;
        statusMsg.textContent = `Đã xuất lưới bit (${targetCols}x${targetRows}, 1=sáng, 0=tối).`;
    }

    loadAllBtn.addEventListener('click', collectAllImages);
    grayBtn.addEventListener('click', () => applyFilter('gray'));
    bwBtn.addEventListener('click', () => applyFilter('bw'));
    bitStreamBtn.addEventListener('click', exportBitStream);
})();
