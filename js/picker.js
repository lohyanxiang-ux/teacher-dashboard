let activePool = [];
let recheckQueue = [];
let currentStudent = null;
let timerInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  HubState.init();
  loadPoolData();
});

function loadPoolData() {
  activePool = HubState.getActivePool(HubState.currentClass);
  updateStats();
}

function updateStats() {
  const total = HubState.getRoster(HubState.currentClass).length;
  document.getElementById('pool-stats').textContent = 
    `Active: ${activePool.length} | Done: ${total - activePool.length}`;
}

function drawStudent() {
  if (activePool.length === 0) {
    document.getElementById('student-display').innerHTML = '<span style="color:#ef4444;">Pool Empty! Reset to restart.</span>';
    return;
  }

  const display = document.getElementById('student-display');
  let iterations = 0;
  
  const shuffle = setInterval(() => {
    const randomTemp = activePool[Math.floor(Math.random() * activePool.length)];
    display.textContent = randomTemp;
    iterations++;
    if (iterations > 12) {
      clearInterval(shuffle);
      const selectedIndex = Math.floor(Math.random() * activePool.length);
      currentStudent = activePool[selectedIndex];
      display.textContent = currentStudent;
    }
  }, 50);
}

function markResponse(status) {
  if (!currentStudent) return;

  if (status === 'green') {
    activePool = activePool.filter(s => s !== currentStudent);
    HubState.setActivePool(HubState.currentClass, activePool);
  } else if (status === 'red') {
    if (!recheckQueue.includes(currentStudent)) {
      recheckQueue.push(currentStudent);
      renderRecheckQueue();
    }
  }
  
  updateStats();
  document.getElementById('student-display').innerHTML = '<span class="placeholder">Select Next Student</span>';
  currentStudent = null;
}

function renderRecheckQueue() {
  const list = document.getElementById('recheck-list');
  list.innerHTML = '';
  recheckQueue.forEach(student => {
    const li = document.createElement('li');
    li.textContent = `🔴 ${student}`;
    list.appendChild(li);
  });
}

function startTimer(seconds) {
  clearInterval(timerInterval);
  let remaining = seconds;
  const display = document.getElementById('timer-display');
  
  const updateDisplay = () => {
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    display.textContent = `${mins}:${secs}`;
  };

  updateDisplay();
  timerInterval = setInterval(() => {
    remaining--;
    if (remaining < 0) {
      clearInterval(timerInterval);
      display.textContent = "⏱ Time's Up!";
    } else {
      updateDisplay();
    }
  }, 1000);
}

function resetClassPool() {
  HubState.resetActivePool(HubState.currentClass);
  recheckQueue = [];
  renderRecheckQueue();
  loadPoolData();
}
