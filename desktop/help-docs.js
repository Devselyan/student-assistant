// Student Assistant Pro - Help & Documentation Module
// In-app help, tutorials, and documentation

const HelpDocs = {
  // Application info
  appInfo: {
    name: 'Student Assistant Pro',
    version: '3.0.0',
    build: '2026.03',
    author: 'Student Assistant Team',
    license: 'MIT',
    website: 'https://github.com/Devselyan/student-assistant',
    support: 'support@studentassistant.app'
  },

  // Quick start guide
  quickStart: [
    {
      step: 1,
      title: 'Add Your Classes',
      description: 'Click "My Classes" in the sidebar, then "+ Add Class" to enter your course schedule.',
      icon: '📖',
      view: 'classes'
    },
    {
      step: 2,
      title: 'Track Assignments',
      description: 'Go to "Assignments" and add your homework with due dates and priorities.',
      icon: '📝',
      view: 'assignments'
    },
    {
      step: 3,
      title: 'Schedule Exams',
      description: 'Add upcoming exams in the "Exams" section to see countdown timers.',
      icon: '📋',
      view: 'exams'
    },
    {
      step: 4,
      title: 'Use Study Timer',
      description: 'Open "Study Timer" for focused Pomodoro sessions with breaks.',
      icon: '⏱️',
      view: 'timer'
    },
    {
      step: 5,
      title: 'Take Notes',
      description: 'Create organized notes for each class in the "Notes" section.',
      icon: '📓',
      view: 'notes'
    }
  ],

  // Feature documentation
  features: {
    dashboard: {
      name: 'Dashboard',
      icon: '📊',
      description: 'Your central hub for quick overview of today\'s schedule, upcoming assignments, and study statistics.',
      tips: [
        'Check your dashboard daily for a quick overview',
        'Use Quick Timer for impromptu study sessions',
        'Click on any item to view more details'
      ],
      shortcuts: ['Ctrl+D']
    },
    classes: {
      name: 'My Classes',
      icon: '📖',
      description: 'Manage all your courses with schedules, locations, and reminders.',
      tips: [
        'Import your schedule from CSV or ICS files',
        'Set custom reminder times for each class',
        'Color-code classes for easy identification'
      ],
      shortcuts: ['Ctrl+1']
    },
    assignments: {
      name: 'Assignments',
      icon: '📝',
      description: 'Track homework, projects, and deadlines with priority levels.',
      tips: [
        'Set priorities to focus on important work first',
        'Mark assignments complete to track progress',
        'Filter by status to see what\'s pending'
      ],
      shortcuts: ['Ctrl+2']
    },
    exams: {
      name: 'Exams',
      icon: '📋',
      description: 'Schedule exams and see countdown timers to stay prepared.',
      tips: [
        'Add exam topics to guide your studying',
        'Check countdown cards for upcoming exams',
        'Set reminders days before the exam'
      ],
      shortcuts: ['Ctrl+3']
    },
    grades: {
      name: 'Grades',
      icon: '🎯',
      description: 'Record and track your grades with weighted averages and trends.',
      tips: [
        'Enter weights to calculate weighted averages',
        'View trends to see if you\'re improving',
        'Set grade goals to stay motivated'
      ],
      shortcuts: ['Ctrl+4']
    },
    calendar: {
      name: 'Calendar',
      icon: '📅',
      description: 'Visual calendar view of all your academic commitments.',
      tips: [
        'Navigate months with arrow buttons',
        'See classes, exams, and assignments together',
        'Today is highlighted for easy reference'
      ],
      shortcuts: ['Ctrl+5']
    },
    timer: {
      name: 'Study Timer',
      icon: '⏱️',
      description: 'Pomodoro-style timer for focused study sessions.',
      tips: [
        '25 minutes work, 5 minutes break is standard',
        'Take a longer break after 4 sessions',
        'Track your total study time over days'
      ],
      shortcuts: ['Ctrl+6', 'Space to start/pause']
    },
    notes: {
      name: 'Notes',
      icon: '📓',
      description: 'Organized note-taking with tags and search functionality.',
      tips: [
        'Add tags for easy organization',
        'Search notes by content or title',
        'Link notes to specific classes'
      ],
      shortcuts: ['Ctrl+7']
    },
    tasks: {
      name: 'Tasks',
      icon: '✓',
      description: 'Simple to-do list for non-academic tasks.',
      tips: [
        'Break big tasks into smaller subtasks',
        'Set priorities to focus on what matters',
        'Check off completed tasks for satisfaction'
      ],
      shortcuts: ['Ctrl+8']
    },
    settings: {
      name: 'Settings',
      icon: '⚙️',
      description: 'Customize the app to your preferences.',
      tips: [
        'Choose light or dark theme',
        'Set your accent color',
        'Configure notification preferences',
        'Export your data regularly'
      ],
      shortcuts: ['Ctrl+9', 'Ctrl+,']
    }
  },

  // Keyboard shortcuts reference
  keyboardShortcuts: {
    'Navigation': [
      { keys: 'Ctrl+K', action: 'Open Command Palette' },
      { keys: 'Ctrl+H', action: 'Open Help' },
      { keys: 'Ctrl+,', action: 'Open Settings' },
      { keys: 'Escape', action: 'Close Modal/Menu' },
      { keys: 'Ctrl+1', action: 'Go to Classes' },
      { keys: 'Ctrl+2', action: 'Go to Assignments' },
      { keys: 'Ctrl+3', action: 'Go to Exams' },
      { keys: 'Ctrl+4', action: 'Go to Grades' },
      { keys: 'Ctrl+5', action: 'Go to Calendar' },
      { keys: 'Ctrl+6', action: 'Go to Timer' },
      { keys: 'Ctrl+7', action: 'Go to Notes' },
      { keys: 'Ctrl+8', action: 'Go to Tasks' },
      { keys: 'Ctrl+9', action: 'Go to Settings' }
    ],
    'Timer': [
      { keys: 'Space', action: 'Start/Pause Timer' },
      { keys: 'R', action: 'Reset Timer' }
    ],
    'General': [
      { keys: 'Ctrl+S', action: 'Save' },
      { keys: 'Ctrl+N', action: 'New Item' },
      { keys: 'Ctrl+F', action: 'Search/Find' }
    ]
  },

  // FAQ
  faq: [
    {
      question: 'How do I import my class schedule?',
      answer: 'Go to My Classes, click "Import CSV/ICS", and select your schedule file. We support CSV and ICS formats from most school systems.'
    },
    {
      question: 'Can I use this app offline?',
      answer: 'Yes! All your data is stored locally in your browser. The desktop app works completely offline.'
    },
    {
      question: 'How do I backup my data?',
      answer: 'Go to Settings > Data Management and click "Export All Data". Save the JSON file somewhere safe.'
    },
    {
      question: 'Can I sync between devices?',
      answer: 'Currently data is stored locally. You can manually export/import data files to sync between devices.'
    },
    {
      question: 'How does the Pomodoro timer work?',
      answer: 'Study for 25 minutes, then take a 5-minute break. After 4 sessions, take a longer 15-minute break.'
    },
    {
      question: 'Where is my data stored?',
      answer: 'All data is stored in your browser\'s local storage. For the desktop app, it\'s in your user data folder.'
    },
    {
      question: 'Can I customize the theme?',
      answer: 'Yes! Go to Settings > Appearance to choose themes, accent colors, and font sizes.'
    },
    {
      question: 'How do I delete something?',
      answer: 'Each item has a delete button (🗑️ or "Delete"). Click it and confirm to remove the item.'
    }
  ],

  // Troubleshooting guide
  troubleshooting: [
    {
      problem: 'App is running slow',
      solutions: [
        'Clear browser cache',
        'Reduce the amount of stored data',
        'Disable animations in Settings',
        'Restart the application'
      ]
    },
    {
      problem: 'Notifications not working',
      solutions: [
        'Check browser notification permissions',
        'Enable notifications in Settings',
        'Check system notification settings',
        'Make sure quiet hours are not enabled'
      ]
    },
    {
      problem: 'Data not saving',
      solutions: [
        'Check browser storage permissions',
        'Ensure you have storage space available',
        'Try clearing cache and reloading',
        'Export your data as backup'
      ]
    },
    {
      problem: 'Import not working',
      solutions: [
        'Verify file format (CSV or ICS)',
        'Check that file has required columns',
        'Ensure file is not corrupted',
        'Try our template file as reference'
      ]
    }
  ],

  // Get quick start guide
  getQuickStart() {
    return this.quickStart;
  },

  // Get feature documentation
  getFeatureDoc(featureId) {
    return this.features[featureId] || null;
  },

  // Get all keyboard shortcuts
  getKeyboardShortcuts() {
    return this.keyboardShortcuts;
  },

  // Search FAQ
  searchFAQ(query) {
    if (!query) return this.faq;
    
    const normalizedQuery = query.toLowerCase();
    return this.faq.filter(faq => 
      faq.question.toLowerCase().includes(normalizedQuery) ||
      faq.answer.toLowerCase().includes(normalizedQuery)
    );
  },

  // Get troubleshooting for problem
  getTroubleshooting(problem) {
    if (!problem) return this.troubleshooting;
    
    const normalizedProblem = problem.toLowerCase();
    return this.troubleshooting.filter(t => 
      t.problem.toLowerCase().includes(normalizedProblem)
    );
  },

  // Get app info
  getAppInfo() {
    return this.appInfo;
  },

  // Generate help content for view
  getHelpForView(viewName) {
    const feature = this.features[viewName];
    if (!feature) return null;

    return {
      ...feature,
      relatedShortcuts: this.keyboardShortcuts,
      relatedFAQ: this.faq.slice(0, 3)
    };
  },

  // Export documentation
  exportDocumentation() {
    return {
      appInfo: this.appInfo,
      quickStart: this.quickStart,
      features: this.features,
      keyboardShortcuts: this.keyboardShortcuts,
      faq: this.faq,
      troubleshooting: this.troubleshooting
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HelpDocs };
}
