// Конфигурация игры
const word = "дифференциал";
const letters = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const sectors = [
    { color: "#f1c40f", text: "100", value: 100 },
    { color: "#e67e22", text: "200", value: 200 },
    { color: "#e74c3c", text: "300", value: 300 },
    { color: "#9b59b6", text: "400", value: 400 },
    { color: "#3498db", text: "500", value: 500 },
    { color: "#1abc9c", text: "Приз", value: "prize" },
    { color: "#2ecc71", text: "x2", value: "x2" },
    { color: "#34495e", text: "Банкрот", value: "bankrupt" },
    { color: "#7f8c8d", text: "Пропуск", value: "skip" }
];

// Состояние игры
let gameState = {
    guessedLetters: [],
    mistakes: 0,
    maxMistakes: 7,
    score: 0,
    multiplier: 1,
    isSpinning: false,
    canGuess: false,
    currentSector: null,
    currentHighlight: null
};

// Элементы DOM
const elements = {
    wordDisplay: document.getElementById('wordDisplay'),
    keyboard: document.getElementById('keyboard'),
    status: document.getElementById('status'),
    restartBtn: document.getElementById('restartBtn'),
    wheel: document.getElementById('wheel'),
    sectorInfo: document.getElementById('sectorInfo'),
    sounds: {
        spin: document.getElementById('spinSound'),
        correct: document.getElementById('correctSound'),
        wrong: document.getElementById('wrongSound'),
        win: document.getElementById('winSound'),
        lose: document.getElementById('loseSound'),
        bankrupt: document.getElementById('bankruptSound'),
        x2: document.getElementById('x2Sound'),
        prize: document.getElementById('prizeSound')
    }
};

// Инициализация игры
function initGame() {
    gameState = {
        guessedLetters: [],
        mistakes: 0,
        score: 0,
        multiplier: 1,
        isSpinning: false,
        canGuess: false,
        currentSector: null,
        currentHighlight: null
    };
    
    createWheel();
    createKeyboard();
    updateGame();
    updateStatus("Крутите барабан!");
}

// Создание барабана
function createWheel() {
    elements.wheel.innerHTML = '';
    const center = 150;
    const radius = 150;
    const sectorAngle = 360 / sectors.length;
    
    sectors.forEach((sector, i) => {
        const startAngle = i * sectorAngle;
        const endAngle = (i + 1) * sectorAngle;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const x1 = center + radius * Math.cos(startAngle * Math.PI / 180);
        const y1 = center + radius * Math.sin(startAngle * Math.PI / 180);
        const x2 = center + radius * Math.cos(endAngle * Math.PI / 180);
        const y2 = center + radius * Math.sin(endAngle * Math.PI / 180);
        
        path.setAttribute("d", `M${center},${center} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`);
        path.setAttribute("fill", sector.color);
        elements.wheel.appendChild(path);
        
        const textAngle = startAngle + sectorAngle / 2;
        const textX = center + (radius * 0.6) * Math.cos(textAngle * Math.PI / 180);
        const textY = center + (radius * 0.6) * Math.sin(textAngle * Math.PI / 180);
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", textX);
        text.setAttribute("y", textY);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "white");
        text.setAttribute("font-size", "16");
        text.setAttribute("font-weight", "bold");
        text.textContent = sector.text;
        elements.wheel.appendChild(text);
    });
    
    elements.wheel.addEventListener('click', spinWheel);
}

// Создание клавиатуры
function createKeyboard() {
    elements.keyboard.innerHTML = '';
    
    const rows = [];
    for (let i = 0; i < letters.length; i += 10) {
        rows.push(letters.slice(i, i + 10));
    }
    
    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        row.split('').forEach(letter => {
            const button = document.createElement('button');
            button.className = 'letter-btn';
            button.textContent = letter.toUpperCase();
            
            button.addEventListener('click', () => handleGuess(letter));
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.classList.add('active');
                handleGuess(letter);
            }, { passive: false });
            
            button.addEventListener('touchend', () => {
                button.classList.remove('active');
            });
            
            rowDiv.appendChild(button);
        });
        
        elements.keyboard.appendChild(rowDiv);
    });
}

