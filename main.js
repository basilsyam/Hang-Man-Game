let allWordsData = {};
let chosenWord = "";
let wrongAttempts = 0;
const maxAttempts = 7;
let score = 0;
let highScore = localStorage.getItem("hangmanHighScore") || 0;
let hintsUsed = 0; // عداد التلميحات للكلمة الواحدة

// تحديث عرض الـ High Score عند التحميل
document.getElementById("high-score").textContent = highScore;

// تعريف عناصر الصوت
const correctSnd = document.getElementById("sound-correct");
const wrongSnd = document.getElementById("sound-wrong");
const winSnd = document.getElementById("sound-win");
const loseSnd = document.getElementById("sound-lose");

// عناصر DOM
const categorySelect = document.getElementById("category-select");
const lettersContainer = document.querySelector(".letters");
const hintDisplay = document.getElementById("hint-display");
const drawElement = document.querySelector(".hangman-draw");
const welcomePopup = document.getElementById("welcome-popup");
const startBtn = document.getElementById("start-btn");
const skipBtn = document.getElementById("skip-word");
const hintBtn = document.getElementById("get-hint");
const gamePopup = document.getElementById("game-popup");
const scoreDisplay = document.getElementById("current-score");
const highScoreDisplay = document.getElementById("high-score");
const alertPopup = document.getElementById("alert-popup");
const closeAlert = document.getElementById("close-alert");

// إغلاق نافذة الترحيب وتفعيل الأصوات
startBtn.onclick = () => { 
    welcomePopup.style.display = "none";
    [correctSnd, wrongSnd, winSnd, loseSnd].forEach(snd => {
        snd.muted = true;
        snd.play().then(() => {
            snd.pause();
            snd.currentTime = 0;
            snd.muted = false;
        }).catch(e => console.log("Audio ready"));
    });
};

closeAlert.onclick = () => { alertPopup.style.display = "none"; };

// تحميل البيانات
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

// إنشاء الكيبورد
"abcdefghijklmnopqrstuvwxyz".split("").forEach(l => {
    let span = document.createElement("span");
    span.textContent = l.toUpperCase();
    span.className = 'letter-box';
    lettersContainer.appendChild(span);
});

// دالة بدء اللعبة
const startGame = () => {
    const selected = categorySelect.value;
    if (!selected) return;

    hintsUsed = 0; // تصفير التلميحات
    skipBtn.style.display = "inline-block";
    hintBtn.style.display = "inline-block";
    
    const pool = allWordsData[selected];
    const item = pool[Math.floor(Math.random() * pool.length)];
    
    chosenWord = item.word.toLowerCase();
    wrongAttempts = 0;
    
    // تصفير الرسم تماماً
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
    alertPopup.style.display = "none";
    lettersContainer.style.pointerEvents = "auto";
};

categorySelect.onchange = startGame;
skipBtn.onclick = () => { if (categorySelect.value) startGame(); };

// منطق زر التلميح (مرتين فقط)
hintBtn.onclick = () => {
    if (hintsUsed >= 2) {
        alert("لقد استنفدت التلميحات المتاحة لهذه الكلمة!");
        return;
    }
    if (score < 30) {
        alert("تحتاج إلى 30 نقطة على الأقل!");
        return;
    }

    const guessSpans = document.querySelectorAll(".letters-guess span");
    let hiddenIndices = [];
    [...chosenWord].forEach((char, index) => {
        if (guessSpans[index].textContent === "" && char !== " ") {
            hiddenIndices.push(index);
        }
    });

    if (hiddenIndices.length > 0) {
        score -= 30;
        hintsUsed++;
        updateScores();
        let randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
        let revealedChar = chosenWord[randomIndex];
        [...chosenWord].forEach((l, i) => {
            if (l === revealedChar) guessSpans[i].textContent = revealedChar;
        });
        document.querySelectorAll(".letter-box").forEach(box => {
            if (box.textContent.toLowerCase() === revealedChar) box.classList.add("clicked");
        });
        const isWin = [...guessSpans].every(s => s.textContent !== "" || s.classList.contains("has-space"));
        if (isWin) { launchConfetti(); showEnd(true); }
    }
};

// منطق الضغط على الحروف
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("letter-box")) {
        if (!chosenWord) { alertPopup.style.display = "flex"; return; }
        if (e.target.classList.contains("clicked")) return;

        e.target.classList.add("clicked");
        let char = e.target.textContent.toLowerCase();
        let found = false;
        const guessSpans = document.querySelectorAll(".letters-guess span");
        
        [...chosenWord].forEach((l, i) => {
            if (l === char) {
                found = true;
                guessSpans[i].textContent = char;
            }
        });

        if (found) {
            correctSnd.currentTime = 0;
            correctSnd.play().catch(() => {});
            const isWin = [...guessSpans].every(s => s.textContent !== "" || s.classList.contains("has-space"));
            if (isWin) {
                score += 100;
                updateScores();
                launchConfetti(); 
                showEnd(true);
            }
        } else {
            drawElement.classList.remove("shake");
            void drawElement.offsetWidth; 
            drawElement.classList.add("shake");

            wrongSnd.volume = 0.2;
            wrongSnd.currentTime = 0;
            wrongSnd.play().catch(() => {});

            wrongAttempts++;
            drawElement.classList.add(`wrong-${wrongAttempts}`);
            if (wrongAttempts === maxAttempts) {
                score = 0;
                updateScores();
                showEnd(false);
            }
        }
    }
});

function updateScores() {
    scoreDisplay.textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("hangmanHighScore", highScore);
        highScoreDisplay.textContent = highScore;
    }
}

function launchConfetti() {
    const colors = ['#6a8bf6', '#f45e56', '#ffd700', '#2ecc71', '#9b59b6'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

function showEnd(win) {
    lettersContainer.style.pointerEvents = "none";
    if (win) {
        winSnd.currentTime = 0; winSnd.play().catch(() => {});
        document.getElementById("popup-title").textContent = "VICTORY! 🎉";
        document.getElementById("popup-message").textContent = `Great Job! Your Score: ${score}`;
    } else {
        loseSnd.currentTime = 0; loseSnd.play().catch(() => {});
        document.getElementById("popup-title").textContent = "GAME OVER! 💀";
        document.getElementById("popup-message").textContent = `THE WORD WAS: ${chosenWord.toUpperCase()}`;
    }
    gamePopup.style.display = "flex";
}

document.getElementById("play-again").onclick = startGame;