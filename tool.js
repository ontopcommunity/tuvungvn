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
        let isProcessing = false;

        const processQuestion = async () => {
            if (isProcessing) return;

            try {
                const wordElement = document.querySelector("a.word-detail_wordDetailWord__1DYml");
                const inputElement = document.querySelector("input.word-link-answer-input_input__L6PK2");
                const svgElement = document.querySelector("svg.lucide.lucide-send");

                if (!wordElement || !inputElement || !svgElement) return;

                const buttonElement = svgElement.closest("button");
                if (!buttonElement) return;

                const currentQuestion = wordElement.textContent.trim();
                if (!currentQuestion) return;

                if (currentQuestion !== currentTargetQuestion) {
                    currentTargetQuestion = currentQuestion;
                    usedAnswers.clear();
                    console.log("Câu hỏi hiện tại:", currentQuestion);
                }

                const words = currentQuestion.split(/\s+/);
                const lastWord = words[words.length - 1].toLowerCase();

                const validAnswers = dictionary.filter(phrase => {
                    const phraseWords = phrase.toLowerCase().split(/\s+/);
                    return phraseWords[0] === lastWord;
                });

                const availableAnswers = validAnswers.filter(ans => !usedAnswers.has(ans));

                if (availableAnswers.length === 0) return;

                isProcessing = true;

                const randomAnswer = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
                usedAnswers.add(randomAnswer);

                console.log("Đáp án đã chọn:", randomAnswer);

                inputElement.focus();

                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                nativeInputValueSetter.call(inputElement, randomAnswer);

                inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                inputElement.dispatchEvent(new Event("change", { bubbles: true }));
                console.log("Đã nhập.");

                await new Promise(resolve => setTimeout(resolve, 150));

                const triggerEvent = (element, eventName, EventClass, options = {}) => {
                    try {
                        const event = new EventClass(eventName, { bubbles: true, cancelable: true, ...options });
                        element.dispatchEvent(event);
                        console.log(`Đã kích hoạt: ${eventName}`);
                    } catch (e) {}
                };

                try {
                    buttonElement.focus();
                    console.log("Đã kích hoạt: focus()");
                } catch (e) {}

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
                        console.log("Đã kích hoạt: setPointerCapture()");
                    }
                } catch (e) {}

                try {
                    if (typeof buttonElement.releasePointerCapture === "function") {
                        buttonElement.releasePointerCapture(1);
                        console.log("Đã kích hoạt: releasePointerCapture()");
                    }
                } catch (e) {}

                try {
                    buttonElement.click();
                    console.log("Đã kích hoạt: button.click()");
                } catch (e) {}

                try {
                    HTMLButtonElement.prototype.click.call(buttonElement);
                    console.log("Đã kích hoạt: HTMLButtonElement.prototype.click.call()");
                } catch (e) {}

                try {
                    HTMLElement.prototype.click.call(buttonElement);
                    console.log("Đã kích hoạt: HTMLElement.prototype.click.call()");
                } catch (e) {}

                const formElement = buttonElement.closest("form");
                if (formElement) {
                    try {
                        formElement.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
                        console.log("Đã kích hoạt: form submit event");
                    } catch (e) {}
                    try {
                        formElement.submit();
                        console.log("Đã kích hoạt: form.submit()");
                    } catch (e) {}
                }

                console.log("Hoàn thành.");

                setTimeout(() => {
                    isProcessing = false;
                }, 1000);

            } catch (error) {
                isProcessing = false;
            }
        };

        const observer = new MutationObserver(processQuestion);
        observer.observe(document.body, { childList: true, subtree: true });

        setInterval(processQuestion, 1000);

    } catch (error) {}
})();