const HubState = {
  currentClass: 'Class 3A',
  
  init() {
    if (!localStorage.getItem('math_rosters')) {
      const defaultRosters = {
        'Class 3A': ['Alex Tan', 'Sarah Lim', 'Marcus Wong', 'Priyah Kumar', 'David Chen', 'Rachel Goh'],
        'Class 3B': ['Ethan Ong', 'Chloe Lee', 'Hassan Ali', 'Megan Teo', 'Lucas Vance'],
        'Class 4A': ['Benjamin Wright', 'Aaliyah Jones', 'Caleb Smith', 'Zoe Taylor']
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

  deleteClass(className) {
    const rosters = JSON.parse(localStorage.getItem('math_rosters') || '{}');
    delete rosters[className];
    localStorage.setItem('math_rosters', JSON.stringify(rosters));
    
    // Clear associated storage keys
    localStorage.removeItem(`math_pool_${className}`);
    localStorage.removeItem(`math_mastered_${className}`);
    localStorage.removeItem(`math_recheck_${className}`);

    const remaining = Object.keys(rosters);
    if (remaining.length > 0) {
      this.setCurrentClass(remaining[0]);
    }
  },

  importBulkRosters(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error("Invalid format. Expected a JSON object of class rosters.");
      }

      const rosters = JSON.parse(localStorage.getItem('math_rosters') || '{}');
      
      for (const [className, names] of Object.entries(parsed)) {
        if (Array.isArray(names)) {
          rosters[className] = names.map(n => String(n).trim()).filter(n => n.length > 0);
          this.resetActivePool(className);
        }
      }

      localStorage.setItem('math_rosters', JSON.stringify(rosters));
      return true;
    } catch (err) {
      alert(`Import Error: ${err.message}`);
      return false;
    }
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

  getMasteredList(className) {
    return JSON.parse(localStorage.getItem(`math_mastered_${className}`) || '[]');
  },

  setMasteredList(className, listArray) {
    localStorage.setItem(`math_mastered_${className}`, JSON.stringify(listArray));
  },

  getRecheckQueue(className) {
    return JSON.parse(localStorage.getItem(`math_recheck_${className}`) || '[]');
  },

  setRecheckQueue(className, queueArray) {
    localStorage.setItem(`math_recheck_${className}`, JSON.stringify(queueArray));
  },

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
