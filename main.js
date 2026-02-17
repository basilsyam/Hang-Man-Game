let allWordsData = {};
let chosenWord = "";
let wrongAttempts = 0;
const maxAttempts = 7;
let score = 0;
let highScore = localStorage.getItem("hangmanHighScore") || 0;
let hintsUsed = 0;

document.getElementById("high-score").textContent = highScore;

const correctSnd = document.getElementById("sound-correct");
const wrongSnd = document.getElementById("sound-wrong");
const winSnd = document.getElementById("sound-win");
const loseSnd = document.getElementById("sound-lose");

const categorySelect = document.getElementById("category-select");
const lettersContainer = document.querySelector(".letters");
const hintDisplay = document.getElementById("hint-display");
const drawElement = document.querySelector(".hangman-draw");
const welcomePopup = document.getElementById("welcome-popup");
const startBtn = document.getElementById("start-btn");
const skipBtn = document.getElementById("skip-word");
const hintBtn = document.getElementById("get-hint");
const gamePopup = document.getElementById("game-popup");
const alertPopup = document.getElementById("alert-popup"); // بوب اب التنبيه
const scoreDisplay = document.getElementById("current-score");
const highScoreDisplay = document.getElementById("high-score");

// وظيفة لإظهار التنبيه
const showCategoryAlert = () => {
    alertPopup.style.display = "flex";
};

// Start Game Logic
startBtn.onclick = () => { 
    welcomePopup.style.display = "none";
    [correctSnd, wrongSnd, winSnd, loseSnd].forEach(snd => {
        snd.muted = true; 
        snd.play().then(() => { 
            snd.pause(); 
            snd.currentTime = 0; 
            snd.muted = false; 
        }).catch(() => {});
    });
};

fetch('words.json')
    .then(res => res.json())
    .then(data => {
        allWordsData = data;
        Object.keys(data).forEach(cat => {
            let opt = document.createElement("option");
            opt.value = cat; 
            opt.textContent = cat.toUpperCase();
            categorySelect.appendChild(opt);
        });
    });

"abcdefghijklmnopqrstuvwxyz".split("").forEach(l => {
    let span = document.createElement("span");
    span.textContent = l.toUpperCase();
    span.className = 'letter-box';
    lettersContainer.appendChild(span);
});

const startGame = () => {
    const selected = categorySelect.value;
    if (!selected) return;
    
    hintsUsed = 0;
    skipBtn.style.display = "inline-block";
    hintBtn.style.display = "inline-block";
    const pool = allWordsData[selected];
    const item = pool[Math.floor(Math.random() * pool.length)];
    chosenWord = item.word.toLowerCase();
    wrongAttempts = 0;
    drawElement.className = "hangman-draw"; 
    document.querySelectorAll(".letter-box").forEach(b => b.classList.remove("clicked"));
    document.getElementById("category-name").textContent = selected.toUpperCase();
    hintDisplay.innerHTML = `<span class="hint-text">HINT: ${item.hint.toUpperCase()}</span>`;
    
    const guessContainer = document.querySelector(".letters-guess");
    guessContainer.innerHTML = "";
    [...chosenWord].forEach(l => {
        let s = document.createElement("span");
        if (l === " ") s.className = "has-space";
        guessContainer.appendChild(s);
    });
    gamePopup.style.display = "none";
    lettersContainer.style.pointerEvents = "auto";
};

categorySelect.onchange = startGame;
skipBtn.onclick = () => { if (categorySelect.value) startGame(); else showCategoryAlert(); };

// Hint Logic
hintBtn.onclick = () => {
    if (!categorySelect.value) return showCategoryAlert();
    if (hintsUsed >= 2 || score < 30) return alert(score < 30 ? "Need 30 pts!" : "No more hints!");
    
    const guessSpans = document.querySelectorAll(".letters-guess span");
    let hiddenIndices = [...chosenWord].map((c, i) => guessSpans[i].textContent === "" && c !== " " ? i : null).filter(x => x !== null);
    
    if (hiddenIndices.length > 0) {
        score -= 30; hintsUsed++; updateScores();
        let revealedChar = chosenWord[hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)]];
        [...chosenWord].forEach((l, i) => { if (l === revealedChar) guessSpans[i].textContent = revealedChar; });
        document.querySelectorAll(".letter-box").forEach(box => { if (box.textContent.toLowerCase() === revealedChar) box.classList.add("clicked"); });
        checkWin(true);
    }
};

