let activePool = [];
let masteredList = [];
let recheckQueue = [];
let currentStudent = null;
let timerInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  HubState.init();
  loadStateData();
});

function loadStateData() {
  const currentClass = HubState.currentClass;
  activePool = HubState.getActivePool(currentClass);
  masteredList = HubState.getMasteredList(currentClass);
  recheckQueue = HubState.getRecheckQueue(currentClass);

  // Auto-reset cycle if active pool hits zero
  if (activePool.length === 0 && masteredList.length > 0) {
    alert("🎉 All students have mastered this cycle! Resetting roster for the next round.");
    HubState.resetActivePool(currentClass);
    activePool = HubState.getActivePool(currentClass);
    masteredList = [];
    recheckQueue = [];
  }

  updateStats();
  renderRecheckQueue();
}

function saveStateData() {
  const currentClass = HubState.currentClass;
  HubState.setActivePool(currentClass, activePool);
  HubState.setMasteredList(currentClass, masteredList);
  HubState.setRecheckQueue(currentClass, recheckQueue);
}

function updateStats() {
  const total = HubState.getRoster(HubState.currentClass).length;
  document.getElementById('pool-stats').textContent = 
    `Active: ${activePool.length} | Mastered: ${masteredList.length}/${total}`;
  document.getElementById('recheck-count').textContent = recheckQueue.length;
}

function drawStudent() {
  if (activePool.length === 0) {
    loadStateData(); // Triggers reset if zero
    return;
  }

  const display = document.getElementById('student-display');
  let iterations = 0;
  
  // Slot Machine effect
  const shuffle = setInterval(() => {
    const randomTemp = activePool[Math.floor(Math.random() * activePool.length)];
    display.textContent = randomTemp;
    iterations++;

    if (iterations > 12) {
      clearInterval(shuffle);

      // Selection Algorithm: 70% chance to prioritize Recheck Queue if available
      let picked = null;
      if (recheckQueue.length > 0 && Math.random() < 0.70) {
        // Filter candidates in recheck queue that are still in active pool
        const validRechecks = recheckQueue.filter(name => activePool.includes(name));
        if (validRechecks.length > 0) {
          // Avoid picking same consecutive student if possible
          const candidatePool = validRechecks.length > 1 
            ? validRechecks.filter(name => name !== currentStudent) 
            : validRechecks;
          picked = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        }
      }

      // Default random pick from overall Active Pool
      if (!picked) {
        const candidatePool = activePool.length > 1 
          ? activePool.filter(name => name !== currentStudent) 
          : activePool;
        picked = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      }

      currentStudent = picked;
      display.textContent = currentStudent;
    }
  }, 40);
}

function markResponse(status) {
  if (!currentStudent) return;

  if (status === 'green') {
    // 🟢 Mastered: Remove from Active Pool & Recheck Queue, add to Mastered List
    activePool = activePool.filter(s => s !== currentStudent);
    recheckQueue = recheckQueue.filter(s => s !== currentStudent);
    if (!masteredList.includes(currentStudent)) {
      masteredList.push(currentStudent);
    }
  } else if (status === 'yellow' || status === 'red') {
    // 🟡 Pass / 🔴 Recheck: Keep in Active Pool, add/move to top of Recheck Queue
    if (!recheckQueue.includes(currentStudent)) {
      recheckQueue.push(currentStudent);
    }
  }
  
  saveStateData();
  updateStats();
  renderRecheckQueue();

  // Check if round finished
  if (activePool.length === 0) {
    setTimeout(() => {
      loadStateData();
    }, 500);
  }

  document.getElementById('student-display').innerHTML = '<span class="placeholder">Tap Draw for Next Student</span>';
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
  if (confirm("Reset active pool for this class? All students will start fresh.")) {
    HubState.resetActivePool(HubState.currentClass);
    currentStudent = null;
    document.getElementById('student-display').innerHTML = '<span class="placeholder">Tap Draw to Pick</span>';
    loadStateData();
  }
}

/* Status Modal Functions */
function openStatusModal() {
  const listActive = document.getElementById('list-active');
  const listRecheck = document.getElementById('list-recheck');
  const listMastered = document.getElementById('list-mastered');

  listActive.innerHTML = activePool.map(name => `<li>🎲 ${name}</li>`).join('') || '<li class="empty">Empty</li>';
  listRecheck.innerHTML = recheckQueue.map(name => `<li>🔴 ${name}</li>`).join('') || '<li class="empty">Empty</li>';
  listMastered.innerHTML = masteredList.map(name => `<li>🟢 ${name}</li>`).join('') || '<li class="empty">Empty</li>';

  document.getElementById('count-active').textContent = activePool.length;
  document.getElementById('count-recheck').textContent = recheckQueue.length;
  document.getElementById('count-mastered').textContent = masteredList.length;

  document.getElementById('status-modal').classList.remove('hidden');
}

function closeStatusModal() {
  document.getElementById('status-modal').classList.add('hidden');
}
