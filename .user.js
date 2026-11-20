// ==UserScript==
// @name         Universal UI - OCR, Step Filter VIP & Full Web Code
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Tự lấy ảnh sang text (OCR), lọc Bước 1..5+ và lấy full code HTML của trang web
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
                width: 365px;
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
            .vip-badge {
                font-size: 10px;
                font-weight: 700;
                padding: 2px 6px;
                border-radius: 999px;
                background: #f59e0b;
                color: #111114;
                margin-left: 6px;
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
            .input, .textarea, .code-textarea {
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
                min-height: 70px;
                resize: vertical;
            }
            .code-textarea {
                min-height: 110px;
                max-height: 180px;
                resize: vertical;
                background: #09090b;
                color: #86efac;
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11px;
                line-height: 1.4;
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
            .ui-btn.vip {
                background: #b45309;
                border-color: #f59e0b;
                color: #fffbeb;
            }
            .ui-btn.vip:hover {
                background: #92400e;
            }
            .ui-btn.code-btn {
                background: #065f46;
                border-color: #10b981;
                color: #ecfdf5;
            }
            .ui-btn.code-btn:hover {
                background: #047857;
            }
            .section-label {
                font-size: 11px;
                font-weight: 700;
                color: #a1a1aa;
                text-transform: uppercase;
                letter-spacing: 0.04em;
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
                max-height: 160px;
                overflow-y: auto;
            }
            .step-box {
                background: #141109;
                border: 1px solid rgba(245, 158, 11, 0.35);
                border-radius: 8px;
                padding: 10px;
                font-size: 12px;
                line-height: 1.55;
                color: #fde68a;
                white-space: pre-wrap;
                max-height: 150px;
                overflow-y: auto;
            }
            .status-msg {
                font-size: 11px;
                color: #93c5fd;
                min-height: 15px;
            }
            .img-preview {
                max-width: 100%;
                max-height: 100px;
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
                <div>
                    <span class="ui-title">OCR, Lọc Bước & Full Code</span>
                    <span class="vip-badge">VIP</span>
                </div>
                <button class="ui-close" id="closeBtn">&times;</button>
            </div>
            <div class="ui-body">
                <input class="input" type="password" id="apiKeyInput" placeholder="Dán Gemini API Key tại đây..." />

                <div class="row">
                    <button class="ui-btn primary" id="autoOcrBtn">Tự lấy ảnh -> Text</button>
                    <button class="ui-btn" id="pickImgBtn">Chọn 1 ảnh</button>
                </div>

                <img class="img-preview" id="imgPreview" alt="Ảnh đang xử lý" />

                <div class="section-label">Text trích xuất / Nội dung</div>
                <textarea class="textarea" id="textBox" placeholder="Chữ lấy từ ảnh hoặc nội dung có Bước 1, Bước 2... sẽ hiện ở đây..."></textarea>

                <div class="row">
                    <button class="ui-btn vip" id="filterStepsBtn">VIP: Lọc Bước 1..5+</button>
                    <button class="ui-btn" id="explainBtn">Giải thích</button>
                </div>

                <div class="section-label">Kết quả lọc Bước (VIP)</div>
                <div class="step-box" id="stepBox">Chưa lọc bước nào.</div>

                <div class="section-label">Full Code của trang web</div>
                <div class="row">
                    <button class="ui-btn code-btn" id="getCodeBtn">Đọc & Lấy Full Code</button>
                    <button class="ui-btn" id="copyCodeBtn">Copy Code</button>
                </div>
                <textarea class="code-textarea" id="codeBox" placeholder="Full mã nguồn HTML của trang web sẽ hiện ở đây..."></textarea>

                <div class="section-label">Kết quả / Giải thích</div>
                <div class="output-box" id="outputBox">Sẵn sàng.</div>

                <div class="status-msg" id="statusMsg">Sẵn sàng.</div>
            </div>
        </div>
    `;

    const toggleBtn = shadow.getElementById('toggleBtn');
    const mainUi = shadow.getElementById('mainUi');
    const closeBtn = shadow.getElementById('closeBtn');
    const apiKeyInput = shadow.getElementById('apiKeyInput');
    const autoOcrBtn = shadow.getElementById('autoOcrBtn');
    const pickImgBtn = shadow.getElementById('pickImgBtn');
    const imgPreview = shadow.getElementById('imgPreview');
    const textBox = shadow.getElementById('textBox');
    const filterStepsBtn = shadow.getElementById('filterStepsBtn');
    const explainBtn = shadow.getElementById('explainBtn');
    const getCodeBtn = shadow.getElementById('getCodeBtn');
    const copyCodeBtn = shadow.getElementById('copyCodeBtn');
    const codeBox = shadow.getElementById('codeBox');
    const stepBox = shadow.getElementById('stepBox');
    const outputBox = shadow.getElementById('outputBox');
    const statusMsg = shadow.getElementById('statusMsg');

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

    // Chuyển phần tử <img> sang base64 (có thử crossOrigin nếu cần)
    async function imgElementToBase64(imgEl) {
        const tryDraw = (sourceImg) => {
            const canvas = document.createElement('canvas');
            const w = sourceImg.naturalWidth || sourceImg.width;
            const h = sourceImg.naturalHeight || sourceImg.height;
            if (!w || !h) throw new Error('Ảnh không có kích thước hợp lệ.');

            const maxSide = 1280;
            const scale = Math.min(1, maxSide / Math.max(w, h));
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);

            const ctx = canvas.getContext('2d');
            ctx.drawImage(sourceImg, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            return {
                base64: dataUrl.split(',')[1],
                mimeType: 'image/jpeg',
                previewUrl: dataUrl
            };
        };

        try {
            return tryDraw(imgEl);
        } catch (_) {
            if (!imgEl.src) throw new Error('Ảnh bị chặn CORS.');
            const corsImg = new Image();
            corsImg.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                corsImg.onload = resolve;
                corsImg.onerror = () => reject(new Error('Ảnh bị chặn CORS, không thể đọc pixel.'));
                corsImg.src = imgEl.src;
            });
            return tryDraw(corsImg);
        }
    }

    // Gọi Gemini OCR lấy toàn bộ chữ trong ảnh (kể cả ký tự đơn như chữ "T")
    async function ocrImageWithGemini(apiKey, base64, mimeType) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text:
                                    'Hãy đóng vai công cụ OCR chính xác tuyệt đối. Đọc toàn bộ chữ, ký tự hoặc số có trong hình ảnh này ' +
                                    '(kể cả chỉ là một chữ cái đơn lẻ như "T"). Chỉ trả về đúng phần text trích xuất được, ' +
                                    'giữ nguyên xuống dòng và thứ tự các bước nếu có, không thêm lời dẫn.'
                            },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64
                                }
                            }
                        ]
                    }
                ]
            })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error?.message || `Lỗi HTTP ${res.status}`);
        }

        return (
            data.candidates?.[0]?.content?.parts
                ?.map((p) => p.text || '')
                .join('')
                .trim() || ''
        );
    }

    function findCandidateImages() {
        const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
            if (root.contains(img)) return false;
            const rect = img.getBoundingClientRect();
            const w = img.naturalWidth || rect.width;
            const h = img.naturalHeight || rect.height;
            const visible = rect.width > 20 && rect.height > 20 && getComputedStyle(img).display !== 'none';
            return visible && w > 20 && h > 20;
        });

        imgs.sort((a, b) => {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            const inViewA = ra.top < window.innerHeight && ra.bottom > 0 ? 1 : 0;
            const inViewB = rb.top < window.innerHeight && rb.bottom > 0 ? 1 : 0;
            if (inViewA !== inViewB) return inViewB - inViewA;
            return rb.width * rb.height - ra.width * ra.height;
        });

        return imgs;
    }

    autoOcrBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            statusMsg.textContent = 'Vui lòng nhập Gemini API Key trước.';
            return;
        }

        const candidates = findCandidateImages();
        if (!candidates.length) {
            statusMsg.textContent = 'Không tìm thấy ảnh nào trên trang.';
            return;
        }

        autoOcrBtn.disabled = true;
        statusMsg.textContent = `Tìm thấy ${candidates.length} ảnh. Đang tự lấy ảnh và đọc chữ...`;

        let lastError = '';
        for (const img of candidates) {
            try {
                const converted = await imgElementToBase64(img);
                imgPreview.src = converted.previewUrl;
                imgPreview.classList.add('show');

                const extractedText = await ocrImageWithGemini(apiKey, converted.base64, converted.mimeType);
                textBox.value = extractedText || '(Ảnh không có chữ rõ ràng)';
                statusMsg.textContent = extractedText
                    ? `Đã lấy chữ từ ảnh thành công (${extractedText.length} ký tự).`
                    : 'Đã đọc ảnh nhưng không thấy chữ.';
                autoOcrBtn.disabled = false;
                return;
            } catch (err) {
                lastError = err.message;
            }
        }

        autoOcrBtn.disabled = false;
        statusMsg.textContent = lastError || 'Không thể đọc ảnh trên trang này.';
    });

    pickImgBtn.addEventListener('click', () => {
        if (!apiKeyInput.value.trim()) {
            statusMsg.textContent = 'Hãy nhập Gemini API Key trước khi chọn ảnh.';
            return;
        }
        pickingImage = true;
        setOpen(false);
        statusMsg.textContent = 'Chạm vào 1 ảnh trên trang để tự chuyển sang text...';
    });

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

            const apiKey = apiKeyInput.value.trim();
            statusMsg.textContent = 'Đang lấy ảnh và chuyển sang text...';

            try {
                const converted = await imgElementToBase64(targetImg);
                imgPreview.src = converted.previewUrl;
                imgPreview.classList.add('show');

                const extractedText = await ocrImageWithGemini(apiKey, converted.base64, converted.mimeType);
                textBox.value = extractedText || '(Không đọc được chữ trong ảnh)';
                statusMsg.textContent = 'Đã chuyển ảnh sang text thành công.';
            } catch (err) {
                statusMsg.textContent = err.message;
            }
        },
        true
    );

    function extractStepSentences(rawText) {
        if (!rawText.trim()) return [];

        const chunks = rawText
            .split(/\r?\n|(?<=[.!?…])\s+/)
            .map((s) => s.trim())
            .filter(Boolean);

        const stepRegex = /(?:^|[\s\-–—:•*("“\[])(?:bước|step)\s*\d+\b/i;
        const matched = [];
        const seen = new Set();

        for (const chunk of chunks) {
            if (stepRegex.test(chunk)) {
                const subSteps = chunk.match(/(?:bước|step)\s*\d+\b[\s\S]*?(?=(?:(?:bước|step)\s*\d+\b)|$)/gi);
                if (subSteps && subSteps.length > 1) {
                    for (const sub of subSteps) {
                        const clean = sub.trim();
                        if (clean && !seen.has(clean)) {
                            seen.add(clean);
                            matched.push(clean);
                        }
                    }
                } else if (!seen.has(chunk)) {
                    seen.add(chunk);
                    matched.push(chunk);
                }
            }
        }

        return matched;
    }

    filterStepsBtn.addEventListener('click', () => {
        const source = textBox.value || document.body.innerText || '';
        const steps = extractStepSentences(source);

        if (!steps.length) {
            stepBox.textContent = 'Không tìm thấy câu nào có "Bước 1, Bước 2, Bước 3, Bước 4, Bước 5...".';
            statusMsg.textContent = 'Lọc bước hoàn tất: 0 kết quả.';
            return;
        }

        stepBox.textContent = steps.join('\n\n');
        statusMsg.textContent = `VIP đã lọc được ${steps.length} câu/mục có "Bước ...".`;
    });

    // Tính năng mới: Đọc & lấy full code HTML của trang hiện tại (bỏ phần UI của script)
    getCodeBtn.addEventListener('click', () => {
        try {
            const clone = document.documentElement.cloneNode(true);
            const injectedUi = clone.querySelector('#custom-ui-root');
            if (injectedUi) injectedUi.remove();

            const fullHtml = '<!DOCTYPE html>\n' + clone.outerHTML;
            codeBox.value = fullHtml;
            statusMsg.textContent = `Đã lấy full code trang (${fullHtml.length.toLocaleString()} ký tự).`;
        } catch (err) {
            statusMsg.textContent = 'Lỗi khi lấy code: ' + err.message;
        }
    });

    // Copy full code vào clipboard
    copyCodeBtn.addEventListener('click', async () => {
        const content = codeBox.value;
        if (!content) {
            statusMsg.textContent = 'Hãy bấm "Đọc & Lấy Full Code" trước.';
            return;
        }

        try {
            await navigator.clipboard.writeText(content);
            statusMsg.textContent = 'Đã copy full code vào bộ nhớ tạm.';
        } catch (_) {
            codeBox.select();
            document.execCommand('copy');
            statusMsg.textContent = 'Đã bôi đen/copy full code.';
        }
    });

    explainBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const content = (textBox.value || stepBox.textContent || codeBox.value.slice(0, 4000) || '').trim();

        if (!apiKey) {
            statusMsg.textContent = 'Vui lòng nhập Gemini API Key trước.';
            return;
        }
        if (!content) {
            statusMsg.textContent = 'Chưa có nội dung nào để giải thích.';
            return;
        }

        explainBtn.disabled = true;
        statusMsg.textContent = 'Đang giải thích...';
        outputBox.textContent = 'Đang xử lý...';

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Hãy đọc và giải thích rõ ràng, ngắn gọn, dễ hiểu bằng tiếng Việt nội dung sau:\n\n${content}`
                                }
                            ]
                        }
                    ]
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error?.message || `Lỗi HTTP ${res.status}`);
            }

            outputBox.textContent =
                data.candidates?.[0]?.content?.parts
                    ?.map((p) => p.text || '')
                    .join('')
                    .trim() || 'Không có phản hồi.';
            statusMsg.textContent = 'Giải thích xong.';
        } catch (err) {
            outputBox.textContent = 'Lỗi: ' + err.message;
            statusMsg.textContent = 'Có lỗi xảy ra.';
        } finally {
            explainBtn.disabled = false;
        }
    });
})();
