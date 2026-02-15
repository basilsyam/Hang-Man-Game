let allWordsData = {};
let chosenWord = "";
let wrongAttempts = 0;
const maxAttempts = 7;

const categorySelect = document.getElementById("category-select");
const lettersContainer = document.querySelector(".letters");
const hintDisplay = document.getElementById("hint-display");
const drawElement = document.querySelector(".hangman-draw");

// Load Data
fetch('words.json').then(res => res.json()).then(data => {
    allWordsData = data;
    Object.keys(data).forEach(cat => {
        let opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat.toUpperCase();
        categorySelect.appendChild(opt);
    });
});

// Create Keyboard
"abcdefghijklmnopqrstuvwxyz".split("").forEach(l => {
    let span = document.createElement("span");
    span.textContent = l.toUpperCase();
    span.className = 'letter-box';
    lettersContainer.appendChild(span);
});

// دالة بدء اللعبة مع التحقق
const startGame = () => {
    const selected = categorySelect.value;

    // --- التعديل هنا: التحقق من اختيار المجال ---
    if (selected === "" || selected === "الافتراضي") { // افترضت أن القيمة الافتراضية فارغة
        alert("الرجاء اختيار مجال البحث أولاً! ⚠️");
        return; 
    }
    // ------------------------------------------

    const pool = allWordsData[selected];
    const item = pool[Math.floor(Math.random() * pool.length)];
    
    chosenWord = item.word.toLowerCase();
    wrongAttempts = 0;
    
    drawElement.className = "hangman-draw"; 
    document.querySelectorAll(".letter-box").forEach(b => b.classList.remove("clicked"));
    document.getElementById("category-name").textContent = selected.toUpperCase();
    hintDisplay.innerHTML = `HINT: ${item.hint.toUpperCase()}`;
    
    const guessContainer = document.querySelector(".letters-guess");
    guessContainer.innerHTML = "";
    [...chosenWord].forEach(l => {
        let s = document.createElement("span");
        if (l === " ") s.className = "has-space";
        guessContainer.appendChild(s);
    });
    document.getElementById("game-popup").style.display = "none";
    lettersContainer.style.pointerEvents = "auto";
};

// تشغيل الدالة عند تغيير القائمة
categorySelect.onchange = startGame;

// Play Action
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("letter-box")) {
        // --- تعديل إضافي: منع اللعب قبل اختيار المجال ---
        if (!chosenWord) {
            alert("اختار المجال أولاً عشان تبدأ اللعب! 😊");
            return;
        }
        // ------------------------------------------

        if (e.target.classList.contains("clicked")) return; // منع تكرار الضغط

        e.target.classList.add("clicked");
        let char = e.target.textContent.toLowerCase();
        let found = false;

        [...chosenWord].forEach((l, i) => {
            if (l === char) {
                found = true;
                document.querySelectorAll(".letters-guess span")[i].textContent = char;
            }
        });

        if (!found) {
            wrongAttempts++;
            drawElement.classList.add(`wrong-${wrongAttempts}`);
            if (wrongAttempts === maxAttempts) showEnd(false);
        } else {
            const spans = document.querySelectorAll(".letters-guess span");
            const isWin = [...spans].every(s => s.textContent !== "" || s.classList.contains("has-space"));
            if (isWin) showEnd(true);
        }
    }
});

function showEnd(win) {
    lettersContainer.style.pointerEvents = "none";
    document.getElementById("popup-title").textContent = win ? "VICTORY! 🎉" : "GAME OVER! 💀";
    document.getElementById("popup-message").textContent = win ? "Excellent Choice!" : `WORD WAS: ${chosenWord.toUpperCase()}`;
    document.getElementById("game-popup").style.display = "flex";
}

// تعديل زر العودة ليعمل مع التحقق
document.getElementById("play-again").onclick = () => {
    startGame();
};