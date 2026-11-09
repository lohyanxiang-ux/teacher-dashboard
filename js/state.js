const HubState = {
  currentClass: 'Class 3A',
  
  init() {
    if (!localStorage.getItem('math_rosters')) {
      const defaultRosters = {
        'Class 3A': ['Alex Tan', 'Sarah Lim', 'Marcus Wong', 'Priyah Kumar', 'David Chen', 'Rachel Goh']
      };
      localStorage.setItem('math_rosters', JSON.stringify(defaultRosters));
    }
    this.currentClass = localStorage.getItem('math_current_class') || 'Class 3A';
  },

  getClasses() {
    const rosters = JSON.parse(localStorage.getItem('math_rosters') || '{}');
    return Object.keys(rosters);
  },

  getRoster(className) {
    const rosters = JSON.parse(localStorage.getItem('math_rosters') || '{}');
    return rosters[className] || [];
  },

  setRoster(className, namesArray) {
    const rosters = JSON.parse(localStorage.getItem('math_rosters') || '{}');
    rosters[className] = namesArray;
    localStorage.setItem('math_rosters', JSON.stringify(rosters));
    this.resetActivePool(className);
  },

  setCurrentClass(className) {
    this.currentClass = className;
    localStorage.setItem('math_current_class', className);
  },

  // Active Pool Management
  getActivePool(className) {
    const poolKey = `math_pool_${className}`;
    const stored = localStorage.getItem(poolKey);
    if (!stored) {
      const fullRoster = this.getRoster(className);
      localStorage.setItem(poolKey, JSON.stringify(fullRoster));
      return fullRoster;
    }
    return JSON.parse(stored);
  },

  setActivePool(className, poolArray) {
    localStorage.setItem(`math_pool_${className}`, JSON.stringify(poolArray));
  },

  // Mastered List Management
  getMasteredList(className) {
    const key = `math_mastered_${className}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  setMasteredList(className, listArray) {
    localStorage.setItem(`math_mastered_${className}`, JSON.stringify(listArray));
  },

  // Recheck Queue Management
  getRecheckQueue(className) {
    const key = `math_recheck_${className}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  setRecheckQueue(className, queueArray) {
    localStorage.setItem(`math_recheck_${className}`, JSON.stringify(queueArray));
  },

  // Full Reset to start a new cycle
  resetActivePool(className) {
    const fullRoster = this.getRoster(className);
    localStorage.setItem(`math_pool_${className}`, JSON.stringify(fullRoster));
    localStorage.setItem(`math_mastered_${className}`, JSON.stringify([]));
    localStorage.setItem(`math_recheck_${className}`, JSON.stringify([]));
  },

  getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
  },

  setApiKey(key) {
    localStorage.setItem('gemini_api_key', key.trim());
  }
};
