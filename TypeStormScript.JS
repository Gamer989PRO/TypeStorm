// ====================== TYPESTORM ULTIMATE FINAL BOSS ======================

// ---------------------- GLOBAL STATE ----------------------
const TS = {
    text: "",
    chars: [],
    words: [],
    wordMap: [],
    charIndex: 0,
    wordIndex: 0,

    correct: 0,
    incorrect: 0,

    streak: 0,
    maxStreak: 0,
    multiplier: 1,

    started: false,
    finished: false,

    duration: 60,
    timeLeft: 60,
    timer: null,
    startTime: null,

    mistakeChain: 0
};

// ---------------------- CONFIG ----------------------
const CFG = {
    baseWords: 10,
    difficultyRamp: 0.15,
    streakStep: 5,
    maxMultiplier: 5,
    timeBonus: 3,
    timePenalty: 2,
    punctuationChance: 0.25,
    capitalChance: 0.12,
    wordList: [
        "storm", "lightning", "cloud", "wind", "rain", "thunder", "sky", "bolt", "flash",
        "dynamic", "typing", "speed", "accuracy", "keyboard", "challenge", "focus", "flow",
        "practice", "energy", "power", "dedication", "passion", "combo", "multiplier",
        "consistent", "precision", "velocity", "momentum", "discipline", "mastery",
        "celebrate", "birthday", "gift", "dream", "project", "spark", "blast", "shine"
    ],
    punctuation: [".", ",", "!", "?", ";"]
};

// ---------------------- SOUND ----------------------
const Sounds = {
    correct: new Audio("https://freesound.org/data/previews/66/66717_931655-lq.mp3"),
    incorrect: new Audio("https://freesound.org/data/previews/33/33749_27070-lq.mp3"),
    streak: new Audio("https://freesound.org/data/previews/146/146726_2615114-lq.mp3")
};

// ---------------------- UTILS ----------------------
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (p) => Math.random() < p;

// ---------------------- SPARK EFFECT ----------------------
function comboSpark(x = window.innerWidth / 2, y = 120) {
    const colors = ["#ff4757", "#ffa502", "#1e90ff", "#2ed573", "#eccc68"];
    for (let i = 0; i < 16; i++) {
        const spark = document.createElement("span");
        spark.textContent = "✨";
        spark.style.position = "fixed";
        spark.style.left = x + "px";
        spark.style.top = y + "px";
        spark.style.fontSize = rand(14, 22) + "px";
        spark.style.pointerEvents = "none";
        spark.style.zIndex = "9999";
        spark.style.color = colors[rand(0, colors.length - 1)];

        const angle = Math.random() * Math.PI * 2;
        const distance = rand(40, 120);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        spark.animate(
            [
                { transform: "translate(0,0) scale(1)", opacity: 1 },
                { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0 }
            ],
            { duration: 700, easing: "ease-out" }
        );

        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 700);
    }
}

// ---------------------- PARAGRAPH GENERATION ----------------------
function generateParagraph() {
    const scale = 1 + ((TS.duration - TS.timeLeft) / TS.duration) * CFG.difficultyRamp;
    const wordCount = Math.floor(CFG.baseWords * scale) + rand(5, 10);
    const words = [];
    for (let i = 0; i < wordCount; i++) {
        let w = CFG.wordList[rand(0, CFG.wordList.length - 1)];
        if (chance(CFG.capitalChance)) w = w[0].toUpperCase() + w.slice(1);
        if (chance(CFG.punctuationChance) && i !== wordCount - 1) w += CFG.punctuation[rand(0, CFG.punctuation.length - 1)];
        words.push(w);
    }
    return words.join(" ");
}

// ---------------------- LOAD / RESET ----------------------
function loadParagraph() {
    clearInterval(TS.timer);

    TS.text = generateParagraph();
    TS.chars = TS.text.split("");
    TS.words = TS.text.split(" ");

    TS.wordMap = [];
    let wi = 0;
    TS.chars.forEach(c => { TS.wordMap.push(wi); if (c === " ") wi++; });

    TS.charIndex = 0;
    TS.wordIndex = 0;
    TS.correct = 0;
    TS.incorrect = 0;
    TS.streak = 0;
    TS.maxStreak = 0;
    TS.multiplier = 1;
    TS.mistakeChain = 0;

    TS.started = false;
    TS.finished = false;
    TS.timeLeft = TS.duration;
    TS.startTime = null;

    document.getElementById("time").textContent = TS.timeLeft;
    document.getElementById("wpm").textContent = 0;
    document.getElementById("accuracy").textContent = 100;

    renderText();
    hideSummary();
}

