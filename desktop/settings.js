// Student Assistant Pro - Settings Module
// Comprehensive settings and customization system

const Settings = {
  // Default settings structure
  defaults: {
    // Appearance
    appearance: {
      theme: 'auto', // 'auto', 'light', 'dark'
      accentColor: '#667eea',
      customTheme: null,
      fontSize: 'medium', // 'small', 'medium', 'large'
      density: 'comfortable', // 'compact', 'comfortable', 'spacious'
      animations: true,
      reduceMotion: false,
      sidebarPosition: 'left', // 'left', 'right'
      showSidebarLabels: true,
      showSidebarIcons: true
    },

    // Notifications
    notifications: {
      enabled: true,
      desktop: true,
      sound: true,
      volume: 50,
      classReminders: true,
      classReminderMinutes: 15,
      assignmentDue: true,
      assignmentDueHours: 24,
      assignmentOverdue: true,
      examReminders: true,
      examDaysBefore: 3,
      taskReminders: true,
      studyReminders: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    },

    // Timer
    timer: {
      pomodoroDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
      autoStartBreaks: false,
      autoStartPomodoro: false,
      sound: true,
      notifications: true,
      showRemainingTime: true,
      minimizeOnStart: false
    },

    // Calendar
    calendar: {
      firstDayOfWeek: 'sunday', // 'sunday', 'monday'
      showWeekNumbers: false,
      defaultView: 'month', // 'day', 'week', 'month'
      showDeclinedEvents: false,
      colorClasses: true,
      showLocation: true,
      showDescription: true
    },

    // Grades
    grades: {
      scale: 'percentage', // 'percentage', 'gpa_4.0', 'gpa_5.0', 'custom'
      defaultWeight: 0,
      showWeightedAverage: true,
      showTrends: true,
      showPredictions: true,
      rounding: 1, // decimal places
      customScale: null
    },

    // Tasks
    tasks: {
      defaultPriority: 'medium',
      showSubtasks: true,
      showDueDates: true,
      showEstimatedTime: true,
      groupByDefault: 'status', // 'status', 'priority', 'dueDate', 'class'
      sortByDefault: 'dueDate', // 'dueDate', 'priority', 'createdAt', 'title'
      hideCompletedAfter: 7, // days, 0 = never hide
      confirmComplete: true,
      showCompletionDate: true
    },

    // Notes
    notes: {
      defaultFolder: null,
      showWordCount: true,
      showReadingTime: true,
      autoSave: true,
      autoSaveInterval: 30, // seconds
      showTags: true,
      tagSuggestions: true,
      linkNotes: true,
      defaultView: 'grid', // 'grid', 'list'
      sortByDefault: 'updatedAt' // 'updatedAt', 'createdAt', 'title'
    },

    // Flashcards
    flashcards: {
      dailyNewCards: 20,
      dailyReviewCards: 100,
      showHints: true,
      autoPlay: false,
      shuffleCards: true,
      sound: true,
      showProgress: true,
      reviewOrder: 'due_first' // 'due_first', 'random', 'added'
    },

    // Data
    data: {
      autoBackup: true,
      autoBackupInterval: 7, // days
      backupLocation: null,
      syncEnabled: false,
      syncProvider: null,
      exportFormat: 'json', // 'json', 'csv'
      includeArchived: false
    },

    // Privacy
    privacy: {
      lockApp: false,
      lockTimeout: 5, // minutes, 0 = never
      hideSensitiveData: false,
      incognitoMode: false,
      analyticsEnabled: true,
      crashReportsEnabled: true
    },

    // Accessibility
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true,
      underlineLinks: true
    },

    // Language
    language: {
      locale: 'en-US',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h', // '12h', '24h'
      firstDayOfWeek: 'sunday'
    },

    // Advanced
    advanced: {
      developerMode: false,
      experimentalFeatures: false,
      hardwareAcceleration: true,
      cacheEnabled: true,
      cacheSize: 500, // MB
      logLevel: 'error' // 'debug', 'info', 'warn', 'error'
    }
  },

  // Current settings
  current: null,

  // Initialize settings
  init() {
    this.current = this.load();
    return this;
  },

  // Load settings from storage
  load() {
    try {
      const saved = localStorage.getItem('studentAssistantSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.deepMerge(this.defaults, parsed);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return JSON.parse(JSON.stringify(this.defaults));
  },

  // Save settings to storage
  save() {
    try {
      localStorage.setItem('studentAssistantSettings', JSON.stringify(this.current));
      this.dispatchChangeEvent();
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  },

  // Get a setting value
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let value = this.current;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  },

  // Set a setting value
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let obj = this.current;
    for (const key of keys) {
      if (!(key in obj)) {
        obj[key] = {};
      }
      obj = obj[key];
    }

    obj[lastKey] = value;
    this.save();
    return true;
  },

  // Reset a setting to default
  reset(path) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let defaultObj = this.defaults;
    for (const key of keys) {
      if (defaultObj && key in defaultObj) {
        defaultObj = defaultObj[key];
      } else {
        return false;
      }
    }

    if (lastKey in defaultObj) {
      this.set(path, defaultObj[lastKey]);
      return true;
    }
    return false;
  },

  // Reset all settings to defaults
  resetAll() {
    this.current = JSON.parse(JSON.stringify(this.defaults));
    this.save();
    return true;
  },

  // Import settings from file
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.current = this.deepMerge(this.defaults, imported);
      this.save();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Export settings to file
  export() {
    return JSON.stringify(this.current, null, 2);
  },

  // Deep merge objects
  deepMerge(target, source) {
    const result = JSON.parse(JSON.stringify(target));
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  },

  // Get all settings
  getAll() {
    return JSON.parse(JSON.stringify(this.current));
  },

  // Get settings by category
  getByCategory(category) {
    return this.current[category] || {};
  },

  // Validate settings
  validate() {
    const errors = [];
    
    // Validate timer settings
    if (this.current.timer.pomodoroDuration < 1 || this.current.timer.pomodoroDuration > 180) {
      errors.push('Pomodoro duration must be between 1 and 180 minutes');
    }
    
    // Validate quiet hours
    if (this.current.notifications.quietHours.enabled) {
      if (!this.isValidTime(this.current.notifications.quietHours.start)) {
        errors.push('Invalid quiet hours start time');
      }
      if (!this.isValidTime(this.current.notifications.quietHours.end)) {
        errors.push('Invalid quiet hours end time');
      }
    }

    // Validate cache size
    if (this.current.advanced.cacheSize < 100 || this.current.advanced.cacheSize > 5000) {
      errors.push('Cache size must be between 100 and 5000 MB');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Check if time string is valid
  isValidTime(timeStr) {
    const regex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    return regex.test(timeStr);
  },

  // Apply theme settings
  applyTheme() {
    const { appearance } = this.current;
    
    // Set theme
    if (appearance.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (appearance.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // Auto - check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    // Set accent color
    document.documentElement.style.setProperty('--primary-color', appearance.accentColor);

    // Set font size
    const fontSizes = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem'
    };
    document.documentElement.style.setProperty('--base-font-size', fontSizes[appearance.fontSize]);

    // Set density
    const densities = {
      compact: '0.5rem',
      comfortable: '1rem',
      spacious: '1.5rem'
    };
    document.documentElement.style.setProperty('--spacing-base', densities[appearance.density]);

    // Animations
    if (!appearance.animations || appearance.reduceMotion) {
      document.documentElement.style.setProperty('--transition', 'none');
    }

    return true;
  },

  // Apply accessibility settings
  applyAccessibility() {
    const { accessibility } = this.current;

    if (accessibility.highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }

    if (accessibility.largeText) {
      document.documentElement.setAttribute('data-text-size', 'large');
    } else {
      document.documentElement.removeAttribute('data-text-size');
    }

    return true;
  },

  // Apply all settings
  applyAll() {
    this.applyTheme();
    this.applyAccessibility();
    this.dispatchChangeEvent();
    return true;
  },

  // Dispatch change event
  dispatchChangeEvent() {
    const event = new CustomEvent('settingschange', {
      detail: { settings: this.current }
    });
    document.dispatchEvent(event);
  },

  // Get theme presets
  getThemePresets() {
    return {
      blue: { name: 'Ocean Blue', color: '#3b82f6' },
      green: { name: 'Forest Green', color: '#10b981' },
      purple: { name: 'Royal Purple', color: '#8b5cf6' },
      orange: { name: 'Sunset Orange', color: '#f59e0b' },
      red: { name: 'Cherry Red', color: '#ef4444' },
      pink: { name: 'Rose Pink', color: '#ec4899' },
      teal: { name: 'Ocean Teal', color: '#14b8a6' },
      indigo: { name: 'Deep Indigo', color: '#6366f1' }
    };
  },

  // Get font presets
  getFontPresets() {
    return {
      small: { name: 'Small', size: '0.875rem' },
      medium: { name: 'Medium', size: '1rem' },
      large: { name: 'Large', size: '1.125rem' },
      xl: { name: 'Extra Large', size: '1.25rem' }
    };
  },

  // Get available locales
  getLocales() {
    return {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'es-ES': 'Español',
      'fr-FR': 'Français',
      'de-DE': 'Deutsch',
      'it-IT': 'Italiano',
      'pt-BR': 'Português (Brasil)',
      'zh-CN': '中文 (简体)',
      'ja-JP': '日本語',
      'ko-KR': '한국어'
    };
  },

  // Get date format presets
  getDateFormats() {
    return {
      'MM/DD/YYYY': '12/31/2024',
      'DD/MM/YYYY': '31/12/2024',
      'YYYY-MM-DD': '2024-12-31',
      'MMMM D, YYYY': 'December 31, 2024',
      'D MMMM YYYY': '31 December 2024'
    };
  },

  // Get grade scale presets
  getGradeScales() {
    return {
      percentage: { name: 'Percentage (0-100%)', min: 0, max: 100 },
      gpa_4.0: { name: 'GPA (4.0 Scale)', min: 0, max: 4 },
      gpa_5.0: { name: 'GPA (5.0 Scale)', min: 0, max: 5 },
      letter: { name: 'Letter Grades', grades: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'] }
    };
  },

  // Get keyboard shortcuts
  getKeyboardShortcuts() {
    return {
      'Global': {
        'Ctrl+K': 'Open Command Palette',
        'Ctrl+H': 'Show Help',
        'Ctrl+,': 'Open Settings',
        'Escape': 'Close Modal/Menu'
      },
      'Navigation': {
        'Ctrl+1': 'Go to Dashboard',
        'Ctrl+2': 'Go to Classes',
        'Ctrl+3': 'Go to Assignments',
        'Ctrl+4': 'Go to Exams',
        'Ctrl+5': 'Go to Grades',
        'Ctrl+6': 'Go to Calendar',
        'Ctrl+7': 'Go to Timer',
        'Ctrl+8': 'Go to Notes',
        'Ctrl+9': 'Go to Tasks'
      },
      'Timer': {
        'Space': 'Start/Pause Timer',
        'R': 'Reset Timer',
        'T': 'Toggle Timer View'
      }
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Settings };
}
