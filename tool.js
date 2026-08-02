(async () => {
    try {
        const originalFetch = window.fetch;
        window.fetch = async function () {
            const response = await originalFetch.apply(this, arguments);
            try {
                const resource = arguments[0];
                const url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
                if (url.includes('/api/v1/user/get')) {
                    const clone = response.clone();
                    clone.json().then(data => {
                        if (data && data.name !== undefined) {
                            window.dispatchEvent(new CustomEvent('updateUserInfo', { detail: data }));
                        }
                    }).catch(() => {});
                }
            } catch (error) {}
            return response;
        };

        const originalXHR = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function () {
            this.addEventListener('load', function () {
                try {
                    if (this.responseURL.includes('/api/v1/user/get')) {
                        const data = JSON.parse(this.responseText);
                        if (data && data.name !== undefined) {
                            window.dispatchEvent(new CustomEvent('updateUserInfo', { detail: data }));
                        }
                    }
                } catch (error) {}
            });
            originalXHR.apply(this, arguments);
        };

        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
            @keyframes rainbowBorderAnim {
                0% { border-color: #ff0000; box-shadow: 0 0 8px #ff0000; }
                17% { border-color: #ff8000; box-shadow: 0 0 8px #ff8000; }
                33% { border-color: #ffff00; box-shadow: 0 0 8px #ffff00; }
                50% { border-color: #00ff00; box-shadow: 0 0 8px #00ff00; }
                67% { border-color: #0000ff; box-shadow: 0 0 8px #0000ff; }
                83% { border-color: #8000ff; box-shadow: 0 0 8px #8000ff; }
                100% { border-color: #ff0000; box-shadow: 0 0 8px #ff0000; }
            }
            .rainbow-border {
                animation: rainbowBorderAnim 2s linear infinite;
                border: 2px solid;
            }
        `;
        document.head.appendChild(styleSheet);

        const popupId = 'bot-noi-tu-center-popup';
        const oldPopup = document.getElementById(popupId);
        if (oldPopup) oldPopup.remove();

        const popup = document.createElement('div');
        popup.id = popupId;
        Object.assign(popup.style, {
            position: 'fixed',
            top: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '9999999',
            background: 'rgba(20, 20, 20, 0.95)',
            color: '#fff',
            fontFamily: 'sans-serif',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none',
            overflow: 'hidden',
            transition: 'all 0.2s ease'
        });

        const header = document.createElement('div');
        header.className = 'rainbow-border';
        Object.assign(header.style, {
            padding: '8px 20px',
            background: '#111',
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#0ff',
            cursor: 'pointer',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            borderRadius: 'inherit'
        });
        header.textContent = 'Bot Nối Từ';

        const body = document.createElement('div');
        Object.assign(body.style, {
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderLeft: '1px solid #333',
            borderRight: '1px solid #333',
            borderBottom: '1px solid #333',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            background: 'rgba(20, 20, 20, 0.95)'
        });

        const statusText = document.createElement('div');
        Object.assign(statusText.style, {
            fontSize: '11px',
            textAlign: 'center',
            color: '#aaa',
            marginBottom: '4px',
            fontWeight: 'bold'
        });
        statusText.textContent = 'Auto Play: OFF';

        const userInfoBox = document.createElement('div');
        Object.assign(userInfoBox.style, {
            background: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '11px',
            display: 'none',
            flexDirection: 'column',
            position: 'relative',
            gap: '4px'
        });

        const closeUserBtn = document.createElement('span');
        closeUserBtn.textContent = '✖';
        Object.assign(closeUserBtn.style, {
            position: 'absolute',
            top: '4px',
            right: '6px',
            cursor: 'pointer',
            color: '#f55',
            fontWeight: 'bold',
            fontSize: '12px'
        });
        closeUserBtn.onclick = () => {
            userInfoBox.style.display = 'none';
        };

        const userNameEl = document.createElement('div');
        const userLevelEl = document.createElement('div');
        const userCoinEl = document.createElement('div');

        userInfoBox.appendChild(closeUserBtn);
        userInfoBox.appendChild(userNameEl);
        userInfoBox.appendChild(userLevelEl);
        userInfoBox.appendChild(userCoinEl);

        window.addEventListener('updateUserInfo', (e) => {
            const { name, level, coin } = e.detail;
            userNameEl.innerHTML = `<span style="color:#aaa">Tên:</span> <span style="color:#fff;font-weight:bold">${name}</span>`;
            userLevelEl.innerHTML = `<span style="color:#aaa">Cấp:</span> <span style="color:#ff0;font-weight:bold">${level}</span>`;
            userCoinEl.innerHTML = `<span style="color:#aaa">Xu:</span> <span style="color:#0f0;font-weight:bold">${coin}</span>`;
            userInfoBox.style.display = 'flex';
        });

        const grid = document.createElement('div');
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px'
        });

        const modes = [
            { classNames: ["", "multiple-mode-lobby_rankedBtnWORD_LINK__2vwAn"], title: "Nối Từ" },
            { classNames: ["", "multiple-mode-lobby_rankedBtnWORD_LINK_CARD__K12WX"], title: "Nối Từ Mở Rộng" },
            { classNames: ["ranked-lobby_rankCardMIXED__RiEd5", "multiple-mode-lobby_rankedBtnMIXED__2NMtP"], title: "Đấu Trường Chữ Nghĩa" },
            { classNames: ["ranked-lobby_rankCardRandom__Br_il", "multiple-mode-lobby_rankedBtnRandom__c1EwH"], title: "Ngẫu nhiên" }
        ];

        let activeMode = null;
        let isMinimized = false;

        const stopBtn = document.createElement('button');
        stopBtn.textContent = '⏹ DỪNG';
        Object.assign(stopBtn.style, {
            background: '#800000',
            color: '#fff',
            border: '1px solid #f00',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            marginTop: '2px',
            display: 'none'
        });

        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'rainbow-border';
            btn.textContent = mode.title;
            Object.assign(btn.style, {
                background: '#2a2a2a',
                color: '#fff',
                padding: '8px 4px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                transition: 'background 0.2s'
            });
            btn.onmouseover = () => btn.style.background = '#3a3a3a';
            btn.onmouseout = () => btn.style.background = '#2a2a2a';
            btn.onclick = () => {
                activeMode = mode;
                statusText.textContent = `Auto Play: ${mode.title}`;
                statusText.style.color = '#0f0';
                grid.style.display = 'none';
                stopBtn.style.display = 'block';
            };
            grid.appendChild(btn);
        });

        stopBtn.onclick = () => {
            activeMode = null;
            statusText.textContent = 'Auto Play: OFF';
            statusText.style.color = '#aaa';
            grid.style.display = 'grid';
            stopBtn.style.display = 'none';
        };

        body.appendChild(statusText);
        body.appendChild(userInfoBox);
        body.appendChild(grid);
        body.appendChild(stopBtn);
        popup.appendChild(header);
        popup.appendChild(body);
        document.body.appendChild(popup);

        header.onclick = () => {
            isMinimized = !isMinimized;
            if (isMinimized) {
                body.style.display = 'none';
                header.style.borderBottomLeftRadius = '8px';
                header.style.borderBottomRightRadius = '8px';
            } else {
                body.style.display = 'flex';
                header.style.borderBottomLeftRadius = '0';
                header.style.borderBottomRightRadius = '0';
            }
        };

        const response = await fetch("https://raw.githubusercontent.com/ontopcommunity/tuvungvn/refs/heads/main/tuvungvn.txt");
        const text = await response.text();
        const dictionary = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.includes(' '));

        const apiCache = new Map();

        const fetchApiSuggestions = async (q) => {
            if (!q) return [];
            const key = q.toLowerCase();
            if (apiCache.has(key)) return apiCache.get(key);
            
            try {
                const res = await fetch(`https://dictionaryvip.vercel.app/api/v1/suggest?q=${encodeURIComponent(key)}`);
                const data = await res.json();
                if (data && Array.isArray(data.suggestions)) {
                    const filtered = data.suggestions.filter(s => {
                        const words = s.trim().split(/\s+/);
                        return words.length === 2;
                    });
                    apiCache.set(key, filtered);
                    return filtered;
                }
            } catch (e) {}
            
            apiCache.set(key, []);
            return [];
        };

        let currentTargetQuestion = "";
        let usedAnswers = new Set();
        let lastAnagramHash = "";
        let usedAnagramAnswers = new Set();
        let lastVaTuHash = "";
        let usedVaTuAnswers = new Set();
        let lastPoliceHash = "";
        let isProcessing = false;
        let lastLobbyBtnTime = 0;

        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const processQuestion = async () => {
            if (isProcessing) return;
            isProcessing = true;

            try {
                const triggerEvent = (element, eventName, EventClass, options = {}) => {
                    try {
                        const event = new EventClass(eventName, { bubbles: true, cancelable: true, ...options });
                        element.dispatchEvent(event);
                    } catch (e) {}
                };

                if (activeMode && Date.now() - lastLobbyBtnTime > 500) {
                    let targetBtn = null;
                    for (const cls of activeMode.classNames) {
                        if (cls) {
                            targetBtn = document.querySelector(`.${cls}`);
                            if (targetBtn) break;
                        }
                    }
                    if (!targetBtn) {
                        const allInteractables = Array.from(document.querySelectorAll("button, div[role='button'], .ranked-lobby_rankCard__qP4hM, a, [class*='multiple-mode-lobby']"));
                        targetBtn = allInteractables.find(b => {
                            const t = b.textContent;
                            return t && t.trim().toLowerCase() === activeMode.title.toLowerCase();
                        });
                    }

                    if (targetBtn) {
                        lastLobbyBtnTime = Date.now();
                        triggerEvent(targetBtn, "mouseover", MouseEvent);
                        triggerEvent(targetBtn, "mousedown", MouseEvent);
                        triggerEvent(targetBtn, "mouseup", MouseEvent);
                        triggerEvent(targetBtn, "click", MouseEvent);
                        try { targetBtn.click(); } catch (e) {}
                        try { HTMLButtonElement.prototype.click.call(targetBtn); } catch (e) {}
                        try { HTMLElement.prototype.click.call(targetBtn); } catch (e) {}
                    }
                }

                const policeButtons = document.querySelectorAll("button.police-answer-input_wordButton__P3fhW");
                if (policeButtons.length > 0) {
                    const options = Array.from(policeButtons).map(btn => ({
                        element: btn,
                        text: btn.querySelector(".police-answer-input_wordText__lEN0Q")?.textContent.trim().toLowerCase() || btn.textContent.trim().toLowerCase()
                    }));

                    const currentHash = options.map(o => o.text).sort().join("|");

                    if (currentHash !== lastPoliceHash) {
                        lastPoliceHash = currentHash;
                        let correctOption = options.find(o => dictionary.includes(o.text));

                        if (!correctOption) {
                            for (const opt of options) {
                                const apiRes = await fetchApiSuggestions(opt.text);
                                if (apiRes.some(s => s.toLowerCase() === opt.text)) {
                                    correctOption = opt;
                                    break;
                                }
                            }
                        }

                        if (correctOption) {
                            const el = correctOption.element;

                            try { el.focus(); } catch (e) {}

                            const pointerEvents = ["pointerover", "pointerenter", "pointermove", "pointerdown", "pointerup"];
                            pointerEvents.forEach(evt => triggerEvent(el, evt, PointerEvent));

                            const mouseEvents = ["mouseover", "mouseenter", "mousemove", "mousedown", "mouseup", "click"];
                            mouseEvents.forEach(evt => triggerEvent(el, evt, MouseEvent));

                            try { el.click(); } catch (e) {}
                            try { HTMLButtonElement.prototype.click.call(el); } catch (e) {}
                            try { HTMLElement.prototype.click.call(el); } catch (e) {}

                            setTimeout(() => { isProcessing = false; }, 10);
                            return;
                        }
                    }
                }

                const vaTuInput = document.querySelector("input.va-tu-answer-input_input__N9YZm");
                const vaTuSpans = document.querySelectorAll(".va-tu-answer-input_character__GQCNk");

                if (vaTuInput && vaTuSpans.length > 0) {
                    const patternArr = Array.from(vaTuSpans).map(s => {
                        if (s.classList.contains("va-tu-answer-input_hiddenChar__0Utpw") || s.textContent === "_") {
                            return ".";
                        }
                        if (s.textContent === " " || s.textContent === "\u00A0") {
                            return " ";
                        }
                        return escapeRegExp(s.textContent.toLowerCase());
                    });

                    const currentHash = patternArr.join("") + "_" + vaTuSpans.length;

                    if (currentHash !== lastVaTuHash) {
                        lastVaTuHash = currentHash;
                        usedVaTuAnswers.clear();
                    }

                    const regex = new RegExp("^" + patternArr.join("") + "$", "i");
                    let validAnswers = dictionary.filter(w => regex.test(w.trim()));
                    let availableAnswers = validAnswers.filter(ans => !usedVaTuAnswers.has(ans));

                    if (availableAnswers.length === 0) {
                        const firstKnownChar = Array.from(vaTuSpans).map(s => s.textContent.trim()).find(t => t && t !== "_" && t !== "\u00A0") || "";
                        if (firstKnownChar) {
                            const apiRes = await fetchApiSuggestions(firstKnownChar);
                            const apiValid = apiRes.filter(w => regex.test(w.trim()));
                            availableAnswers = apiValid.filter(ans => !usedVaTuAnswers.has(ans));
                        }
                    }

                    if (availableAnswers.length > 0) {
                        const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                        usedVaTuAnswers.add(randomAnswer);

                        vaTuInput.focus();

                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                        nativeInputValueSetter.call(vaTuInput, randomAnswer);

                        vaTuInput.dispatchEvent(new Event("input", { bubbles: true }));
                        vaTuInput.dispatchEvent(new Event("change", { bubbles: true }));

                        await new Promise(resolve => setTimeout(resolve, 10));

                        const keyEvents = ["keydown", "keypress", "keyup"];
                        keyEvents.forEach(evt => triggerEvent(vaTuInput, evt, KeyboardEvent, { key: "Enter", code: "Enter", keyCode: 13, which: 13 }));

                        const formElement = vaTuInput.closest("form");
                        if (formElement) {
                            try { formElement.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); } catch (e) {}
                            try { formElement.submit(); } catch (e) {}
                        }

                        setTimeout(() => { isProcessing = false; }, 10);
                        return;
                    }
                }

                const chars = document.querySelectorAll(".stick-answer-input_character__N56_X");
                const slots = document.querySelectorAll(".stick-answer-input_answerSlot__AM1x1");

                if (chars.length > 0 && slots.length > 0) {
                    const rawCharList = Array.from(chars).map(el => ({
                        originalText: el.textContent.trim(),
                        char: el.textContent.trim().toLowerCase(),
                        element: el,
                        used: false
                    }));

                    const isWholeWordMode = rawCharList.some(c => c.originalText.length > 1 || /\s/.test(c.originalText));

                    if (isWholeWordMode) {
                        const unclicked = rawCharList.filter(c => {
                            const opacity = window.getComputedStyle(c.element).opacity;
                            const pointerEvents = window.getComputedStyle(c.element).pointerEvents;
                            return opacity !== '0' && pointerEvents !== 'none';
                        });

                        if (unclicked.length > 0) {
                            const target = unclicked[Math.floor(Math.random() * unclicked.length)];
                            const el = target.element;
                            try { el.focus(); } catch (e) {}
                            const pointerEvents = ["pointerover", "pointerenter", "pointermove", "pointerdown", "pointerup"];
                            pointerEvents.forEach(evt => triggerEvent(el, evt, PointerEvent));
                            const mouseEvents = ["mouseover", "mouseenter", "mousemove", "mousedown", "mouseup", "click"];
                            mouseEvents.forEach(evt => triggerEvent(el, evt, MouseEvent));
                            try { el.click(); } catch (e) {}
                            try { HTMLElement.prototype.click.call(el); } catch (e) {}
                            await new Promise(resolve => setTimeout(resolve, 10));
                            setTimeout(() => { isProcessing = false; }, 10);
                            return;
                        }
                    } else {
                        const charObjs = rawCharList;
                        const currentHash = charObjs.map(c => c.char).sort().join('') + "_" + slots.length;

                        if (currentHash !== lastAnagramHash) {
                            lastAnagramHash = currentHash;
                            usedAnagramAnswers.clear();
                        }

                        const expectedLength = slots.length;
                        const availableCharsStr = charObjs.map(c => c.char).sort().join('');

                        let validAnswers = dictionary.filter(w => {
                            const wClean = w.replace(/\s+/g, '').toLowerCase();
                            if (wClean.length !== expectedLength) return false;
                            return wClean.split('').sort().join('') === availableCharsStr;
                        });

                        let availableAnswers = validAnswers.filter(ans => !usedAnagramAnswers.has(ans));

                        if (availableAnswers.length === 0) {
                            const upperItem = charObjs.find(c => c.originalText && c.originalText !== c.originalText.toLowerCase());
                            const queryKey = upperItem ? upperItem.originalText : (charObjs[0]?.char || "");
                            if (queryKey) {
                                const apiRes = await fetchApiSuggestions(queryKey);
                                const apiValid = apiRes.filter(w => {
                                    const wClean = w.replace(/\s+/g, '').toLowerCase();
                                    if (wClean.length !== expectedLength) return false;
                                    return wClean.split('').sort().join('') === availableCharsStr;
                                });
                                availableAnswers = apiValid.filter(ans => !usedAnagramAnswers.has(ans));
                            }
                        }

                        if (availableAnswers.length > 0) {
                            const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                            usedAnagramAnswers.add(randomAnswer);

                            const answerClean = randomAnswer.replace(/\s+/g, '').toLowerCase();

                            for (let i = 0; i < answerClean.length; i++) {
                                const charTarget = answerClean[i];
                                const match = charObjs.find(c => !c.used && c.char === charTarget);
                                
                                if (match) {
                                    match.used = true;
                                    const el = match.element;

                                    try { el.focus(); } catch (e) {}

                                    const pointerEvents = ["pointerover", "pointerenter", "pointermove", "pointerdown", "pointerup"];
                                    pointerEvents.forEach(evt => triggerEvent(el, evt, PointerEvent));

                                    const mouseEvents = ["mouseover", "mouseenter", "mousemove", "mousedown", "mouseup", "click"];
                                    mouseEvents.forEach(evt => triggerEvent(el, evt, MouseEvent));

                                    try { el.click(); } catch (e) {}
                                    try { HTMLElement.prototype.click.call(el); } catch (e) {}

                                    await new Promise(resolve => setTimeout(resolve, 5));
                                }
                            }

                            setTimeout(() => { isProcessing = false; }, 10);
                            return;
                        }
                    }
                }

                const wordElement = document.querySelector("a.word-detail_wordDetailWord__1DYml");
                const inputElement = document.querySelector("input.word-link-answer-input_input__L6PK2");
                const svgElement = document.querySelector("svg.lucide.lucide-send");

                if (wordElement && inputElement && svgElement) {
                    const buttonElement = svgElement.closest("button");
                    if (buttonElement) {
                        const currentQuestion = wordElement.textContent.trim();
                        if (currentQuestion) {
                            if (currentQuestion !== currentTargetQuestion) {
                                currentTargetQuestion = currentQuestion;
                                usedAnswers.clear();
                            }

                            const words = currentQuestion.split(/\s+/);
                            const lastWord = words[words.length - 1].toLowerCase();

                            let validAnswers = dictionary.filter(phrase => {
                                const phraseWords = phrase.toLowerCase().split(/\s+/);
                                return phraseWords[0] === lastWord;
                            });

                            let availableAnswers = validAnswers.filter(ans => !usedAnswers.has(ans));

                            if (availableAnswers.length === 0) {
                                const apiRes = await fetchApiSuggestions(lastWord);
                                const apiValid = apiRes.filter(phrase => {
                                    const phraseWords = phrase.toLowerCase().split(/\s+/);
                                    return phraseWords[0] === lastWord;
                                });
                                availableAnswers = apiValid.filter(ans => !usedAnswers.has(ans));
                            }

                            if (availableAnswers.length > 0) {
                                const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                                usedAnswers.add(randomAnswer);

                                inputElement.focus();

                                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                                nativeInputValueSetter.call(inputElement, randomAnswer);

                                inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                                inputElement.dispatchEvent(new Event("change", { bubbles: true }));

                                await new Promise(resolve => setTimeout(resolve, 10));

                                try { buttonElement.focus(); } catch (e) {}

                                const pointerEvents = ["pointerover", "pointerenter", "pointermove", "pointerdown", "pointerup"];
                                pointerEvents.forEach(evt => triggerEvent(buttonElement, evt, PointerEvent));

                                const mouseEvents = ["mouseover", "mouseenter", "mousemove", "mousedown", "mouseup", "click", "dblclick", "contextmenu"];
                                mouseEvents.forEach(evt => triggerEvent(buttonElement, evt, MouseEvent));

                                const keyEvents = ["keydown", "keypress", "keyup"];
                                keyEvents.forEach(evt => triggerEvent(buttonElement, evt, KeyboardEvent, { key: "Enter", code: "Enter", keyCode: 13 }));
                                keyEvents.forEach(evt => triggerEvent(buttonElement, evt, KeyboardEvent, { key: " ", code: "Space", keyCode: 32 }));

                                try {
                                    if (typeof buttonElement.setPointerCapture === "function") {
                                        buttonElement.setPointerCapture(1);
                                    }
                                } catch (e) {}

                                try {
                                    if (typeof buttonElement.releasePointerCapture === "function") {
                                        buttonElement.releasePointerCapture(1);
                                    }
                                } catch (e) {}

                                try { buttonElement.click(); } catch (e) {}
                                try { HTMLButtonElement.prototype.click.call(buttonElement); } catch (e) {}
                                try { HTMLElement.prototype.click.call(buttonElement); } catch (e) {}

                                const formElement = buttonElement.closest("form");
                                if (formElement) {
                                    try { formElement.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); } catch (e) {}
                                    try { formElement.submit(); } catch (e) {}
                                }
                            }
                        }
                    }
                }

                setTimeout(() => { isProcessing = false; }, 20);

            } catch (error) {
                isProcessing = false;
            }
        };

        const observer = new MutationObserver(processQuestion);
        observer.observe(document.body, { childList: true, subtree: true });

        setInterval(processQuestion, 50);

    } catch (error) {}
})();
