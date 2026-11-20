// ==UserScript==
// @name         Universal UI - Read Text, Image & Explain
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Đọc text trang web, phân tích ảnh và giải thích ngay trên UI nổi
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById('custom-ui-root')) return;

    const STORAGE_KEY = 'tm_gemini_api_key_v1';

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
                width: 350px;
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
            }
            .input, .textarea {
                width: 100%;
                box-sizing: border-box;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.14);
                background: #18181c;
                color: #f4f4f5;
                font-size: 12px;
                font-family: system-ui, -apple-system, sans-serif;
                padding: 8px 10px;
                outline: none;
            }
            .textarea {
                min-height: 78px;
                resize: vertical;
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
            .output-box {
                background: #0b0b0d;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 10px;
                font-size: 12px;
                line-height: 1.5;
                color: #e4e4e7;
                white-space: pre-wrap;
                max-height: 220px;
                overflow-y: auto;
            }
            .status-msg {
                font-size: 11px;
                color: #93c5fd;
                min-height: 15px;
            }
            .img-preview {
                max-width: 100%;
                max-height: 120px;
                border-radius: 8px;
                object-fit: contain;
                background: #18181c;
                display: none;
            }
            .img-preview.show {
                display: block;
            }
        </style>

        <button class="toggle-btn" id="toggleBtn" title="Mở/Đóng UI">UI</button>

        <div class="main-ui" id="mainUi">
            <div class="ui-header">
                <span class="ui-title">Đọc & Giải Thích</span>
                <button class="ui-close" id="closeBtn">&times;</button>
            </div>
            <div class="ui-body">
                <input class="input" type="password" id="apiKeyInput" placeholder="Dán Gemini API Key tại đây..." />

                <div class="row">
                    <button class="ui-btn" id="readTextBtn">Đọc text trang</button>
                    <button class="ui-btn" id="pickImgBtn">Chọn ảnh trên web</button>
                </div>

                <img class="img-preview" id="imgPreview" alt="Ảnh đã chọn" />

                <textarea class="textarea" id="promptInput" placeholder="Nội dung text hoặc câu hỏi cần giải thích..."></textarea>

                <button class="ui-btn primary" id="explainBtn">Phân tích & Giải thích</button>

                <div class="status-msg" id="statusMsg">Sẵn sàng.</div>
                <div class="output-box" id="outputBox">Kết quả giải thích sẽ hiển thị ở đây.</div>
            </div>
        </div>
    `;

    const toggleBtn = shadow.getElementById('toggleBtn');
    const mainUi = shadow.getElementById('mainUi');
    const closeBtn = shadow.getElementById('closeBtn');
    const apiKeyInput = shadow.getElementById('apiKeyInput');
    const readTextBtn = shadow.getElementById('readTextBtn');
    const pickImgBtn = shadow.getElementById('pickImgBtn');
    const imgPreview = shadow.getElementById('imgPreview');
    const promptInput = shadow.getElementById('promptInput');
    const explainBtn = shadow.getElementById('explainBtn');
    const statusMsg = shadow.getElementById('statusMsg');
    const outputBox = shadow.getElementById('outputBox');

    let selectedImageBase64 = null;
    let selectedImageMime = null;
    let pickingImage = false;

    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) apiKeyInput.value = savedKey;

    apiKeyInput.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEY, apiKeyInput.value.trim());
    });

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

    // 1. Đọc text đang bôi đen hoặc text chính trên trang
    readTextBtn.addEventListener('click', () => {
        const selected = window.getSelection ? window.getSelection().toString().trim() : '';
        const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
        const extracted = selected || bodyText.slice(0, 2500);

        if (!extracted) {
            statusMsg.textContent = 'Không tìm thấy text nào trên trang.';
            return;
        }

        promptInput.value = extracted;
        statusMsg.textContent = selected
            ? `Đã lấy ${extracted.length} ký tự text bôi đen.`
            : `Đã đọc ${extracted.length} ký tự text từ trang.`;
    });

    // 2. Chế độ bấm chọn 1 ảnh trên trang web
    pickImgBtn.addEventListener('click', () => {
        pickingImage = true;
        setOpen(false);
        statusMsg.textContent = 'Hãy chạm vào một bức ảnh trên trang web...';
    });

    function imgElementToBase64(imgEl) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const w = imgEl.naturalWidth || imgEl.width;
                const h = imgEl.naturalHeight || imgEl.height;
                if (!w || !h) return reject(new Error('Ảnh chưa tải xong hoặc không có kích thước.'));

                const maxSide = 1280;
                const scale = Math.min(1, maxSide / Math.max(w, h));
                canvas.width = Math.round(w * scale);
                canvas.height = Math.round(h * scale);

                const ctx = canvas.getContext('2d');
                ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                const base64 = dataUrl.split(',')[1];
                resolve({ base64, mimeType: 'image/jpeg', previewUrl: dataUrl });
            } catch (err) {
                reject(new Error('Ảnh bị chặn CORS nên không đọc trực tiếp được.'));
            }
        });
    }

    document.addEventListener(
        'click',
        async (e) => {
            if (!pickingImage) return;
            const targetImg = e.target && e.target.closest ? e.target.closest('img') : null;
            if (!targetImg) return;

            e.preventDefault();
            e.stopPropagation();
            pickingImage = false;
            setOpen(true);
            statusMsg.textContent = 'Đang xử lý ảnh...';

            try {
                const converted = await imgElementToBase64(targetImg);
                selectedImageBase64 = converted.base64;
                selectedImageMime = converted.mimeType;
                imgPreview.src = converted.previewUrl;
                imgPreview.classList.add('show');
                statusMsg.textContent = 'Đã chọn ảnh thành công. Nhấn "Phân tích & Giải thích".';
            } catch (err) {
                statusMsg.textContent = err.message;
            }
        },
        true
    );

    // 3. Gọi Gemini API để đọc text, phân tích ảnh và giải thích
    explainBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const textContent = promptInput.value.trim();

        if (!apiKey) {
            statusMsg.textContent = 'Vui lòng nhập Gemini API Key trước.';
            return;
        }
        if (!textContent && !selectedImageBase64) {
            statusMsg.textContent = 'Hãy bấm "Đọc text trang", chọn ảnh, hoặc nhập nội dung cần giải thích.';
            return;
        }

        localStorage.setItem(STORAGE_KEY, apiKey);
        explainBtn.disabled = true;
        statusMsg.textContent = 'Đang phân tích và giải thích...';
        outputBox.textContent = 'Đang xử lý...';

        const parts = [];
        parts.push({
            text:
                'Hãy đọc kỹ nội dung (văn bản và/hoặc hình ảnh) được cung cấp, phân tích ý chính và giải thích rõ ràng, dễ hiểu bằng tiếng Việt.\n\n' +
                (textContent ? `Nội dung văn bản:\n${textContent}` : 'Hãy phân tích hình ảnh đính kèm.')
        });

        if (selectedImageBase64 && selectedImageMime) {
            parts.push({
                inline_data: {
                    mime_type: selectedImageMime,
                    data: selectedImageBase64
                }
            });
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }]
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error?.message || `Lỗi HTTP ${res.status}`);
            }

            const reply =
                data.candidates?.[0]?.content?.parts
                    ?.map((p) => p.text || '')
                    .join('')
                    .trim() || 'Không nhận được nội dung phản hồi.';

            outputBox.textContent = reply;
            statusMsg.textContent = 'Hoàn tất.';
        } catch (err) {
            outputBox.textContent = 'Lỗi: ' + err.message;
            statusMsg.textContent = 'Có lỗi xảy ra.';
        } finally {
            explainBtn.disabled = false;
        }
    });
})();
