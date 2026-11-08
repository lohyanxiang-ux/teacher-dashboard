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

  resetActivePool(className) {
    const fullRoster = this.getRoster(className);
    localStorage.setItem(`math_pool_${className}`, JSON.stringify(fullRoster));
  },

  getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
  },

  setApiKey(key) {
    localStorage.setItem('gemini_api_key', key);
  }
};