// Вращение барабана
function spinWheel() {
    if (gameState.isSpinning || gameState.canGuess) return;
    
    gameState.isSpinning = true;
    updateStatus("Барабан крутится...");
    playSound('spin');
    
    // Удаляем предыдущую подсветку
    if (gameState.currentHighlight) {
        gameState.currentHighlight.classList.remove('highlight');
    }
    
    const sectorIndex = Math.floor(Math.random() * sectors.length);
    const spinDuration = 5000;
    const startTime = Date.now();
    
    const sectorCenterAngle = (360 / sectors.length) * sectorIndex;
    const correctionAngle = 90;
    const targetAngle = 5 * 360 + sectorCenterAngle + correctionAngle;
    
    const animateWheel = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const currentAngle = easeOut * targetAngle;
        
        elements.wheel.style.transform = `rotate(-${currentAngle}deg)`;
        
        if (progress < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            finishSpin(sectorIndex);
        }
    };
    
    const finishSpin = (index) => {
        const finalAngle = (360 / sectors.length * index) + 90;
        elements.wheel.style.transform = `rotate(-${finalAngle}deg)`;
        
        gameState.isSpinning = false;
        gameState.currentSector = sectors[index];
        gameState.canGuess = true;
        
        // Постоянная подсветка выпавшего сектора
        const paths = elements.wheel.querySelectorAll('path');
        paths[index].classList.add('highlight');
        gameState.currentHighlight = paths[index];
        
        applySectorEffect(gameState.currentSector);
        updateStatus(`Выпало: ${gameState.currentSector.text}. Выбирайте букву!`);
    };
    
    animateWheel();
}

// Применение эффекта сектора
function applySectorEffect(sector) {
    elements.sectorInfo.textContent = sector.text;
    elements.sectorInfo.style.backgroundColor = sector.color;
    
    let message = "";
    switch(sector.value) {
        case "prize":
            message = "Вы выиграли приз!";
            playSound('prize');
            break;
        case "x2":
            gameState.multiplier = 2;
            message = "Удвоение очков за букву!";
            playSound('x2');
            break;
        case "bankrupt":
            gameState.score = 0;
            message = "Банкрот! Очки обнулены!";
            playSound('bankrupt');
            break;
        case "skip":
            message = "Пропуск хода!";
            gameState.canGuess = false;
            setTimeout(() => {
                updateStatus("Пропуск хода! Крутите барабан снова.");
            }, 1500);
            break;
        default:
            message = `${sector.value} очков за букву`;
    }
    
    if (sector.value !== "skip") {
        updateStatus(`Выпало: ${sector.text}. ${message} Выбирайте букву!`);
    }
}

// Обработка угадывания буквы
function handleGuess(letter) {
    if (!gameState.canGuess || gameState.isSpinning) {
        updateStatus("Сначала крутите барабан!");
        return;
    }
    
    if (gameState.guessedLetters.includes(letter)) return;
    
    gameState.guessedLetters.push(letter);
    const button = Array.from(document.querySelectorAll('.letter-btn'))
        .find(btn => btn.textContent === letter.toUpperCase());
    
    button.disabled = true;
    
    if (word.includes(letter)) {
        button.classList.add('correct');
        playSound('correct');
        
        if (typeof gameState.currentSector.value === "number") {
            const points = gameState.currentSector.value * gameState.multiplier;
            gameState.score += points;
            updateStatus(`Есть такая буква! +${points} очков. Крутите барабан снова.`);
        } else {
            updateStatus("Есть такая буква! Крутите барабан снова.");
        }
    } else {
        button.classList.add('incorrect');
        gameState.mistakes++;
        playSound('wrong');
        updateStatus(`Нет такой буквы! Ошибок: ${gameState.mistakes}/${gameState.maxMistakes}. Крутите барабан.`);
    }
    
    gameState.canGuess = false;
    gameState.multiplier = 1;
    updateGame();
    checkGameEnd();
}

// Обновление игрового состояния
function updateGame() {
    elements.wordDisplay.textContent = word.split('').map(letter => 
        gameState.guessedLetters.includes(letter) ? letter : '_'
    ).join(' ');
}

// Обновление статуса
function updateStatus(message) {
    elements.status.textContent = message;
}

// Проверка завершения игры
function checkGameEnd() {
    if (gameState.mistakes >= gameState.maxMistakes) {
        endGame(false);
    } else if (!elements.wordDisplay.textContent.includes('_')) {
        endGame(true);
    }
}

// Завершение игры
function endGame(isWin) {
    if (!isWin) {
        word.split('').forEach(letter => {
            if (!gameState.guessedLetters.includes(letter)) {
                gameState.guessedLetters.push(letter);
            }
        });
        updateGame();
        playSound('lose');
    } else {
        playSound('win');
    }
    
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    gameState.canGuess = false;
    elements.sectorInfo.textContent = isWin ? "ПОБЕДА!" : "ПРОИГРЫШ";
    elements.sectorInfo.style.backgroundColor = isWin ? "#2ecc71" : "#e74c3c";
    
    updateStatus(isWin 
        ? `Поздравляем! Вы выиграли со счетом ${gameState.score} очков!` 
        : `Игра окончена! Слово: "${word}". Ваш счет: ${gameState.score}`
    );
}

// Воспроизведение звука
function playSound(soundName) {
    if (elements.sounds[soundName]) {
        elements.sounds[soundName].currentTime = 0;
        elements.sounds[soundName].play();
    }
}

// Кнопка перезапуска
elements.restartBtn.addEventListener('click', initGame);

// Старт игры при загрузке
document.addEventListener('DOMContentLoaded', initGame);
