(async () => {
    const DICT_URL = "https://raw.githubusercontent.com/ontopcommunity/tuvungvn/refs/heads/main/tuvungvn.txt";

    console.log("Đang tải từ điển...");

    const dictText = await fetch(DICT_URL).then(r => r.text());

    const dictionary = dictText
        .split(/\r?\n/)
        .map(v => v.trim())
        .filter(v => v && v.includes(" "));

    console.log("Đã tải", dictionary.length, "từ.");

    let lastQuestion = "";

    function randomWord(words) {
        return words[Math.floor(Math.random() * words.length)];
    }

    function process() {
        const wordElem = document.querySelector(
            "a.word-detail_wordDetailWord__1DYml"
        );

        const input = document.querySelector(
            "input.word-link-answer-input_input__L6PK2"
        );

        const button = document.querySelector("svg.lucide.lucide-send")?.closest("button");

        if (!wordElem || !input || !button) return;

        const current = wordElem.textContent.trim();

        if (!current || current === lastQuestion) return;

        const parts = current.split(/\s+/);

        if (parts.length < 2) return;

        const lastWord = parts[parts.length - 1].toLowerCase();

        const candidates = dictionary.filter(w => {
            const p = w.toLowerCase().split(/\s+/);
            return p[0] === lastWord;
        });

        if (!candidates.length) {
            console.log("Không tìm thấy từ bắt đầu bằng:", lastWord);
            lastQuestion = current;
            return;
        }

        const answer = randomWord(candidates);

        input.focus();
        input.value = answer;

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));

        console.log("Đã điền:", answer);

        setTimeout(() => {
            button.click();
            console.log("Đã gửi.");
        }, 200);

        lastQuestion = current;
    }

    const observer = new MutationObserver(() => {
        process();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    setInterval(process, 500);

    process();

    console.log("Bot đang chạy...");
})();