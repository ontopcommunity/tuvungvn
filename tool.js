(async () => {
    try {
        console.log("Bắt đầu tải từ điển...");
        const response = await fetch("https://raw.githubusercontent.com/ontopcommunity/tuvungvn/refs/heads/main/tuvungvn.txt");
        const text = await response.text();
        const dictionary = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.includes(' '));

        console.log("Tải thành công!");
        console.log("Số lượng từ:", dictionary.length);

        let currentTargetQuestion = "";
        let usedAnswers = new Set();
        let lastAnagramHash = "";
        let usedAnagramAnswers = new Set();
        let lastVaTuHash = "";
        let usedVaTuAnswers = new Set();
        let lastPoliceHash = "";
        let isProcessing = false;
        let lastRandomBtnTime = 0;

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

                const randomBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.toLowerCase().includes("ngẫu nhiên"));
                if (randomBtn && Date.now() - lastRandomBtnTime > 500) {
                    lastRandomBtnTime = Date.now();
                    triggerEvent(randomBtn, "mouseover", MouseEvent);
                    triggerEvent(randomBtn, "mousedown", MouseEvent);
                    triggerEvent(randomBtn, "mouseup", MouseEvent);
                    triggerEvent(randomBtn, "click", MouseEvent);
                    try { randomBtn.click(); } catch (e) {}
                    try { HTMLButtonElement.prototype.click.call(randomBtn); } catch (e) {}
                    try { HTMLElement.prototype.click.call(randomBtn); } catch (e) {}
                    console.log("Đã bấm nút Ngẫu Nhiên");
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
                        console.log("Câu hỏi chọn chính tả hiện tại:", currentHash);

                        const correctOption = options.find(o => dictionary.includes(o.text));

                        if (correctOption) {
                            console.log("Đáp án đúng chính tả:", correctOption.text);
                            const el = correctOption.element;

                            try { el.focus(); } catch (e) {}

                            const pointerEvents = ["pointerover", "pointerenter", "pointermove", "pointerdown", "pointerup"];
                            pointerEvents.forEach(evt => triggerEvent(el, evt, PointerEvent));

                            const mouseEvents = ["mouseover", "mouseenter", "mousemove", "mousedown", "mouseup", "click"];
                            mouseEvents.forEach(evt => triggerEvent(el, evt, MouseEvent));

                            try { el.click(); } catch (e) {}
                            try { HTMLButtonElement.prototype.click.call(el); } catch (e) {}
                            try { HTMLElement.prototype.click.call(el); } catch (e) {}

                            console.log("Hoàn thành.");
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
                        console.log("Câu hỏi vá từ hiện tại:", currentHash);
                    }

                    const regex = new RegExp("^" + patternArr.join("") + "$", "i");
                    const validAnswers = dictionary.filter(w => regex.test(w.trim()));
                    const availableAnswers = validAnswers.filter(ans => !usedVaTuAnswers.has(ans));

                    if (availableAnswers.length > 0) {
                        const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                        usedVaTuAnswers.add(randomAnswer);
                        console.log("Đáp án vá từ đã chọn:", randomAnswer);

                        vaTuInput.focus();

                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                        nativeInputValueSetter.call(vaTuInput, randomAnswer);

                        vaTuInput.dispatchEvent(new Event("input", { bubbles: true }));
                        vaTuInput.dispatchEvent(new Event("change", { bubbles: true }));
                        console.log("Đã nhập.");

                        await new Promise(resolve => setTimeout(resolve, 10));

                        const keyEvents = ["keydown", "keypress", "keyup"];
                        keyEvents.forEach(evt => triggerEvent(vaTuInput, evt, KeyboardEvent, { key: "Enter", code: "Enter", keyCode: 13, which: 13 }));

                        const formElement = vaTuInput.closest("form");
                        if (formElement) {
                            try { formElement.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); } catch (e) {}
                            try { formElement.submit(); } catch (e) {}
                        }

                        console.log("Hoàn thành.");
                        setTimeout(() => { isProcessing = false; }, 10);
                        return;
                    }
                }

                const chars = document.querySelectorAll(".stick-answer-input_character__N56_X");
                const slots = document.querySelectorAll(".stick-answer-input_answerSlot__AM1x1");

                if (chars.length > 0 && slots.length > 0) {
                    const charObjs = Array.from(chars).map(el => ({
                        char: el.textContent.trim().toLowerCase(),
                        element: el,
                        used: false
                    }));

                    const currentHash = charObjs.map(c => c.char).sort().join('') + "_" + slots.length;

                    if (currentHash !== lastAnagramHash) {
                        lastAnagramHash = currentHash;
                        usedAnagramAnswers.clear();
                        console.log("Câu hỏi ghép chữ hiện tại:", currentHash);
                    }

                    const expectedLength = slots.length;
                    const availableCharsStr = charObjs.map(c => c.char).sort().join('');

                    const validAnswers = dictionary.filter(w => {
                        const wClean = w.replace(/\s+/g, '').toLowerCase();
                        if (wClean.length !== expectedLength) return false;
                        return wClean.split('').sort().join('') === availableCharsStr;
                    });

                    const availableAnswers = validAnswers.filter(ans => !usedAnagramAnswers.has(ans));

                    if (availableAnswers.length > 0) {
                        const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                        usedAnagramAnswers.add(randomAnswer);
                        console.log("Đáp án ghép chữ đã chọn:", randomAnswer);

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

                        console.log("Hoàn thành.");
                        setTimeout(() => { isProcessing = false; }, 10);
                        return;
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
                                console.log("Câu hỏi nối chữ hiện tại:", currentQuestion);
                            }

                            const words = currentQuestion.split(/\s+/);
                            const lastWord = words[words.length - 1].toLowerCase();

                            const validAnswers = dictionary.filter(phrase => {
                                const phraseWords = phrase.toLowerCase().split(/\s+/);
                                return phraseWords[0] === lastWord;
                            });

                            const availableAnswers = validAnswers.filter(ans => !usedAnswers.has(ans));

                            if (availableAnswers.length > 0) {
                                const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                                usedAnswers.add(randomAnswer);
                                console.log("Đáp án nối chữ đã chọn:", randomAnswer);

                                inputElement.focus();

                                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                                nativeInputValueSetter.call(inputElement, randomAnswer);

                                inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                                inputElement.dispatchEvent(new Event("change", { bubbles: true }));
                                console.log("Đã nhập.");

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

                                console.log("Hoàn thành.");
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
