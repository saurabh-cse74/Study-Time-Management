let timerInterval;
let startTime;
let elapsedTime = 0;
let isRunning = false;

const timerDisplay = document.getElementById('timer-display');
const sessionTimeDisplay = document.getElementById('session-time');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const logSessionBtn = document.getElementById('log-session');
const logsList = document.getElementById('logs-list');

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimer() {
    const currentTime = Date.now();
    const totalElapsed = elapsedTime + Math.floor((currentTime - startTime) / 1000);
    timerDisplay.textContent = formatTime(totalElapsed);
    sessionTimeDisplay.textContent = formatTime(totalElapsed);
}

function startTimer() {
    if (!isRunning) {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    }
}

function pauseTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        elapsedTime += Math.floor((Date.now() - startTime) / 1000);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    isRunning = false;
    timerDisplay.textContent = '00:00:00';
    sessionTimeDisplay.textContent = '00:00:00';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function logSession() {
    const sessionTime = elapsedTime;
    if (sessionTime > 0) {
        const now = new Date();
        const logEntry = {
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            duration: sessionTime
        };

        let logs = JSON.parse(localStorage.getItem('studyLogs')) || [];
        logs.push(logEntry);
        localStorage.setItem('studyLogs', JSON.stringify(logs));

        displayLogs();
        resetTimer();
    }
}

function displayLogs() {
    const logs = JSON.parse(localStorage.getItem('studyLogs')) || [];
    logsList.innerHTML = '';
    logs.forEach(log => {
        const li = document.createElement('li');
        li.textContent = `${log.date} ${log.time} - ${formatTime(log.duration)}`;
        logsList.appendChild(li);
    });
}

function displayModalLogs() {
    const logs = JSON.parse(localStorage.getItem('studyLogs')) || [];
    const modalLogsList = document.getElementById('modal-logs-list');
    modalLogsList.innerHTML = '';
    logs.forEach(log => {
        const li = document.createElement('li');
        const dateTimeSpan = document.createElement('span');
        dateTimeSpan.textContent = `${log.date} ${log.time}`;
        const durationSpan = document.createElement('span');
        durationSpan.textContent = formatTime(log.duration);
        durationSpan.className = 'duration';
        li.appendChild(dateTimeSpan);
        li.appendChild(durationSpan);
        modalLogsList.appendChild(li);
    });
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
logSessionBtn.addEventListener('click', logSession);

const profileBtn = document.getElementById('profile');
const loginBtn = document.getElementById('login');

// Initialize login button text
if (localStorage.getItem('loggedIn') === 'true') {
    loginBtn.textContent = 'Logout';
} else {
    loginBtn.textContent = 'Login';
}

// IndexedDB setup
let db;
const request = indexedDB.open('StudyManagerDB', 1);

request.onerror = function(event) {
    console.error('Database error: ' + event.target.errorCode);
};

request.onsuccess = function(event) {
    db = event.target.result;
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('profiles', { keyPath: 'id' });
    objectStore.createIndex('name', 'name', { unique: false });
    objectStore.createIndex('email', 'email', { unique: false });
    objectStore.createIndex('studyGoal', 'studyGoal', { unique: false });
};

function loadProfile() {
    const transaction = db.transaction(['profiles'], 'readonly');
    const objectStore = transaction.objectStore('profiles');
    const request = objectStore.get(1); // Assuming single profile with id 1

    request.onsuccess = function(event) {
        const profile = event.target.result || { name: '', email: '', studyGoal: '' };
        // Update display
        document.getElementById('display-name').textContent = profile.name || 'Not set';
        document.getElementById('display-email').textContent = profile.email || 'Not set';
        document.getElementById('display-study-goal').textContent = profile.studyGoal || 'Not set';
        // Update form
        document.getElementById('name').value = profile.name;
        document.getElementById('email').value = profile.email;
        document.getElementById('study-goal').value = profile.studyGoal;
        // Update profile button text
        if (profile.name) {
            profileBtn.textContent = profile.name;
        } else {
            profileBtn.textContent = 'Profile';
        }
    };

    request.onerror = function(event) {
        console.error('Error loading profile: ' + event.target.errorCode);
    };
}

profileBtn.addEventListener('click', () => {
    loadProfile();
    document.getElementById('profile-display').style.display = 'block';
    document.getElementById('profile-form').style.display = 'none';
    document.getElementById('profile-modal').style.display = 'flex';
});

document.getElementById('close-profile').addEventListener('click', () => {
    document.getElementById('profile-modal').style.display = 'none';
});

document.getElementById('edit-profile').addEventListener('click', () => {
    document.getElementById('profile-display').style.display = 'none';
    document.getElementById('profile-form').style.display = 'block';
});

document.getElementById('cancel-edit').addEventListener('click', () => {
    document.getElementById('profile-display').style.display = 'block';
    document.getElementById('profile-form').style.display = 'none';
});

document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const profile = {
        id: 1,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        studyGoal: document.getElementById('study-goal').value
    };

    const transaction = db.transaction(['profiles'], 'readwrite');
    const objectStore = transaction.objectStore('profiles');
    const request = objectStore.put(profile);

    request.onsuccess = function(event) {
        loadProfile(); // Reload to update display
        document.getElementById('profile-display').style.display = 'block';
        document.getElementById('profile-form').style.display = 'none';
        alert('Profile saved successfully!');
        // Update profile button text
        profileBtn.textContent = profile.name || 'Profile';
    };

    request.onerror = function(event) {
        console.error('Error saving profile: ' + event.target.errorCode);
    };
});

loginBtn.addEventListener('click', () => {
    alert('Login/Logout feature coming soon!');
});

const tipsBtn = document.getElementById('tips');
tipsBtn.addEventListener('click', () => {
    const tipsModal = document.getElementById('tips-modal');
    tipsModal.style.display = 'flex';
});

const logsBtn = document.getElementById('logs');
logsBtn.addEventListener('click', () => {
    const logsModal = document.getElementById('logs-modal');
    displayModalLogs();
    logsModal.style.display = 'flex';
});

document.getElementById('close-tips').addEventListener('click', () => {
    const tipsModal = document.getElementById('tips-modal');
    tipsModal.style.display = 'none';
});

document.getElementById('close-logs').addEventListener('click', () => {
    const logsModal = document.getElementById('logs-modal');
    logsModal.style.display = 'none';
});

document.getElementById('clear-logs').addEventListener('click', () => {
    localStorage.removeItem('studyLogs');
    displayLogs();
    displayModalLogs();
    alert('All study logs have been cleared.');
});


// Initialize
pauseBtn.disabled = true;
displayLogs();
loadProfile(); // Load profile to update button text on page load