// ---------------------- RENDER TEXT ----------------------
function renderText() {
    const el = document.getElementById("text");
    el.innerHTML = "";
    TS.chars.forEach((c, i) => {
        const span = document.createElement("span");
        span.textContent = c;
        span.classList.add("char");
        if (i === 0) span.classList.add("active");
        el.appendChild(span);
    });
    highlightWord();
}

// ---------------------- WORD HIGHLIGHT ----------------------
function highlightWord() {
    const spans = document.querySelectorAll(".char");
    spans.forEach(s => s.classList.remove("word-active"));
    spans.forEach((s, i) => {
        if (TS.wordMap[i] === TS.wordIndex) s.classList.add("word-active");
    });
}

// ---------------------- ACTIVE CHARACTER ----------------------
function setActiveChar() {
    const spans = document.querySelectorAll(".char");
    spans.forEach(s => s.classList.remove("active"));
    if (TS.charIndex < spans.length) spans[TS.charIndex].classList.add("active");
    TS.wordIndex = TS.wordMap[TS.charIndex] || TS.wordIndex;
    highlightWord();
}

// ---------------------- TIMER ----------------------
function startTimer() {
    TS.startTime = performance.now();
    TS.timer = setInterval(() => {
        TS.timeLeft--;
        document.getElementById("time").textContent = TS.timeLeft;
        updateStats();
        if (TS.timeLeft <= 0) finish();
    }, 1000);
}

// ---------------------- STATS ----------------------
function updateStats() {
    if (!TS.startTime) return;
    const minutes = (performance.now() - TS.startTime) / 60000;
    if (minutes <= 0) return;

    const rawWPM = (TS.correct / 5) / minutes;
    TS.multiplier = Math.min(Math.floor(TS.streak / CFG.streakStep) + 1, CFG.maxMultiplier);
    const wpm = Math.round(rawWPM * TS.multiplier);
    const acc = (TS.correct + TS.incorrect === 0) ? 100 : Math.round((TS.correct / (TS.correct + TS.incorrect)) * 100);

    document.getElementById("wpm").textContent = wpm;
    document.getElementById("accuracy").textContent = acc;
}

// ---------------------- FINISH ----------------------
function finish() {
    TS.finished = true;
    clearInterval(TS.timer);
    updateStats();
    saveSession();
    showSummary();
}

// ---------------------- SAVE SESSION ----------------------
function saveSession() {
    const wpm = parseInt(document.getElementById("wpm").textContent);
    const acc = parseInt(document.getElementById("accuracy").textContent);
    const now = new Date().getTime();

    let sessions = JSON.parse(localStorage.getItem("TSSessions") || "[]");
    sessions.push({ wpm, acc, time: now });
    localStorage.setItem("TSSessions", JSON.stringify(sessions));
}