// Main Click Logic (Mouse)
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("letter-box")) {
        // التحقق من اختيار الفئة أولاً
        if (!categorySelect.value) {
            showCategoryAlert();
            return;
        }

        if (chosenWord && !e.target.classList.contains("clicked")) {
            e.target.classList.add("clicked");
            let char = e.target.textContent.toLowerCase();
            let found = false;
            const guessSpans = document.querySelectorAll(".letters-guess span");
            [...chosenWord].forEach((l, i) => { if (l === char) { found = true; guessSpans[i].textContent = char; }});
            
            if (found) {
                correctSnd.currentTime = 0; correctSnd.play().catch(() => {});
                checkWin();
            } else {
                handleWrong();
            }
        }
    }
});

// Keyboard Support
document.addEventListener("keydown", (e) => {
    if (gamePopup.style.display === "flex" || alertPopup.style.display === "flex") return;
    
    const key = e.key.toLowerCase();
    if (/^[a-z]$/.test(key)) {
        // التحقق من اختيار الفئة عند الضغط على الكيبورد
        if (!categorySelect.value) {
            showCategoryAlert();
            return;
        }

        const btn = [...document.querySelectorAll(".letter-box")].find(b => b.textContent.toLowerCase() === key && !b.classList.contains("clicked"));
        if (btn) btn.click();
    }
});

function handleWrong() {
    drawElement.classList.remove("shake"); 
    void drawElement.offsetWidth; 
    drawElement.classList.add("shake");
    wrongSnd.currentTime = 0; wrongSnd.play().catch(() => {});
    wrongAttempts++;
    drawElement.classList.add(`wrong-${wrongAttempts}`);
    if (wrongAttempts === maxAttempts) { score = 0; updateScores(); showEnd(false); }
}

function checkWin(fromHint = false) {
    const guessSpans = document.querySelectorAll(".letters-guess span");
    if ([...guessSpans].every(s => s.textContent !== "" || s.classList.contains("has-space"))) {
        if (!fromHint) score += 100;
        updateScores(); launchConfetti(); showEnd(true);
    }
}

function updateScores() {
    scoreDisplay.textContent = score;
    if (score > highScore) { 
        highScore = score; 
        localStorage.setItem("hangmanHighScore", highScore); 
        highScoreDisplay.textContent = highScore; 
    }
}

function showEnd(win) {
    lettersContainer.style.pointerEvents = "none";
    const msgs = win ? ["VICTORY! 🎉", "GENIUS! 🔥"] : ["GAME OVER! 💀", "SO CLOSE! 🤏"];
    document.getElementById("popup-title").textContent = msgs[Math.floor(Math.random()*msgs.length)];
    if (!win) {
        loseSnd.play();
        const spans = document.querySelectorAll(".letters-guess span");
        [...chosenWord].forEach((c, i) => { 
            if (spans[i].textContent === "" && c !== " ") { 
                spans[i].textContent = c; 
                spans[i].style.color = "var(--accent-red)"; 
            }
        });
    } else { winSnd.play(); }
    document.getElementById("popup-message").textContent = win ? `Score: ${score}` : `Word: ${chosenWord.toUpperCase()}`;
    gamePopup.style.display = "flex";
}

function launchConfetti() {
    for (let i = 0; i < 40; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.backgroundColor = ['#6a8bf6','#f45e56','#ffd700'][Math.floor(Math.random()*3)];
        c.style.animationDuration = (Math.random()*2+1)+'s';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3000);
    }
}

document.getElementById("play-again").onclick = startGame;
document.getElementById("close-alert").onclick = () => alertPopup.style.display = "none";