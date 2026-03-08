// Student Assistant Pro - Command Palette Module
// Quick actions, search, and keyboard shortcuts

const CommandPalette = {
  // Registered commands
  commands: [],

  // Keyboard shortcuts
  shortcuts: {},

  // Initialize command palette
  init() {
    this.registerDefaultCommands();
    this.setupKeyboardShortcuts();
    return this;
  },

  // Register a command
  register(command) {
    this.commands.push({
      id: command.id,
      name: command.name,
      description: command.description || '',
      icon: command.icon || '',
      category: command.category || 'General',
      keywords: command.keywords || [],
      action: command.action,
      shortcut: command.shortcut || null
    });
    return this;
  },

  // Register multiple commands
  registerAll(commands) {
    commands.forEach(cmd => this.register(cmd));
    return this;
  },

  // Register default commands
  registerDefaultCommands() {
    this.registerAll([
      // Navigation
      {
        id: 'nav.dashboard',
        name: 'Go to Dashboard',
        description: 'Open the main dashboard',
        icon: '📊',
        category: 'Navigation',
        keywords: ['home', 'main', 'overview'],
        action: () => this.navigateToView('dashboard')
      },
      {
        id: 'nav.classes',
        name: 'Go to My Classes',
        description: 'View and manage your classes',
        icon: '📖',
        category: 'Navigation',
        keywords: ['courses', 'subjects'],
        action: () => this.navigateToView('classes')
      },
      {
        id: 'nav.assignments',
        name: 'Go to Assignments',
        description: 'View and manage assignments',
        icon: '📝',
        category: 'Navigation',
        keywords: ['homework', 'tasks'],
        action: () => this.navigateToView('assignments')
      },
      {
        id: 'nav.exams',
        name: 'Go to Exams',
        description: 'View upcoming exams',
        icon: '📋',
        category: 'Navigation',
        keywords: ['tests', 'quizzes'],
        action: () => this.navigateToView('exams')
      },
      {
        id: 'nav.grades',
        name: 'Go to Grades',
        description: 'View your grades',
        icon: '🎯',
        category: 'Navigation',
        keywords: ['scores', 'results'],
        action: () => this.navigateToView('grades')
      },
      {
        id: 'nav.calendar',
        name: 'Go to Calendar',
        description: 'View calendar',
        icon: '📅',
        category: 'Navigation',
        keywords: ['schedule', 'dates'],
        action: () => this.navigateToView('calendar')
      },
      {
        id: 'nav.timer',
        name: 'Go to Study Timer',
        description: 'Open study timer',
        icon: '⏱️',
        category: 'Navigation',
        keywords: ['pomodoro', 'focus'],
        action: () => this.navigateToView('timer')
      },
      {
        id: 'nav.notes',
        name: 'Go to Notes',
        description: 'View your notes',
        icon: '📓',
        category: 'Navigation',
        keywords: ['journals'],
        action: () => this.navigateToView('notes')
      },
      {
        id: 'nav.tasks',
        name: 'Go to Tasks',
        description: 'View your tasks',
        icon: '✓',
        category: 'Navigation',
        keywords: ['todo', 'checklist'],
        action: () => this.navigateToView('tasks')
      },
      {
        id: 'nav.settings',
        name: 'Go to Settings',
        description: 'Open settings',
        icon: '⚙️',
        category: 'Navigation',
        keywords: ['preferences', 'options'],
        action: () => this.navigateToView('settings')
      },

      // Actions
      {
        id: 'action.add_class',
        name: 'Add New Class',
        description: 'Create a new class',
        icon: '➕',
        category: 'Actions',
        keywords: ['create', 'new class'],
        action: () => this.openModal('classModal')
      },
      {
        id: 'action.add_assignment',
        name: 'Add Assignment',
        description: 'Create a new assignment',
        icon: '📝',
        category: 'Actions',
        keywords: ['homework', 'new assignment'],
        action: () => this.openModal('assignmentModal')
      },
      {
        id: 'action.add_exam',
        name: 'Add Exam',
        description: 'Schedule a new exam',
        icon: '📋',
        category: 'Actions',
        keywords: ['test', 'new exam'],
        action: () => this.openModal('examModal')
      },
      {
        id: 'action.add_note',
        name: 'Add Note',
        description: 'Create a new note',
        icon: '📓',
        category: 'Actions',
        keywords: ['journal', 'new note'],
        action: () => this.openModal('noteModal')
      },
      {
        id: 'action.add_task',
        name: 'Add Task',
        description: 'Create a new task',
        icon: '✓',
        category: 'Actions',
        keywords: ['todo', 'new task'],
        action: () => this.openModal('taskModal')
      },
      {
        id: 'action.add_grade',
        name: 'Add Grade',
        description: 'Record a new grade',
        icon: '🎯',
        category: 'Actions',
        keywords: ['score', 'new grade'],
        action: () => this.openModal('gradeModal')
      },

      // Timer
      {
        id: 'timer.start',
        name: 'Start Timer',
        description: 'Start the study timer',
        icon: '▶️',
        category: 'Timer',
        keywords: ['begin', 'pomodoro'],
        action: () => this.startTimer()
      },
      {
        id: 'timer.pause',
        name: 'Pause Timer',
        description: 'Pause the study timer',
        icon: '⏸️',
        category: 'Timer',
        keywords: ['stop', 'break'],
        action: () => this.pauseTimer()
      },
      {
        id: 'timer.reset',
        name: 'Reset Timer',
        description: 'Reset the study timer',
        icon: '🔄',
        category: 'Timer',
        keywords: ['restart'],
        action: () => this.resetTimer()
      },
      {
        id: 'timer.pomodoro',
        name: 'Start Pomodoro',
        description: 'Start a 25-minute focus session',
        icon: '🍅',
        category: 'Timer',
        keywords: ['focus', '25 minutes'],
        action: () => this.startPomodoro()
      },

      // Data
      {
        id: 'data.export',
        name: 'Export Data',
        description: 'Export all your data',
        icon: '📥',
        category: 'Data',
        keywords: ['backup', 'download'],
        action: () => this.exportData()
      },
      {
        id: 'data.import',
        name: 'Import Data',
        description: 'Import data from backup',
        icon: '📤',
        category: 'Data',
        keywords: ['restore', 'upload'],
        action: () => this.importData()
      },

      // Theme
      {
        id: 'theme.toggle',
        name: 'Toggle Theme',
        description: 'Switch between light and dark mode',
        icon: '🌓',
        category: 'Appearance',
        keywords: ['dark', 'light', 'mode'],
        action: () => this.toggleTheme()
      },
      {
        id: 'theme.light',
        name: 'Light Theme',
        description: 'Switch to light theme',
        icon: '☀️',
        category: 'Appearance',
        keywords: ['bright', 'day'],
        action: () => this.setTheme('light')
      },
      {
        id: 'theme.dark',
        name: 'Dark Theme',
        description: 'Switch to dark theme',
        icon: '🌙',
        category: 'Appearance',
        keywords: ['night', 'dark mode'],
        action: () => this.setTheme('dark')
      },

      // Help
      {
        id: 'help.shortcuts',
        name: 'Keyboard Shortcuts',
        description: 'View all keyboard shortcuts',
        icon: '⌨️',
        category: 'Help',
        keywords: ['keys', 'hotkeys'],
        action: () => this.showShortcuts()
      },
      {
        id: 'help.about',
        name: 'About',
        description: 'About Student Assistant Pro',
        icon: 'ℹ️',
        category: 'Help',
        keywords: ['version', 'info'],
        action: () => this.showAbout()
      }
    ]);
  },

  // Search commands
  search(query) {
    if (!query || query.trim() === '') {
      return this.commands;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const queryWords = normalizedQuery.split(/\s+/);

    return this.commands
      .map(cmd => {
        const searchText = [
          cmd.name,
          cmd.description,
          cmd.category,
          ...(cmd.keywords || [])
        ].join(' ').toLowerCase();

        let score = 0;
        
        // Exact match in name
        if (cmd.name.toLowerCase().includes(normalizedQuery)) {
          score += 10;
        }

        // Match individual words
        queryWords.forEach(word => {
          if (cmd.name.toLowerCase().includes(word)) score += 5;
          if (cmd.description.toLowerCase().includes(word)) score += 2;
          if (cmd.category.toLowerCase().includes(word)) score += 1;
          if (cmd.keywords.some(k => k.toLowerCase().includes(word))) score += 3;
        });

        return { ...cmd, score };
      })
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score);
  },

  // Group commands by category
  groupByCategory(commands) {
    return commands.reduce((groups, cmd) => {
      const category = cmd.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
      return groups;
    }, {});
  },

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    // Global shortcuts
    this.shortcuts = {
      'Ctrl+K': () => this.open(),
      'Ctrl+H': () => this.showShortcuts(),
      'Ctrl+D': () => this.navigateToView('dashboard'),
      'Ctrl+1': () => this.navigateToView('classes'),
      'Ctrl+2': () => this.navigateToView('assignments'),
      'Ctrl+3': () => this.navigateToView('exams'),
      'Ctrl+4': () => this.navigateToView('grades'),
      'Ctrl+5': () => this.navigateToView('calendar'),
      'Ctrl+6': () => this.navigateToView('timer'),
      'Ctrl+7': () => this.navigateToView('notes'),
      'Ctrl+8': () => this.navigateToView('tasks'),
      'Ctrl+9': () => this.navigateToView('settings'),
      'Escape': () => this.close()
    };

    // Add event listener
    document.addEventListener('keydown', (e) => {
      const key = this.getKeyString(e);
      if (this.shortcuts[key]) {
        e.preventDefault();
        this.shortcuts[key]();
      }
    });
  },

  // Get key string from event
  getKeyString(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    if (e.metaKey) parts.push('Meta');
    
    const key = e.key.toUpperCase();
    if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key)) {
      parts.push(key);
    }
    
    return parts.join('+');
  },

  // Navigation helper
  navigateToView(viewName) {
    const event = new CustomEvent('navigate', { detail: { view: viewName } });
    document.dispatchEvent(event);
    this.close();
  },

  // Modal helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
    }
    this.close();
  },

  // Timer helpers
  startTimer() {
    document.dispatchEvent(new CustomEvent('timer-start'));
    this.close();
  },

  pauseTimer() {
    document.dispatchEvent(new CustomEvent('timer-pause'));
    this.close();
  },

  resetTimer() {
    document.dispatchEvent(new CustomEvent('timer-reset'));
    this.close();
  },

  startPomodoro() {
    document.dispatchEvent(new CustomEvent('timer-pomodoro'));
    this.close();
  },

  // Data helpers
  exportData() {
    document.dispatchEvent(new CustomEvent('data-export'));
    this.close();
  },

  importData() {
    document.dispatchEvent(new CustomEvent('data-import'));
    this.close();
  },

  // Theme helpers
  toggleTheme() {
    document.dispatchEvent(new CustomEvent('theme-toggle'));
    this.close();
  },

  setTheme(theme) {
    document.dispatchEvent(new CustomEvent('theme-set', { detail: { theme } }));
    this.close();
  },

  // Help helpers
  showShortcuts() {
    document.dispatchEvent(new CustomEvent('show-shortcuts'));
    this.close();
  },

  showAbout() {
    document.dispatchEvent(new CustomEvent('show-about'));
    this.close();
  },

  // Open command palette
  open() {
    const palette = document.getElementById('commandPalette');
    if (palette) {
      palette.classList.add('open');
      const input = palette.querySelector('.command-input');
      if (input) {
        input.value = '';
        input.focus();
      }
      this.renderCommands(this.commands);
    }
  },

  // Close command palette
  close() {
    const palette = document.getElementById('commandPalette');
    if (palette) {
      palette.classList.remove('open');
    }
  },

  // Render commands
  renderCommands(commands) {
    const container = document.getElementById('commandResults');
    if (!container) return;

    const grouped = this.groupByCategory(commands);
    
    let html = '';
    Object.entries(grouped).forEach(([category, cmds]) => {
      html += `<div class="command-category"><span class="category-label">${category}</span></div>`;
      cmds.forEach((cmd, index) => {
        html += `
          <div class="command-item ${index === 0 ? 'selected' : ''}" data-command-id="${cmd.id}">
            <span class="command-icon">${cmd.icon}</span>
            <div class="command-info">
              <span class="command-name">${cmd.name}</span>
              <span class="command-description">${cmd.description}</span>
            </div>
            ${cmd.shortcut ? `<span class="command-shortcut">${cmd.shortcut}</span>` : ''}
          </div>
        `;
      });
    });

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.command-item').forEach(item => {
      item.addEventListener('click', () => {
        const commandId = item.dataset.commandId;
        const command = this.commands.find(c => c.id === commandId);
        if (command && command.action) {
          command.action();
        }
      });
    });
  },

  // Get all shortcuts as array
  getShortcutsList() {
    return Object.entries(this.shortcuts).map(([key, action]) => {
      const command = this.commands.find(c => c.action === action);
      return {
        key,
        name: command?.name || 'Unknown',
        description: command?.description || ''
      };
    });
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CommandPalette };
}