// ---------------------- SUMMARY + LEADERBOARD + GRAPH ----------------------
function showSummary() {
    hideSummary();

    const summary = document.createElement("div");
    summary.id = "summary";
    summary.style.position = "absolute";
    summary.style.top = "10%";
    summary.style.left = "50%";
    summary.style.transform = "translateX(-50%)";
    summary.style.background = "rgba(0,0,0,0.95)";
    summary.style.color = "white";
    summary.style.padding = "20px 40px";
    summary.style.borderRadius = "10px";
    summary.style.fontSize = "16px";
    summary.style.zIndex = "100";
    summary.style.textAlign = "center";
    summary.style.minWidth = "300px";
    summary.style.maxHeight = "70%";
    summary.style.overflowY = "auto";

    const wpm = parseInt(document.getElementById("wpm").textContent);
    const acc = parseInt(document.getElementById("accuracy").textContent);

    const sessions = JSON.parse(localStorage.getItem("TSSessions") || "[]");

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfDay - (now.getDay() * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const filterBest = (start) => sessions.filter(s => s.time >= start).map(s => s.wpm);
    const allTimeBest = Math.max(...sessions.map(s => s.wpm), 0);
    const todayBest = Math.max(...filterBest(startOfDay), 0);
    const weekBest = Math.max(...filterBest(startOfWeek), 0);
    const monthBest = Math.max(...filterBest(startOfMonth), 0);
    const yearBest = Math.max(...filterBest(startOfYear), 0);

    summary.innerHTML = `
    <button id="closeSummary" style="position:absolute;top:5px;right:8px;background:transparent;color:white;border:none;font-size:20px;cursor:pointer;">✖</button>
    <h2>✅ Summary</h2>
    <p>WPM: ${wpm}</p>
    <p>Accuracy: ${acc}%</p>
    <p>Max Streak: ${TS.maxStreak}</p>
    <p>Multiplier: x${TS.multiplier}</p>
    <p>Correct: ${TS.correct}</p>
    <p>Incorrect: ${TS.incorrect}</p>
    <h3>🏆 Leaderboard</h3>
    <p>Today Best: ${todayBest}</p>
    <p>This Week Best: ${weekBest}</p>
    <p>This Month Best: ${monthBest}</p>
    <p>This Year Best: ${yearBest}</p>
    <p>All-Time Best: ${allTimeBest}</p>
  `;
    document.body.appendChild(summary);

    document.getElementById("closeSummary").addEventListener("click", () => { summary.remove(); });

    // ---------------------- WPM MINI GRAPH ----------------------
    const graphTitle = document.createElement("h3");
    graphTitle.textContent = "📈 WPM Over Time";
    summary.appendChild(graphTitle);

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 100;
    summary.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const recent = sessions.slice(-20);
    const maxWPM = Math.max(...recent.map(s => s.wpm), 50);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#00ffea";
    ctx.lineWidth = 2;
    ctx.beginPath();

    recent.forEach((s, i) => {
        const x = (i / (recent.length - 1)) * canvas.width;
        const y = canvas.height - (s.wpm / maxWPM) * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Firework on best point
    const best = recent.reduce((a, b) => b.wpm > a.wpm ? b : a, recent[0]);
    const bestIndex = recent.indexOf(best);
    if (best) {
        const bx = (bestIndex / (recent.length - 1)) * canvas.width;
        const by = canvas.height - (best.wpm / maxWPM) * canvas.height;
        setTimeout(() => comboSpark(bx + canvas.getBoundingClientRect().left, by + canvas.getBoundingClientRect().top), 300);
    }
}

// ---------------------- HIDE SUMMARY ----------------------
function hideSummary() {
    const existing = document.getElementById("summary");
    if (existing) existing.remove();
}

// ---------------------- INPUT HANDLER ----------------------
document.addEventListener("keydown", (e) => {
    if (TS.finished) return;
    if (e.key.length !== 1 && e.key !== "Backspace") return;
    const spans = document.querySelectorAll(".char");
    const expected = TS.chars[TS.charIndex];

    if (!TS.started) startTimer(), TS.started = true;

    // BACKSPACE
    if (e.key === "Backspace") {
        if (TS.charIndex === 0) return;
        TS.charIndex--;
        spans[TS.charIndex].classList.remove("correct", "incorrect");
        TS.streak = Math.max(0, TS.streak - 1);
        setActiveChar();
        updateStats();
        return;
    }

    // CORRECT
    if (e.key === expected) {
        spans[TS.charIndex].classList.add("correct");
        TS.correct++;
        TS.streak++;
        TS.mistakeChain = 0;
        TS.maxStreak = Math.max(TS.maxStreak, TS.streak);
        Sounds.correct.currentTime = 0; Sounds.correct.play();

        if (TS.streak % CFG.streakStep === 0) {
            TS.timeLeft += CFG.timeBonus;
            Sounds.streak.currentTime = 0; Sounds.streak.play();
            comboSpark();
        }
    }
    // INCORRECT
    else {
        spans[TS.charIndex].classList.add("incorrect");
        TS.incorrect++;
        TS.streak = 0;
        TS.mistakeChain++;
        Sounds.incorrect.currentTime = 0; Sounds.incorrect.play();

        if (TS.mistakeChain === 3) {
            TS.timeLeft = Math.max(0, TS.timeLeft - CFG.timePenalty);
            TS.mistakeChain = 0;
        }
    }

    TS.charIndex++;
    setActiveChar();
    updateStats();

    if (TS.charIndex >= TS.chars.length) finish();
});

// ---------------------- TIME BUTTONS ----------------------
document.querySelectorAll(".time-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        TS.duration = Number(btn.dataset.time);
        loadParagraph();
    });
});

// ---------------------- RESTART ----------------------
document.getElementById("restart").addEventListener("click", loadParagraph);

// ---------------------- INIT ----------------------
loadParagraph();
