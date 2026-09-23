// ==UserScript==
// @name         Noitu.fun Auto Multi-Acc
// @namespace    https://github.com/ontopcommunity/tuvungvn
// @version      4.0.0
// @description  Auto rank Ngẫu nhiên, cày nối từ, multi-acc LV2, tạo acc API — viết lại sạch
// @author       ontopcommunity
// @match        https://www.noitu.fun/*
// @match        https://noitu.fun/*
// @icon         https://www.noitu.fun/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(async function () {
  "use strict";

  if (window.__NOITU_AUTO_V4__) return;
  window.__NOITU_AUTO_V4__ = true;

  const API = "https://api.noitu.fun/api/v1";
  const DICT_URL = "https://raw.githubusercontent.com/ontopcommunity/tuvungvn/main/filtered_words.txt";
  const DICT_FALLBACK = "https://raw.githubusercontent.com/ontopcommunity/tuvungvn/refs/heads/main/tuvungvn.txt";
  const SUGGEST = "https://dictionaryvip.vercel.app/api/v1/suggest?q=";
  const TARGET_LV = 2;
  const ACC_KEY = "noitu_bot_accounts_v4";
  const ACTIVE_KEY = "noitu_bot_active_v4";

  // Mode Ngẫu nhiên (class từ tool.js gốc)
  const MODE_CLASSES = [
    "multiple-mode-lobby_rankedBtnRandom__c1EwH",
    "ranked-lobby_rankCardRandom__Br_il",
  ];
  const MODE_TITLE = "ngẫu nhiên";

  // Card xếp hạng (user)
  const RANK_SELS = [
    "div.main:nth-of-type(4) > div.main-center > div.page_mainContent__NQxPz:nth-of-type(1) > div.page_modeGridWrapper__J8Eq9:nth-of-type(3) > div.page_modeGrid__nPjbC > a.page_modeCard__bzgue.page_modeCoral__HD18C:nth-of-type(2)",
    "a.page_modeCard__bzgue.page_modeCoral__HD18C",
    "a[class*='modeCoral']",
  ];

  let dictionary = [];
  let byFirst = Object.create(null);
  let apiCache = new Map();
  let usedAnswers = new Set();
  let currentQuestion = "";
  let running = true;
  let busy = false;
  let lastLobbyClick = 0;
  let rankEntered = false;
  let accounts = [];
  let activeCode = null;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const st = window.getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden" || st.opacity === "0") return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;
    return true;
  }

  function hardClick(el) {
    if (!el || !isVisible(el)) return false;
    const fire = (T, type, extra) => {
      try {
        el.dispatchEvent(new T(type, { bubbles: true, cancelable: true, view: window, ...extra }));
      } catch (_) {}
    };
    ["pointerover", "pointerdown", "pointerup"].forEach((t) => fire(PointerEvent, t));
    ["mouseover", "mousedown", "mouseup", "click"].forEach((t) => fire(MouseEvent, t));
    try {
      el.click();
    } catch (_) {}
    try {
      HTMLElement.prototype.click.call(el);
    } catch (_) {}
    return true;
  }

  function inGame() {
    return !!(
      document.querySelector("input.word-link-answer-input_input__L6PK2") ||
      document.querySelector("a.word-detail_wordDetailWord__1DYml") ||
      document.querySelector("button.police-answer-input_wordButton__P3fhW") ||
      document.querySelector("input.va-tu-answer-input_input__N9YZm") ||
      document.querySelector(".stick-answer-input_character__N56_X")
    );
  }

  // ── storage ──
  function loadAcc() {
    try {
      accounts = JSON.parse(localStorage.getItem(ACC_KEY) || "[]");
    } catch {
      accounts = [];
    }
    activeCode = localStorage.getItem(ACTIVE_KEY) || (accounts[0] && accounts[0].code) || null;
  }
  function saveAcc() {
    localStorage.setItem(ACC_KEY, JSON.stringify(accounts));
    if (activeCode) localStorage.setItem(ACTIVE_KEY, activeCode);
  }
  function upsert(acc) {
    const i = accounts.findIndex((a) => a.code === acc.code);
    if (i >= 0) accounts[i] = { ...accounts[i], ...acc };
    else accounts.push(acc);
    saveAcc();
    renderList();
  }
  function getActive() {
    return accounts.find((a) => a.code === activeCode) || accounts[0] || null;
  }
  function applyToken(acc) {
    if (!acc) return;
    try {
      localStorage.setItem("accessToken", acc.accessToken);
      localStorage.setItem("token", acc.accessToken);
      localStorage.setItem("refreshToken", acc.refreshToken || "");
      localStorage.setItem("userCode", acc.code);
      localStorage.setItem("code", acc.code);
      sessionStorage.setItem("accessToken", acc.accessToken);
    } catch (_) {}
  }
  async function switchAcc(acc) {
    activeCode = acc.code;
    saveAcc();
    applyToken(acc);
    usedAnswers.clear();
    currentQuestion = "";
    rankEntered = false;
    setStatus("Acc: " + (acc.name || acc.code).slice(0, 20));
    renderList();
  }

  // ── API ──
  async function apiCreate() {
    const r = await fetch(API + "/user/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: null, code: null }),
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }
  async function apiUser(code, token) {
    const r = await fetch(API + "/user/get?code=" + encodeURIComponent(code), {
      headers: { Authorization: "Bearer " + token },
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }

  // ── dictionary ──
  async function loadDict() {
    for (const url of [DICT_URL, DICT_FALLBACK]) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        const text = await r.text();
        dictionary = text
          .split("\n")
          .map((l) => l.trim().toLowerCase())
          .filter((w) => w.includes(" "));
        byFirst = Object.create(null);
        for (const w of dictionary) {
          const f = w.split(/\s+/)[0];
          (byFirst[f] || (byFirst[f] = [])).push(w);
        }
        setStatus("Từ điển: " + dictionary.length);
        return;
      } catch (_) {}
    }
    setStatus("Không tải được từ điển");
  }

  async function suggest(q) {
    const key = (q || "").toLowerCase();
    if (!key) return [];
    if (apiCache.has(key)) return apiCache.get(key);
    try {
      const r = await fetch(SUGGEST + encodeURIComponent(key), { mode: "cors" });
      if (!r.ok) {
        apiCache.set(key, []);
        return [];
      }
      let data;
      try {
        data = await r.json();
      } catch {
        const t = await r.text();
        const m = t.match(/\{[\s\S]*\}/);
        data = m ? JSON.parse(m[0]) : null;
      }
      let list = [];
      if (data && Array.isArray(data.suggestions)) list = data.suggestions;
      else if (Array.isArray(data)) list = data;
      list = list
        .map((s) => String(s).trim().toLowerCase())
        .filter((s) => s.split(/\s+/).length >= 2);
      apiCache.set(key, list);
      return list;
    } catch {
      apiCache.set(key, []);
      return [];
    }
  }

  // ── UI ──
  function setStatus(msg) {
    const el = document.getElementById("na-status");
    if (el) el.textContent = msg;
  }

  function renderList() {
    const box = document.getElementById("na-list");
    if (!box) return;
    if (!accounts.length) {
      box.innerHTML = '<div style="padding:10px;color:#666;text-align:center">Chưa có acc</div>';
      return;
    }
    box.innerHTML = accounts
      .map((a) => {
        const done = (parseInt(a.level) || 1) >= TARGET_LV;
        const on = a.code === activeCode;
        const col = done ? "#0f0" : on ? "#0ff" : "#ccc";
        return `<div data-c="${a.code}" style="padding:6px 8px;border-bottom:1px solid #2a2a2a;cursor:pointer;color:${col};font-size:12px">
          <b>${(a.name || a.code).slice(0, 16)}</b>
          <span style="float:right">lv${a.level || 1} xp${a.xp || 0}</span>
        </div>`;
      })
      .join("");
    box.querySelectorAll("[data-c]").forEach((el) => {
      el.onclick = () => {
        const a = accounts.find((x) => x.code === el.getAttribute("data-c"));
        if (a) switchAcc(a);
      };
    });
  }

  function buildUI() {
    const old = document.getElementById("noitu-auto-v4");
    if (old) old.remove();

    const css = document.createElement("style");
    css.textContent = `
      #noitu-auto-v4 {
        position: fixed; top: 12px; right: 12px; width: 280px; z-index: 2147483646;
        background: rgba(14,14,20,.96); color: #eee; border-radius: 10px;
        border: 1px solid #333; font-family: system-ui,sans-serif;
        box-shadow: 0 8px 28px rgba(0,0,0,.45); overflow: hidden;
      }
      #noitu-auto-v4 .hd {
        padding: 9px 12px; font-weight: 700; font-size: 13px; color: #0ff;
        background: linear-gradient(90deg,#0ff2,#f0f2); cursor: move;
        border-bottom: 1px solid #333;
      }
      #noitu-auto-v4 .row { display: flex; gap: 6px; padding: 8px; flex-wrap: wrap; }
      #noitu-auto-v4 button {
        flex: 1; min-width: 72px; padding: 7px; border: 0; border-radius: 6px;
        background: #222; color: #0ff; cursor: pointer; font-size: 11px; font-weight: 600;
      }
      #noitu-auto-v4 button:hover { background: #333; }
      #na-list { max-height: 200px; overflow-y: auto; border-top: 1px solid #333; }
      #na-status { padding: 7px 10px; font-size: 11px; color: #8f8; border-top: 1px solid #333; }
    `;
    document.head.appendChild(css);

    const panel = document.createElement("div");
    panel.id = "noitu-auto-v4";
    panel.innerHTML = `
      <div class="hd">Noitu Auto · Ngẫu nhiên · LV${TARGET_LV}</div>
      <div class="row">
        <button id="na-toggle">⏹ Dừng</button>
        <button id="na-create">+ Tạo acc</button>
        <button id="na-rank">Vào rank</button>
      </div>
      <div id="na-list"></div>
      <div id="na-status">Đang tải…</div>
    `;
    document.body.appendChild(panel);

    // drag
    const hd = panel.querySelector(".hd");
    let drag = false,
      ox = 0,
      oy = 0;
    hd.onmousedown = (e) => {
      drag = true;
      ox = e.clientX - panel.getBoundingClientRect().left;
      oy = e.clientY - panel.getBoundingClientRect().top;
    };
    document.addEventListener("mousemove", (e) => {
      if (!drag) return;
      panel.style.right = "auto";
      panel.style.left = e.clientX - ox + "px";
      panel.style.top = e.clientY - oy + "px";
    });
    document.addEventListener("mouseup", () => {
      drag = false;
    });

    document.getElementById("na-toggle").onclick = (ev) => {
      running = !running;
      ev.target.textContent = running ? "⏹ Dừng" : "▶ Chạy";
      setStatus(running ? "Đang chạy · Ngẫu nhiên" : "Đã dừng");
    };
    document.getElementById("na-create").onclick = async () => {
      try {
        setStatus("Đang tạo acc…");
        const d = await apiCreate();
        const acc = {
          code: d.code,
          accessToken: d.accessToken,
          refreshToken: d.refreshToken,
          name: d.name || "",
          level: String(d.level || 1),
          xp: "0",
        };
        upsert(acc);
        await switchAcc(acc);
        setStatus("Tạo OK: " + acc.code.slice(-12));
      } catch (e) {
        setStatus("Tạo lỗi: " + e.message);
      }
    };
    document.getElementById("na-rank").onclick = () => {
      rankEntered = false;
      tryEnterRank();
    };

    renderList();
  }

  // ── rank entry (1 lần khi thấy nút) ──
  function tryEnterRank() {
    if (rankEntered || inGame()) return false;
    for (const sel of RANK_SELS) {
      const el = document.querySelector(sel);
      if (isVisible(el)) {
        hardClick(el);
        rankEntered = true;
        setStatus("Đã vào xếp hạng");
        return true;
      }
    }
    return false;
  }

  // ── lobby: chỉ bấm Ngẫu nhiên khi thấy & ngoài ván ──
  function tryLobbyMode() {
    if (!running || inGame()) return;
    if (Date.now() - lastLobbyClick < 1500) return;

    let btn = null;
    for (const cls of MODE_CLASSES) {
      const el = document.querySelector("." + cls);
      if (isVisible(el)) {
        btn = el;
        break;
      }
    }
    if (!btn) {
      btn = [...document.querySelectorAll("button, a, div[role=button], [class*=rank], [class*=lobby]")].find(
        (b) => isVisible(b) && (b.textContent || "").trim().toLowerCase() === MODE_TITLE
      );
    }
    if (btn && isVisible(btn)) {
      hardClick(btn);
      lastLobbyClick = Date.now();
      setStatus("Queue: Ngẫu nhiên");
    }
  }

  // ── trả lời nối từ (logic tool.js) ──
  async function answerWordLink() {
    const wordEl = document.querySelector("a.word-detail_wordDetailWord__1DYml");
    const inputEl = document.querySelector("input.word-link-answer-input_input__L6PK2");
    const svg = document.querySelector("svg.lucide-send, svg.lucide.lucide-send");
    if (!wordEl || !inputEl || !isVisible(inputEl)) return;

    const q = (wordEl.textContent || "").trim();
    if (!q) return;
    if (q !== currentQuestion) {
      currentQuestion = q;
      usedAnswers.clear();
    }

    const last = q.split(/\s+/).pop().toLowerCase();
    let pool = (byFirst[last] || []).filter((w) => !usedAnswers.has(w));
    if (!pool.length) {
      const api = await suggest(last);
      pool = api.filter((p) => p.split(/\s+/)[0] === last && !usedAnswers.has(p));
    }
    if (!pool.length) return;

    const ans = pool[Math.floor(Math.random() * pool.length)];
    usedAnswers.add(ans);

    inputEl.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(inputEl, ans);
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));

    const sendBtn = svg ? svg.closest("button") : null;
    if (sendBtn && isVisible(sendBtn)) hardClick(sendBtn);
    else {
      inputEl.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true })
      );
    }
    setStatus("→ " + ans.slice(0, 28));
  }

  // ── police / va-tu đơn giản (có thì trả) ──
  async function answerExtras() {
    const police = [...document.querySelectorAll("button.police-answer-input_wordButton__P3fhW")];
    if (police.length) {
      for (const btn of police) {
        if (!isVisible(btn)) continue;
        const t = (
          btn.querySelector(".police-answer-input_wordText__lEN0Q")?.textContent ||
          btn.textContent ||
          ""
        )
          .trim()
          .toLowerCase();
        if (dictionary.includes(t)) {
          hardClick(btn);
          return;
        }
      }
    }
  }

  async function tick() {
    if (!running || busy) return;
    busy = true;
    try {
      if (!inGame()) {
        tryEnterRank();
        tryLobbyMode();
      } else {
        await answerWordLink();
        await answerExtras();
      }
    } catch (_) {}
    busy = false;
  }

  // ── level / xoay acc ──
  async function levelLoop() {
    while (true) {
      await sleep(12000);
      if (!running) continue;
      const acc = getActive();
      if (!acc || !acc.accessToken) continue;
      try {
        const u = await apiUser(acc.code, acc.accessToken);
        acc.level = String(u.level ?? acc.level);
        acc.xp = String(u.experiencePoints ?? 0);
        acc.name = u.name || acc.name;
        upsert(acc);
        if ((parseInt(acc.level) || 1) >= TARGET_LV) {
          const next = accounts.find((a) => (parseInt(a.level) || 1) < TARGET_LV);
          if (next && next.code !== acc.code) {
            await switchAcc(next);
            setStatus("Xoay acc → " + (next.name || next.code).slice(0, 14));
          } else if (!next) {
            setStatus("Tất cả acc ≥ lv" + TARGET_LV);
          }
        }
      } catch (_) {}
    }
  }

  // ── boot ──
  loadAcc();
  buildUI();
  await loadDict();

  if (!accounts.length) {
    try {
      const d = await apiCreate();
      upsert({
        code: d.code,
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
        name: d.name || "",
        level: String(d.level || 1),
        xp: "0",
      });
      activeCode = d.code;
      saveAcc();
      applyToken(accounts[0]);
    } catch (e) {
      setStatus("Bấm + Tạo acc (" + e.message + ")");
    }
  } else {
    const a = getActive();
    if (a) applyToken(a);
  }

  setStatus("Chạy · mode Ngẫu nhiên");
  setInterval(tick, 80);
  new MutationObserver(() => {
    if (running) tick();
  }).observe(document.body, { childList: true, subtree: true });
  levelLoop();
})();
