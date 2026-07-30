(async () => {
    try {
        let oldPopup = document.getElementById("mini-console-popup");
        if (oldPopup) oldPopup.remove();
        let popup = document.createElement("div");
        popup.id = "mini-console-popup";
        popup.style.cssText = "position:fixed;top:20px;right:20px;z-index:9999999;background:rgba(15,15,15,0.95);color:#fff;border-radius:8px;font-family:sans-serif;font-size:13px;box-shadow:0 4px 15px rgba(0,0,0,0.5);border:1px solid #333;width:300px;display:flex;flex-direction:column;transition:all 0.2s;backdrop-filter:blur(5px);";
        let isMinimized = false;
        let header = document.createElement("div");
        header.style.cssText = "background:#222;padding:8px 12px;cursor:grab;font-weight:bold;color:#fff;border-bottom:1px solid #333;border-radius:8px 8px 0 0;user-select:none;display:flex;justify-content:space-between;align-items:center;";
        let titleSpan = document.createElement("span");
        titleSpan.innerHTML = `Bot Nối Từ <span style="color:#38bdf8;font-size:11px;">v2.3</span>`;
        let minBtn = document.createElement("span");
        minBtn.innerText = "[-]";
        minBtn.style.cssText = "cursor:pointer;color:#38bdf8;font-size:14px;line-height:1;";
        header.appendChild(titleSpan);
        header.appendChild(minBtn);
        popup.appendChild(header);

        let bodyContent = document.createElement("div");
        bodyContent.style.display = "flex";
        bodyContent.style.flexDirection = "column";

        let mainMenu = document.createElement("div");
        let userInfoBox = document.createElement("div");
        userInfoBox.style.cssText = "padding:12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #333;background:#1a1a1a;";
        userInfoBox.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:30px;height:30px;background:#444;border-radius:50%;overflow:hidden;"><img id="bot-avatar" src="" style="width:100%;height:100%;display:none;object-fit:cover;"></div>
                <span id="bot-username" style="font-weight:bold;color:#fff;">Đang tải...</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;color:#fbbf24;font-weight:bold;">
                <span id="bot-coins">0</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"></circle><path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path><path d="M7 6h1v4"></path><path d="m16.71 13.88.7.71-2.82 2.82"></path></svg>
            </div>
        `;
        mainMenu.appendChild(userInfoBox);

        let modeContainer = document.createElement("div");
        modeContainer.style.cssText = "padding:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#111;";
        mainMenu.appendChild(modeContainer);

        let activeView = document.createElement("div");
        activeView.style.cssText = "display:none;flex-direction:column;";
        let activeHeader = document.createElement("div");
        activeHeader.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#1a1a1a;border-bottom:1px solid #333;";
        let activeModeName = document.createElement("span");
        activeModeName.style.cssText = "font-weight:bold;color:#38bdf8;";
        let stopBtn = document.createElement("button");
        stopBtn.innerText = "⏹ DỪNG";
        stopBtn.style.cssText = "background:#dc2626;color:#fff;border:none;padding:4px 8px;cursor:pointer;font-weight:bold;border-radius:4px;font-size:11px;";
        activeHeader.appendChild(activeModeName);
        activeHeader.appendChild(stopBtn);
        activeView.appendChild(activeHeader);

        let arenaProgressBox = document.createElement("div");
        arenaProgressBox.style.cssText = "display:none;padding:6px 10px;background:#2a2a2a;border-bottom:1px solid #444;text-align:center;font-weight:bold;font-size:11px;color:#fbbf24;";
        activeView.appendChild(arenaProgressBox);

        let gameStatusBox = document.createElement("div");
        gameStatusBox.style.cssText = "padding:12px;background:#111;min-height:80px;display:flex;flex-direction:column;gap:8px;";
        let qBox = document.createElement("div");
        qBox.innerHTML = `<span style="color:#888;">Hỏi:</span> <span id="bot-q-text" style="color:#fff;font-weight:bold;">...</span>`;
        let aBox = document.createElement("div");
        aBox.innerHTML = `<span style="color:#888;">Đáp:</span> <span id="bot-a-text" style="color:#4ade80;font-weight:bold;">...</span>`;
        gameStatusBox.appendChild(qBox);
        gameStatusBox.appendChild(aBox);
        activeView.appendChild(gameStatusBox);

        bodyContent.appendChild(mainMenu);
        bodyContent.appendChild(activeView);
        popup.appendChild(bodyContent);
        document.body.appendChild(popup);

        minBtn.onclick = () => {
            isMinimized = !isMinimized;
            bodyContent.style.display = isMinimized ? "none" : "flex";
            minBtn.innerText = isMinimized ? "[+]" : "[-]";
        };

        let isDragging = false, startX, startY, initialLeft, initialTop;
        header.onmousedown = (e) => {
            if (e.target === minBtn) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = popup.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            header.style.cursor = "grabbing";
            popup.style.bottom = "auto";
            popup.style.right = "auto";
        };
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            popup.style.left = (initialLeft + (e.clientX - startX)) + "px";
            popup.style.top = (initialTop + (e.clientY - startY)) + "px";
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = "grab";
        });

        let isRunning = false;
        let currentMode = "";
        let currentModeKeywords = [];
        let dictionary = [];
        let isProcessing = false;

        const updateUserInfo = () => {
            const nameEl = document.querySelector('div[aria-label="Thông tin người chơi"] span.has-text-weight-semibold span');
            const coinEl = document.querySelector('div[aria-label="Mở Tạp Hóa"] span.has-text-weight-bold');
            const avatarEl = document.querySelector('div[aria-label="Thông tin người chơi"] img');
            if (nameEl) document.getElementById("bot-username").innerText = nameEl.innerText;
            if (coinEl) document.getElementById("bot-coins").innerText = coinEl.innerText;
            if (avatarEl) {
                let img = document.getElementById("bot-avatar");
                img.src = avatarEl.src;
                img.style.display = "block";
            }
        };

        const updateGameUI = (q, a, type, arenaNum) => {
            document.getElementById("bot-q-text").innerText = q || "...";
            document.getElementById("bot-a-text").innerText = a || "...";
            if (currentMode === "Đấu trường") {
                arenaProgressBox.style.display = "block";
                arenaProgressBox.innerText = `Câu ${arenaNum || "?"}/10 - ${type || "Đang tìm..."}`;
            } else {
                arenaProgressBox.style.display = "none";
            }
        };

        const triggerEvent = (element, eventName, EventClass, options = {}) => {
            try {
                const event = new EventClass(eventName, { bubbles: true, cancelable: true, ...options });
                element.dispatchEvent(event);
            } catch (e) {}
        };

        const startMode = (text, searchKeywords) => {
            if (dictionary.length === 0) return;
            currentMode = text;
            currentModeKeywords = searchKeywords;
            mainMenu.style.display = "none";
            activeView.style.display = "flex";
            activeModeName.innerText = `▶ ${text}`;
            updateGameUI("...", "...", "", "");
            isRunning = true;
            
            const realBtns = Array.from(document.querySelectorAll("button, a, div[role='button']"));
            const target = realBtns.find(el => {
                const t = el.textContent.toLowerCase().trim();
                return searchKeywords.some(kw => t === kw || t.includes(kw));
            });
            if (target) {
                try { target.focus(); } catch(e){}
                ["mouseover", "mousedown", "mouseup", "click"].forEach(evt => triggerEvent(target, evt, MouseEvent));
                try { target.click(); } catch(e){}
                try { HTMLElement.prototype.click.call(target); } catch(e){}
            }
        };

        const createModeBtn = (text, searchKeywords) => {
            let b = document.createElement("button");
            b.innerText = text;
            b.style.cssText = "background:#222;color:#fff;border:1px solid #444;padding:8px;cursor:pointer;font-size:12px;border-radius:4px;font-weight:bold;";
            b.onmouseover = () => b.style.background = "#333";
            b.onmouseout = () => b.style.background = "#222";
            b.onclick = () => startMode(text, searchKeywords);
            return b;
        };

        modeContainer.appendChild(createModeBtn("Ngẫu nhiên", ["ngẫu nhiên"]));
        modeContainer.appendChild(createModeBtn("Nối từ", ["nối từ"]));
        modeContainer.appendChild(createModeBtn("Nối từ MR", ["nối từ mở rộng", "mở rộng"]));
        modeContainer.appendChild(createModeBtn("Đấu trường", ["đấu trường chữ nghĩa", "đấu trường"]));

        stopBtn.onclick = () => {
            isRunning = false;
            currentMode = "";
            currentModeKeywords = [];
            activeView.style.display = "none";
            mainMenu.style.display = "block";
            updateUserInfo();
        };

        fetch("https://raw.githubusercontent.com/ontopcommunity/tuvungvn/refs/heads/main/tuvungvn.txt")
        .then(res => res.text())
        .then(text => {
            dictionary = text.split('\n').map(line => line.trim()).filter(line => line.length > 0 && line.includes(' '));
        }).catch(e => {});

        let currentTargetQuestion = "";
        let usedAnswers = new Set();
        let lastAnagramHash = "";
        let usedAnagramAnswers = new Set();
        let lastVaTuHash = "";
        let usedVaTuAnswers = new Set();
        let lastPoliceHash = "";
        let pendingRestartTime = 0;
        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const detectArenaStatus = () => {
            let num = "?";
            const textNodes = Array.from(document.querySelectorAll("span, div, p"));
            const qNode = textNodes.find(n => n.textContent && n.textContent.match(/Câu(?: hỏi)?\s*(\d+)\s*\/\s*10/i));
            if (qNode) {
                const match = qNode.textContent.match(/(\d+)\s*\/\s*10/);
                if (match) num = match[1];
            }
            return num;
        };

        const processQuestion = async () => {
            if (!isRunning || isProcessing) return;
            isProcessing = true;
            try {
                const policeButtons = document.querySelectorAll("button.police-answer-input_wordButton__P3fhW");
                const vaTuInput = document.querySelector("input.va-tu-answer-input_input__N9YZm");
                const chars = document.querySelectorAll(".stick-answer-input_character__N56_X");
                const wordElement = document.querySelector("a.word-detail_wordDetailWord__1DYml");
                const isGameActive = policeButtons.length > 0 || vaTuInput || chars.length > 0 || wordElement;

                if (!isGameActive) {
                    if (pendingRestartTime === 0) {
                        const elements = document.querySelectorAll("h1, h2, h3, h4, p, span, div");
                        let isGameOver = false;
                        for (let i = 0; i < elements.length; i++) {
                            const txt = elements[i].textContent;
                            if (txt && (txt.toLowerCase().includes("thua cuộc") || txt.toLowerCase().includes("chiến thắng"))) {
                                isGameOver = true;
                                break;
                            }
                        }
                        if (isGameOver) {
                            pendingRestartTime = Date.now() + 4000;
                        }
                    } else if (Date.now() > pendingRestartTime) {
                        const realBtns = Array.from(document.querySelectorAll("button, a, div[role='button']"));
                        const targetBtn = realBtns.find(el => {
                            const t = el.textContent.toLowerCase().trim();
                            return currentModeKeywords.some(kw => t === kw || t.includes(kw));
                        });
                        if (targetBtn) {
                            try { targetBtn.focus(); } catch (e) {}
                            ["mouseover", "mousedown", "mouseup", "click"].forEach(evt => triggerEvent(targetBtn, evt, MouseEvent));
                            try { targetBtn.click(); } catch (e) {}
                            try { HTMLElement.prototype.click.call(targetBtn); } catch(e){}
                        }
                        pendingRestartTime = 0;
                    }
                    isProcessing = false;
                    return;
                }

                pendingRestartTime = 0;
                let arenaNum = currentMode === "Đấu trường" ? detectArenaStatus() : "";

                if (policeButtons.length > 0) {
                    const options = Array.from(policeButtons).map(btn => ({
                        element: btn,
                        text: btn.querySelector(".police-answer-input_wordText__lEN0Q")?.textContent.trim().toLowerCase() || btn.textContent.trim().toLowerCase()
                    }));
                    const currentHash = options.map(o => o.text).sort().join("|");
                    const qText = options.map(o => o.text).join(" | ");
                    if (currentHash !== lastPoliceHash) {
                        lastPoliceHash = currentHash;
                        const correctOption = options.find(o => dictionary.includes(o.text));
                        if (correctOption) {
                            updateGameUI(qText, correctOption.text, "Cảnh sát chính tả", arenaNum);
                            const el = correctOption.element;
                            try { el.focus(); } catch (e) {}
                            ["mouseover", "mouseenter", "mousemove", "mousedown", "mouseup", "click"].forEach(evt => triggerEvent(el, evt, MouseEvent));
                            try { el.click(); } catch (e) {}
                            setTimeout(() => { isProcessing = false; }, 150);
                            return;
                        }
                    }
                }

                const vaTuSpans = document.querySelectorAll(".va-tu-answer-input_character__GQCNk");
                if (vaTuInput && vaTuSpans.length > 0) {
                    const patternArr = Array.from(vaTuSpans).map(s => {
                        if (s.classList.contains("va-tu-answer-input_hiddenChar__0Utpw") || s.textContent === "_") return ".";
                        if (s.textContent === " " || s.textContent === "\u00A0") return " ";
                        return escapeRegExp(s.textContent.toLowerCase());
                    });
                    const currentHash = patternArr.join("") + "_" + vaTuSpans.length;
                    const qText = patternArr.join("").replace(/\./g, "_");
                    if (currentHash !== lastVaTuHash) {
                        lastVaTuHash = currentHash;
                        usedVaTuAnswers.clear();
                    }
                    const regex = new RegExp("^" + patternArr.join("") + "$", "i");
                    const availableAnswers = dictionary.filter(w => regex.test(w.trim()) && !usedVaTuAnswers.has(w));
                    if (availableAnswers.length > 0) {
                        const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                        usedVaTuAnswers.add(randomAnswer);
                        updateGameUI(qText, randomAnswer, "Vá từ", arenaNum);
                        
                        vaTuInput.focus();
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                        nativeInputValueSetter.call(vaTuInput, randomAnswer);
                        vaTuInput.dispatchEvent(new Event("input", { bubbles: true }));
                        vaTuInput.dispatchEvent(new Event("change", { bubbles: true }));
                        await new Promise(resolve => setTimeout(resolve, 5));
                        ["keydown", "keypress", "keyup"].forEach(evt => triggerEvent(vaTuInput, evt, KeyboardEvent, { key: "Enter", code: "Enter", keyCode: 13, which: 13 }));
                        const formElement = vaTuInput.closest("form");
                        if (formElement) {
                            try { formElement.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); } catch (e) {}
                        }
                        setTimeout(() => { isProcessing = false; }, 150);
                        return;
                    }
                }

                const slots = document.querySelectorAll(".stick-answer-input_answerSlot__AM1x1");
                if (chars.length > 0 && slots.length > 0) {
                    const charObjs = Array.from(chars).map(el => ({
                        char: el.textContent.trim().toLowerCase(),
                        element: el,
                        used: false
                    }));
                    const currentHash = charObjs.map(c => c.char).sort().join('') + "_" + chars.length;
                    const qText = charObjs.map(c => c.char).join(", ");
                    if (currentHash !== lastAnagramHash) {
                        lastAnagramHash = currentHash;
                        usedAnagramAnswers.clear();
                    }
                    const availableCharsStr = charObjs.map(c => c.char).sort().join('');
                    const availableAnswers = dictionary.filter(w => {
                        const wClean = w.replace(/\s+/g, '').toLowerCase();
                        if (wClean.length !== charObjs.length) return false;
                        return wClean.split('').sort().join('') === availableCharsStr && !usedAnagramAnswers.has(w);
                    });
                    if (availableAnswers.length > 0) {
                        const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                        usedAnagramAnswers.add(randomAnswer);
                        updateGameUI(qText, randomAnswer, "Ghép từ", arenaNum);

                        const answerClean = randomAnswer.replace(/\s+/g, '').toLowerCase();
                        for (let i = 0; i < answerClean.length; i++) {
                            const match = charObjs.find(c => !c.used && c.char === answerClean[i]);
                            if (match) {
                                match.used = true;
                                const el = match.element;
                                try { el.focus(); } catch (e) {}
                                ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(evt => triggerEvent(el, evt, MouseEvent));
                                try { el.click(); } catch (e) {}
                                try { HTMLElement.prototype.click.call(el); } catch (e) {}
                                await new Promise(resolve => setTimeout(resolve, 20));
                            }
                        }
                        setTimeout(() => { isProcessing = false; }, 150);
                        return;
                    }
                }

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
                            const availableAnswers = dictionary.filter(phrase => {
                                const phraseWords = phrase.toLowerCase().split(/\s+/);
                                return phraseWords[0] === lastWord && !usedAnswers.has(phrase);
                            });
                            if (availableAnswers.length > 0) {
                                const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                                usedAnswers.add(randomAnswer);
                                updateGameUI(currentQuestion, randomAnswer, "Nối từ", arenaNum);

                                inputElement.focus();
                                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                                nativeInputValueSetter.call(inputElement, randomAnswer);
                                inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                                inputElement.dispatchEvent(new Event("change", { bubbles: true }));
                                await new Promise(resolve => setTimeout(resolve, 5));
                                try { buttonElement.focus(); } catch (e) {}
                                ["mouseover", "mousedown", "mouseup", "click"].forEach(evt => triggerEvent(buttonElement, evt, MouseEvent));
                                ["keydown", "keypress", "keyup"].forEach(evt => triggerEvent(buttonElement, evt, KeyboardEvent, { key: "Enter", code: "Enter", keyCode: 13 }));
                                try { buttonElement.click(); } catch (e) {}
                                const formElement = buttonElement.closest("form");
                                if (formElement) {
                                    try { formElement.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); } catch (e) {}
                                }
                                setTimeout(() => { isProcessing = false; }, 150);
                                return;
                            }
                        }
                    }
                }
                isProcessing = false;
            } catch (error) {
                isProcessing = false;
            }
        };

        setInterval(processQuestion, 50);
        setInterval(updateUserInfo, 2000);
    } catch (error) {}
})();
