// Student Assistant Pro - Comprehensive Web App
// Full-featured student management system with 14 views

// ============================================================================
// STORAGE & DATA MANAGEMENT
// ============================================================================

const STORAGE_KEYS = {
  CLASSES: 'sap_classes',
  ASSIGNMENTS: 'sap_assignments',
  EXAMS: 'sap_exams',
  GRADES: 'sap_grades',
  NOTES: 'sap_notes',
  FLASHCARDS: 'sap_flashcards',
  TASKS: 'sap_tasks',
  TEACHERS: 'sap_teachers',
  ATTENDANCE: 'sap_attendance',
  RESOURCES: 'sap_resources',
  SETTINGS: 'sap_settings',
  STUDY_SESSIONS: 'sap_study_sessions',
  STREAK: 'sap_streak'
};

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'auto',
  accentColor: '#667eea',
  enableNotifications: true,
  defaultReminderMinutes: 15,
  pomodoroLength: 25,
  shortBreakLength: 5,
  longBreakLength: 15,
  sidebarCollapsed: false
};

// Data management functions
function loadData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error(`Error loading ${key}:`, err);
    return [];
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error(`Error saving ${key}:`, err);
    return false;
  }
}

function loadSettings() {
  const settings = loadData(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...settings };
}

function saveSettings(settings) {
  saveData(STORAGE_KEYS.SETTINGS, settings);
}

function exportAllData() {
  const data = {};
  Object.values(STORAGE_KEYS).forEach(key => {
    data[key] = loadData(key);
  });
  return data;
}

function importAllData(data) {
  Object.keys(data).forEach(key => {
    saveData(key, data[key]);
  });
}

function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getDaysArray() {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
}

function getDayAbbrev(day) {
  const abbrev = {
    'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed',
    'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
  };
  return abbrev[day] || day;
}

function calculateGPA(grades) {
  if (grades.length === 0) return 0;
  const total = grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0);
  return (total / grades.length).toFixed(2);
}

function getPriorityColor(priority) {
  const colors = {
    'low': '#4CAF50',
    'medium': '#FF9800',
    'high': '#f44336',
    'urgent': '#9C27B0'
  };
  return colors[priority] || '#666';
}

function getPriorityLabel(priority) {
  const labels = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent'
  };
  return labels[priority] || priority;
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

let appState = {
  currentView: 'dashboard',
  settings: DEFAULT_SETTINGS,
  classes: [],
  assignments: [],
  exams: [],
  grades: [],
  notes: [],
  flashcards: [],
  tasks: [],
  teachers: [],
  attendance: [],
  resources: [],
  studySessions: [],
  streak: 0,
  lastStudyDate: null,
  timerInterval: null,
  timerRunning: false,
  timerSeconds: 1500,
  timerMode: 'pomodoro',
  currentCalendarDate: new Date(),
  editingId: null,
  pendingImportData: null
};

// ============================================================================
// DOM ELEMENTS - NAVIGATION
// ============================================================================

let sidebar, mainContent, navItems;
let toggleSidebarBtn, themeToggle, notificationBtn;

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
  // Load all data
  appState.settings = loadSettings();
  appState.classes = loadData(STORAGE_KEYS.CLASSES);
  appState.assignments = loadData(STORAGE_KEYS.ASSIGNMENTS);
  appState.exams = loadData(STORAGE_KEYS.EXAMS);
  appState.grades = loadData(STORAGE_KEYS.GRADES);
  appState.notes = loadData(STORAGE_KEYS.NOTES);
  appState.flashcards = loadData(STORAGE_KEYS.FLASHCARDS);
  appState.tasks = loadData(STORAGE_KEYS.TASKS);
  appState.teachers = loadData(STORAGE_KEYS.TEACHERS);
  appState.attendance = loadData(STORAGE_KEYS.ATTENDANCE);
  appState.resources = loadData(STORAGE_KEYS.RESOURCES);
  appState.studySessions = loadData(STORAGE_KEYS.STUDY_SESSIONS);
  
  const streakData = loadData(STORAGE_KEYS.STREAK);
  appState.streak = streakData.streak || 0;
  appState.lastStudyDate = streakData.lastStudyDate;

  // Cache DOM elements
  sidebar = document.getElementById('sidebar');
  mainContent = document.getElementById('mainContent');
  navItems = document.querySelectorAll('.nav-item');
  toggleSidebarBtn = document.getElementById('toggleSidebar');
  themeToggle = document.getElementById('themeToggle');
  notificationBtn = document.getElementById('notificationBtn');

  // Apply settings
  applyTheme(appState.settings.theme);
  applyAccentColor(appState.settings.accentColor);
  updateStreakDisplay();

  // Setup event listeners
  setupNavigation();
  setupGlobalEventListeners();
  setupTimerEventListeners();
  setupModalEventListeners();
  setupFormEventListeners();
  setupCalendarEventListeners();
  setupFlashcardEventListeners();
  setupKeyboardShortcuts();

  // Request notification permission if enabled
  if (appState.settings.enableNotifications && 'Notification' in window) {
    Notification.requestPermission();
  }

  // Start reminder checker
  setInterval(checkReminders, 30000);

  // Initialize navigation - set Dashboard as active
  appState.currentView = 'dashboard';
  
  // Remove active class from ALL nav items first
  if (navItems) {
    navItems.forEach(item => {
      item.classList.remove('active');
    });
  }
  
  // Find and activate Dashboard nav item
  const dashboardNavItem = document.querySelector('.nav-item[data-view="dashboard"]');
  if (dashboardNavItem) {
    dashboardNavItem.classList.add('active');
  }
  
  // Hide ALL views first
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
    view.style.display = 'none';
  });
  
  // Show only Dashboard
  const dashboardView = document.getElementById('view-dashboard');
  if (dashboardView) {
    dashboardView.classList.add('active');
    dashboardView.style.display = 'block';
  }

  // Render initial view
  renderCurrentView();
  
  console.log('✅ App initialized - Dashboard active, all modals hidden');
}

function setupNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
    });
  });

  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      appState.settings.sidebarCollapsed = sidebar.classList.contains('collapsed');
      saveSettings(appState.settings);
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const themes = ['light', 'dark', 'auto'];
      const currentIndex = themes.indexOf(appState.settings.theme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      appState.settings.theme = nextTheme;
      applyTheme(nextTheme);
      saveSettings(appState.settings);
      
      const icons = { 'light': '🌙', 'dark': '☀️', 'auto': '🔄' };
      themeToggle.textContent = icons[nextTheme] || '🌙';
    });
  }

  // View all links
  document.querySelectorAll('.view-all').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.dataset.view);
    });
  });
}

function setupGlobalEventListeners() {
  // Quick action buttons
  const quickAddClass = document.getElementById('quickAddClass');
  if (quickAddClass) quickAddClass.addEventListener('click', () => openModal('classModal'));

  const quickAddAssignment = document.getElementById('quickAddAssignment');
  if (quickAddAssignment) quickAddAssignment.addEventListener('click', () => openModal('assignmentModal'));

  const quickAddExam = document.getElementById('quickAddExam');
  if (quickAddExam) quickAddExam.addEventListener('click', () => openModal('examModal'));

  const quickAddNote = document.getElementById('quickAddNote');
  if (quickAddNote) quickAddNote.addEventListener('click', () => openModal('noteModal'));

  // Add buttons in views
  const addClassBtn = document.getElementById('addClassBtn');
  if (addClassBtn) addClassBtn.addEventListener('click', () => openModal('classModal'));

  const addAssignmentBtn = document.getElementById('addAssignmentBtn');
  if (addAssignmentBtn) addAssignmentBtn.addEventListener('click', () => openModal('assignmentModal'));

  const addExamBtn = document.getElementById('addExamBtn');
  if (addExamBtn) addExamBtn.addEventListener('click', () => openModal('examModal'));

  const addGradeBtn = document.getElementById('addGradeBtn');
  if (addGradeBtn) addGradeBtn.addEventListener('click', () => openModal('gradeModal'));

  const addNoteBtn = document.getElementById('addNoteBtn');
  if (addNoteBtn) addNoteBtn.addEventListener('click', () => openModal('noteModal'));

  const addDeckBtn = document.getElementById('addDeckBtn');
  if (addDeckBtn) addDeckBtn.addEventListener('click', () => openModal('flashcardDeckModal'));

  const addTaskBtn = document.getElementById('addTaskBtn');
  if (addTaskBtn) addTaskBtn.addEventListener('click', () => openModal('taskModal'));

  const addTeacherBtn = document.getElementById('addTeacherBtn');
  if (addTeacherBtn) addTeacherBtn.addEventListener('click', () => openModal('teacherModal'));

  const addResourceBtn = document.getElementById('addResourceBtn');
  if (addResourceBtn) addResourceBtn.addEventListener('click', () => openModal('resourceModal'));

  // Search functionality
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      performSearch(e.target.value);
    }, 300));
  }

  // Settings buttons
  const exportDataBtn = document.getElementById('exportDataBtn');
  if (exportDataBtn) exportDataBtn.addEventListener('click', exportAllDataToFile);

  const importDataBtn = document.getElementById('importDataBtn');
  if (importDataBtn) {
    const importFile = document.getElementById('importDataFile');
    importDataBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', handleDataImport);
  }

  const clearAllDataBtn = document.getElementById('clearAllDataBtn');
  if (clearAllDataBtn) clearAllDataBtn.addEventListener('click', confirmClearAllData);

  // Settings changes
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.value = appState.settings.theme;
    themeSelect.addEventListener('change', (e) => {
      appState.settings.theme = e.target.value;
      applyTheme(e.target.value);
      saveSettings(appState.settings);
    });
  }

  const accentColor = document.getElementById('accentColor');
  if (accentColor) {
    accentColor.value = rgbToHex(appState.settings.accentColor);
    accentColor.addEventListener('change', (e) => {
      appState.settings.accentColor = e.target.value;
      applyAccentColor(e.target.value);
      saveSettings(appState.settings);
    });
  }

  const enableNotifications = document.getElementById('enableNotifications');
  if (enableNotifications) {
    enableNotifications.checked = appState.settings.enableNotifications;
    enableNotifications.addEventListener('change', (e) => {
      appState.settings.enableNotifications = e.target.checked;
      if (e.target.checked && 'Notification' in window) {
        Notification.requestPermission();
      }
      saveSettings(appState.settings);
    });
  }

  const defaultReminderTime = document.getElementById('defaultReminderTime');
  if (defaultReminderTime) {
    defaultReminderTime.value = appState.settings.defaultReminderMinutes;
    defaultReminderTime.addEventListener('change', (e) => {
      appState.settings.defaultReminderMinutes = parseInt(e.target.value);
      saveSettings(appState.settings);
    });
  }
}

function setupModalEventListeners() {
  // Use event delegation for modal close buttons
  document.addEventListener('click', (e) => {
    // Close button clicked
    if (e.target.classList.contains('modal-close')) {
      const modalId = e.target.dataset.modal;
      if (modalId) closeModal(modalId);
      return;
    }
    
    // Modal background clicked (outside click)
    if (e.target.classList.contains('modal') && !e.target.classList.contains('hidden')) {
      closeModal(e.target.id);
      return;
    }
    
    // Cancel button clicked (any button with data-modal attribute)
    if (e.target.dataset.modal) {
      closeModal(e.target.dataset.modal);
      return;
    }
  });

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });
}

// ============================================================================
// VIEW MANAGEMENT
// ============================================================================

function switchView(viewName) {
  appState.currentView = viewName;

  // Clear all active states first
  navItems.forEach(item => {
    item.classList.remove('active');
  });

  // Update nav items - set only the clicked one as active
  navItems.forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    }
  });

  // Hide all views first
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });

  // Show only the current view
  const currentViewEl = document.getElementById(`view-${viewName}`);
  if (currentViewEl) {
    currentViewEl.classList.add('active');
  }

  // Render the view
  renderCurrentView();
}

function renderCurrentView() {
  switch (appState.currentView) {
    case 'dashboard': renderDashboard(); break;
    case 'classes': renderClassesView(); break;
    case 'assignments': renderAssignmentsView(); break;
    case 'exams': renderExamsView(); break;
    case 'grades': renderGradesView(); break;
    case 'timer': renderTimerView(); break;
    case 'notes': renderNotesView(); break;
    case 'flashcards': renderFlashcardsView(); break;
    case 'attendance': renderAttendanceView(); break;
    case 'tasks': renderTasksView(); break;
    case 'teachers': renderTeachersView(); break;
    case 'calendar': renderCalendarView(); break;
    case 'resources': renderResourcesView(); break;
    case 'settings': renderSettingsView(); break;
  }
}

function renderAllViews() {
  renderDashboard();
  renderClassesView();
  renderAssignmentsView();
  renderExamsView();
  renderGradesView();
  renderTimerView();
  renderNotesView();
  renderFlashcardsView();
  renderAttendanceView();
  renderTasksView();
  renderTeachersView();
  renderCalendarView();
  renderResourcesView();
  renderSettingsView();
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================

function renderDashboard() {
  // Today's date
  const todayDate = document.getElementById('todayDate');
  if (todayDate) {
    todayDate.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Today's schedule
  renderTodaySchedule();

  // Upcoming assignments
  renderUpcomingAssignments();

  // Grade overview
  renderGradeOverview();

  // Study stats
  renderStudyStats();

  // Update streak
  updateStreakDisplay();
}

function renderTodaySchedule() {
  const container = document.getElementById('todaySchedule');
  if (!container) return;

  const today = new Date();
  const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = appState.classes.filter(c => c.days.includes(currentDay));

  if (todayClasses.length === 0) {
    container.innerHTML = '<p class="empty-message">No classes today! 🎉</p>';
    return;
  }

  todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

  container.innerHTML = todayClasses.map(cls => {
    const teacher = appState.teachers.find(t => t.id === cls.teacherId);
    return `
      <div class="schedule-item" style="border-left-color: ${cls.color || '#667eea'}">
        <div class="schedule-time">${formatTime(cls.startTime)} - ${formatTime(cls.endTime)}</div>
        <div class="schedule-info">
          <h4>${escapeHtml(cls.name)}</h4>
          <p>${escapeHtml(cls.location || 'Online')}</p>
          ${teacher ? `<p class="schedule-teacher">👨‍🏫 ${escapeHtml(teacher.name)}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderUpcomingAssignments() {
  const container = document.getElementById('upcomingAssignments');
  if (!container) return;

  const now = new Date();
  const upcoming = appState.assignments
    .filter(a => !a.completed && new Date(a.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  if (upcoming.length === 0) {
    container.innerHTML = '<p class="empty-message">No upcoming assignments! 🎉</p>';
    return;
  }

  container.innerHTML = upcoming.map(a => {
    const daysUntil = Math.ceil((new Date(a.dueDate) - now) / (1000 * 60 * 60 * 24));
    const urgencyClass = daysUntil <= 2 ? 'urgent' : '';
    return `
      <div class="assignment-item ${urgencyClass}">
        <div class="assignment-info">
          <h4>${escapeHtml(a.title)}</h4>
          <p>${escapeHtml(getClassName(a.classId))}</p>
        </div>
        <div class="assignment-meta">
          <span class="priority-badge" style="background: ${getPriorityColor(a.priority)}">
            ${getPriorityLabel(a.priority)}
          </span>
          <span class="due-badge ${daysUntil <= 2 ? 'overdue' : ''}">
            ${daysUntil === 0 ? 'Due today!' : daysUntil === 1 ? 'Due tomorrow' : `${daysUntil} days left`}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderGradeOverview() {
  const container = document.getElementById('gradeOverview');
  if (!container) return;

  if (appState.grades.length === 0) {
    container.innerHTML = '<p class="empty-message">No grades recorded yet</p>';
    return;
  }

  const classGrades = {};
  appState.grades.forEach(g => {
    if (!classGrades[g.classId]) classGrades[g.classId] = [];
    classGrades[g.classId].push(parseFloat(g.grade) || 0);
  });

  const summaries = Object.entries(classGrades).map(([classId, grades]) => ({
    classId,
    className: getClassName(classId),
    average: (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)
  }));

  container.innerHTML = summaries.map(s => `
    <div class="grade-summary-item">
      <span class="class-name">${escapeHtml(s.className)}</span>
      <span class="grade-value ${getGradeColorClass(s.average)}">${s.average}%</span>
    </div>
  `).join('');
}

function renderStudyStats() {
  const totalHours = document.getElementById('totalStudyHours');
  const completedAssignments = document.getElementById('completedAssignments');
  const avgGrade = document.getElementById('avgGrade');

  if (totalHours) {
    const totalMinutes = appState.studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    totalHours.textContent = (totalMinutes / 60).toFixed(1);
  }

  if (completedAssignments) {
    completedAssignments.textContent = appState.assignments.filter(a => a.completed).length;
  }

  if (avgGrade) {
    if (appState.grades.length === 0) {
      avgGrade.textContent = '-';
    } else {
      const avg = appState.grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / appState.grades.length;
      avgGrade.textContent = avg.toFixed(1) + '%';
    }
  }
}

function updateStreakDisplay() {
  const streakCount = document.getElementById('streakCount');
  if (streakCount) {
    streakCount.textContent = appState.streak;
  }
}

function updateStudyStreak() {
  const today = new Date().toDateString();
  if (appState.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (appState.lastStudyDate === yesterday.toDateString()) {
      appState.streak++;
    } else if (appState.lastStudyDate !== today) {
      appState.streak = 1;
    }
    
    appState.lastStudyDate = today;
    saveData(STORAGE_KEYS.STREAK, { streak: appState.streak, lastStudyDate: today });
    updateStreakDisplay();
  }
}

// ============================================================================
// CLASSES VIEW
// ============================================================================

function renderClassesView() {
  const grid = document.getElementById('classesGrid');
  if (!grid) return;

  if (appState.classes.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>📚 No classes yet</h3>
        <p>Import your class schedule from CSV or add classes manually</p>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
          <button class="btn btn-primary" onclick="document.getElementById('csvFileInput').click()">📁 Import CSV</button>
          <button class="btn btn-secondary" onclick="openModal('classModal')">+ Add Class Manually</button>
        </div>
        <div style="margin-top: 15px;">
          <a href="#" onclick="downloadClassTemplate(); return false;" style="color: var(--accent-color);">📥 Download CSV Template</a>
        </div>
      </div>
    `;
    
    // Setup CSV file input listener
    const csvInput = document.getElementById('csvFileInput');
    if (csvInput && !csvInput.dataset.listener) {
      csvInput.addEventListener('change', handleCSVImport);
      csvInput.dataset.listener = 'true';
    }
    return;
  }

  grid.innerHTML = `
    <div class="classes-import-bar" style="background: var(--bg-tertiary); padding: 15px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>📊 ${appState.classes.length} classes</strong> loaded
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-sm btn-secondary" onclick="downloadClassTemplate()">📥 Template</button>
        <button class="btn btn-sm btn-primary" onclick="document.getElementById('csvFileInput').click()">📁 Import CSV</button>
        <button class="btn btn-sm btn-secondary" onclick="openModal('classModal')">+ Add Class</button>
      </div>
    </div>
    ${appState.classes.map(cls => {
      const teacher = appState.teachers.find(t => t.id === cls.teacherId);
      const assignmentCount = appState.assignments.filter(a => a.classId === cls.id).length;
      const examCount = appState.exams.filter(e => e.classId === cls.id).length;
      const gradeCount = appState.grades.filter(g => g.classId === cls.id).length;

      return `
        <div class="class-card-full" style="border-top-color: ${cls.color || '#667eea'}">
          <div class="class-card-header">
            <h3>${escapeHtml(cls.name)}</h3>
            <div class="class-card-actions">
              <button class="btn-icon btn-sm" onclick="editClass('${cls.id}')" title="Edit">✏️</button>
              <button class="btn-icon btn-sm" onclick="deleteClass('${cls.id}')" title="Delete">🗑️</button>
            </div>
          </div>
          <div class="class-card-body">
            ${teacher ? `<p class="class-teacher">👨‍🏫 ${escapeHtml(teacher.name)}</p>` : ''}
            <p class="class-time">⏰ ${formatTime(cls.startTime)} - ${formatTime(cls.endTime)}</p>
            <p class="class-location">📍 ${escapeHtml(cls.location || 'Online')}</p>
            <p class="class-days">📅 ${cls.days.map(getDayAbbrev).join(', ')}</p>
          </div>
          <div class="class-card-stats">
            <span title="Assignments">📝 ${assignmentCount}</span>
            <span title="Exams">📋 ${examCount}</span>
            <span title="Grades">🎯 ${gradeCount}</span>
          </div>
        </div>
      `;
    }).join('')}
  `;

  // Setup CSV file input listener
  const csvInput = document.getElementById('csvFileInput');
  if (csvInput && !csvInput.dataset.listener) {
    csvInput.addEventListener('change', handleCSVImport);
    csvInput.dataset.listener = 'true';
  }

  // Update teacher selects in forms
  updateTeacherSelects();
}

function downloadClassTemplate() {
  const template = `Class Name,Start Time,End Time,Location,Days,Description,Reminder Minutes,Color
Mathematics 101,09:00,10:30,Room 201,Monday;Wednesday;Friday,Calculus course,15,#667eea
Physics 201,14:00,15:30,Lab 3,Tuesday;Thursday,Laboratory required,30,#f44336
English Literature,11:00,12:00,Building A,Monday;Wednesday;Friday,Shakespeare focus,15,#4CAF50
Computer Science,10:00,11:30,Online,Thursday,Programming basics,20,#FF9800`;

  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'class_schedule_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function handleCSVImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const csvText = event.target.result;
    const result = importClassesFromCSV(csvText);
    
    if (result.success) {
      if (confirm(`Found ${result.classes.length} classes in CSV. Import them?`)) {
        appState.classes.push(...result.classes);
        saveAllData();
        renderClassesView();
        alert('Classes imported successfully!');
      }
    } else {
      alert('Error importing CSV: ' + result.error);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function updateTeacherSelects() {
  const selects = ['classTeacherSelect', 'assignmentClassSelect', 'examClassSelect', 'noteClassSelect', 'gradeClassSelect', 'deckClassSelect'];
  
  const teacherSelect = document.getElementById('classTeacherSelect');
  if (teacherSelect) {
    teacherSelect.innerHTML = '<option value="">Select Teacher</option>' +
      appState.teachers.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
  }

  const classSelects = ['assignmentClassSelect', 'examClassSelect', 'noteClassSelect', 'gradeClassSelect', 'deckClassSelect'];
  classSelects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '<option value="">Select Class</option>' +
        appState.classes.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    }
  });
}

function getClassName(classId) {
  const cls = appState.classes.find(c => c.id === classId);
  return cls ? cls.name : 'Unknown Class';
}

function editClass(id) {
  const cls = appState.classes.find(c => c.id === id);
  if (!cls) return;

  appState.editingId = id;
  const form = document.getElementById('classForm');
  const title = document.getElementById('classModalTitle');
  
  if (title) title.textContent = 'Edit Class';
  if (form) {
    form.querySelector('[name="name"]').value = cls.name;
    form.querySelector('[name="teacherId"]').value = cls.teacherId || '';
    form.querySelector('[name="startTime"]').value = cls.startTime;
    form.querySelector('[name="endTime"]').value = cls.endTime;
    form.querySelector('[name="location"]').value = cls.location || '';
    form.querySelector('[name="description"]').value = cls.description || '';
    form.querySelector('[name="color"]').value = cls.color || '#667eea';
    form.querySelector('[name="reminderMinutes"]').value = cls.reminderMinutes || 15;

    // Set days
    form.querySelectorAll('input[name="days"]').forEach(cb => {
      cb.checked = cls.days.includes(cb.value);
    });
  }

  openModal('classModal');
}

function deleteClass(id) {
  if (!confirm('Are you sure you want to delete this class? This will also delete associated assignments, exams, and grades.')) return;

  appState.classes = appState.classes.filter(c => c.id !== id);
  appState.assignments = appState.assignments.filter(a => a.classId !== id);
  appState.exams = appState.exams.filter(e => e.classId !== id);
  appState.grades = appState.grades.filter(g => g.classId !== id);
  appState.notes = appState.notes.filter(n => n.classId !== id);
  appState.flashcards = appState.flashcards.filter(f => f.classId !== id);

  saveAllData();
  renderAllViews();
}

// ============================================================================
// ASSIGNMENTS VIEW
// ============================================================================

function renderAssignmentsView() {
  const list = document.getElementById('assignmentsList');
  if (!list) return;

  // Setup filter buttons
  document.querySelectorAll('.assignments-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.assignments-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFilteredAssignments(btn.dataset.filter);
    });
  });

  renderFilteredAssignments('all');
}

function renderFilteredAssignments(filter) {
  const list = document.getElementById('assignmentsList');
  if (!list) return;

  const now = new Date();
  let filtered = [...appState.assignments];

  switch (filter) {
    case 'pending':
      filtered = filtered.filter(a => !a.completed && new Date(a.dueDate) >= now);
      break;
    case 'completed':
      filtered = filtered.filter(a => a.completed);
      break;
    case 'overdue':
      filtered = filtered.filter(a => !a.completed && new Date(a.dueDate) < now);
      break;
  }

  filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><h3>No assignments</h3><p>Add an assignment to get started</p></div>';
    return;
  }

  list.innerHTML = filtered.map(a => {
    const daysUntil = Math.ceil((new Date(a.dueDate) - now) / (1000 * 60 * 60 * 24));
    const isOverdue = !a.completed && daysUntil < 0;
    const isDueSoon = !a.completed && daysUntil >= 0 && daysUntil <= 2;

    return `
      <div class="assignment-card ${a.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
        <div class="assignment-card-header">
          <div class="assignment-checkbox">
            <input type="checkbox" ${a.completed ? 'checked' : ''} onchange="toggleAssignmentComplete('${a.id}')">
          </div>
          <div class="assignment-card-info">
            <h4>${escapeHtml(a.title)}</h4>
            <p class="assignment-class">${escapeHtml(getClassName(a.classId))}</p>
            ${a.description ? `<p class="assignment-description">${escapeHtml(a.description)}</p>` : ''}
          </div>
          <div class="assignment-card-meta">
            <span class="priority-badge" style="background: ${getPriorityColor(a.priority)}">
              ${getPriorityLabel(a.priority)}
            </span>
            <span class="due-date ${isOverdue ? 'overdue' : isDueSoon ? 'soon' : ''}">
              ${isOverdue ? 'Overdue: ' : ''}${formatDate(a.dueDate)}
              ${a.dueTime ? ' by ' + formatTime(a.dueTime) : ''}
            </span>
            ${a.estimatedHours ? `<span class="estimated-hours">⏱️ ${a.estimatedHours}h</span>` : ''}
          </div>
          <div class="assignment-card-actions">
            <button class="btn-icon btn-sm" onclick="editAssignment('${a.id}')" title="Edit">✏️</button>
            <button class="btn-icon btn-sm" onclick="deleteAssignment('${a.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleAssignmentComplete(id) {
  const assignment = appState.assignments.find(a => a.id === id);
  if (assignment) {
    assignment.completed = !assignment.completed;
    if (assignment.completed) {
      updateStudyStreak();
      // Add to study session
      appState.studySessions.push({
        id: generateId(),
        type: 'assignment',
        title: assignment.title,
        duration: (assignment.estimatedHours || 1) * 60,
        date: new Date().toISOString()
      });
    }
    saveAllData();
    renderFilteredAssignments(document.querySelector('.assignments-filters .filter-btn.active')?.dataset.filter || 'all');
    renderDashboard();
  }
}

function editAssignment(id) {
  const a = appState.assignments.find(ass => ass.id === id);
  if (!a) return;

  appState.editingId = id;
  const form = document.getElementById('assignmentForm');
  const title = document.getElementById('assignmentModalTitle');
  
  if (title) title.textContent = 'Edit Assignment';
  if (form) {
    form.querySelector('[name="title"]').value = a.title;
    form.querySelector('[name="classId"]').value = a.classId;
    form.querySelector('[name="priority"]').value = a.priority || 'medium';
    form.querySelector('[name="dueDate"]').value = a.dueDate;
    form.querySelector('[name="dueTime"]').value = a.dueTime || '23:59';
    form.querySelector('[name="description"]').value = a.description || '';
    form.querySelector('[name="estimatedHours"]').value = a.estimatedHours || '';
  }

  openModal('assignmentModal');
}

function deleteAssignment(id) {
  if (!confirm('Delete this assignment?')) return;
  appState.assignments = appState.assignments.filter(a => a.id !== id);
  saveAllData();
  renderAllViews();
}

// ============================================================================
// EXAMS VIEW
// ============================================================================

function renderExamsView() {
  const countdown = document.getElementById('examsCountdown');
  const list = document.getElementById('examsList');
  
  if (!countdown || !list) return;

  const now = new Date();
  const upcomingExams = appState.exams
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastExams = appState.exams
    .filter(e => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Render countdown cards
  if (upcomingExams.length === 0) {
    countdown.innerHTML = '<div class="empty-state"><h3>No upcoming exams</h3><p>Enjoy your break! 🎉</p></div>';
  } else {
    countdown.innerHTML = upcomingExams.slice(0, 3).map(e => {
      const daysUntil = Math.ceil((new Date(e.date) - now) / (1000 * 60 * 60 * 24));
      return `
        <div class="exam-countdown-card" style="border-left-color: ${getClassColor(e.classId)}">
          <div class="exam-days">${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}</div>
          <div class="exam-title">${escapeHtml(e.title)}</div>
          <div class="exam-class">${escapeHtml(getClassName(e.classId))}</div>
          <div class="exam-date">${formatDate(e.date)}</div>
        </div>
      `;
    }).join('');
  }

  // Render full list
  if (appState.exams.length === 0) {
    list.innerHTML = '<div class="empty-state"><h3>No exams scheduled</h3><p>Add an exam to track your schedule</p></div>';
  } else {
    list.innerHTML = appState.exams.map(e => {
      const daysUntil = Math.ceil((new Date(e.date) - now) / (1000 * 60 * 60 * 24));
      const isPast = daysUntil < 0;

      return `
        <div class="exam-item ${isPast ? 'past' : ''}" style="border-left-color: ${getClassColor(e.classId)}">
          <div class="exam-item-info">
            <h4>${escapeHtml(e.title)}</h4>
            <p>${escapeHtml(getClassName(e.classId))}</p>
            ${e.topics ? `<p class="exam-topics">📚 ${escapeHtml(e.topics)}</p>` : ''}
          </div>
          <div class="exam-item-meta">
            <span class="exam-type-badge">${e.type || 'Exam'}</span>
            <span class="exam-date">${formatDate(e.date)}${e.time ? ' at ' + formatTime(e.time) : ''}</span>
            ${e.location ? `<span class="exam-location">📍 ${escapeHtml(e.location)}</span>` : ''}
            ${!isPast ? `<span class="exam-countdown">${daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days left`}</span>` : ''}
          </div>
          <div class="exam-item-actions">
            <button class="btn-icon btn-sm" onclick="editExam('${e.id}')" title="Edit">✏️</button>
            <button class="btn-icon btn-sm" onclick="deleteExam('${e.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

function getClassColor(classId) {
  const cls = appState.classes.find(c => c.id === classId);
  return cls?.color || '#667eea';
}

function editExam(id) {
  const e = appState.exams.find(exam => exam.id === id);
  if (!e) return;

  appState.editingId = id;
  const form = document.getElementById('examForm');
  const title = document.getElementById('examModalTitle');
  
  if (title) title.textContent = 'Edit Exam';
  if (form) {
    form.querySelector('[name="title"]').value = e.title;
    form.querySelector('[name="classId"]').value = e.classId;
    form.querySelector('[name="type"]').value = e.type || 'midterm';
    form.querySelector('[name="date"]').value = e.date;
    form.querySelector('[name="time"]').value = e.time || '';
    form.querySelector('[name="location"]').value = e.location || '';
    form.querySelector('[name="topics"]').value = e.topics || '';
  }

  openModal('examModal');
}

function deleteExam(id) {
  if (!confirm('Delete this exam?')) return;
  appState.exams = appState.exams.filter(e => e.id !== id);
  saveAllData();
  renderAllViews();
}

// ============================================================================
// GRADES VIEW
// ============================================================================

function renderGradesView() {
  const summary = document.getElementById('gradesSummary');
  const list = document.getElementById('gradesList');
  
  if (!summary || !list) return;

  // Calculate per-class averages
  const classGrades = {};
  appState.classes.forEach(cls => {
    const grades = appState.grades.filter(g => g.classId === cls.id);
    if (grades.length > 0) {
      const avg = grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / grades.length;
      classGrades[cls.id] = {
        className: cls.name,
        color: cls.color,
        average: avg.toFixed(1),
        count: grades.length
      };
    }
  });

  // Render summary cards
  if (Object.keys(classGrades).length === 0) {
    summary.innerHTML = '<div class="empty-state"><h3>No grades yet</h3><p>Add grades to track your performance</p></div>';
  } else {
    summary.innerHTML = Object.entries(classGrades).map(([id, data]) => `
      <div class="grade-summary-card" style="border-top-color: ${data.color}">
        <div class="grade-summary-class">${escapeHtml(data.className)}</div>
        <div class="grade-summary-average ${getGradeColorClass(data.average)}">${data.average}%</div>
        <div class="grade-summary-count">${data.count} grade${data.count > 1 ? 's' : ''}</div>
      </div>
    `).join('');
  }

  // Calculate overall GPA
  const overallGPA = appState.grades.length > 0 
    ? (appState.grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / appState.grades.length).toFixed(2)
    : 'N/A';

  // Render grades list
  const sortedGrades = [...appState.grades].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (sortedGrades.length === 0) {
    list.innerHTML = '<div class="empty-state"><h3>No grades recorded</h3><p>Add your first grade</p></div>';
  } else {
    list.innerHTML = `
      <div class="gpa-display">
        <span class="gpa-label">Overall Average:</span>
        <span class="gpa-value ${getGradeColorClass(overallGPA)}">${overallGPA}%</span>
      </div>
      <table class="grades-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Assignment/Exam</th>
            <th>Grade</th>
            <th>Weight</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${sortedGrades.map(g => `
            <tr>
              <td>${escapeHtml(getClassName(g.classId))}</td>
              <td>${escapeHtml(g.name)}</td>
              <td class="grade-cell ${getGradeColorClass(g.grade)}">${g.grade}%</td>
              <td>${g.weight ? g.weight + '%' : '-'}</td>
              <td>${g.date ? formatDate(g.date) : '-'}</td>
              <td>
                <button class="btn-icon btn-sm" onclick="editGrade('${g.id}')" title="Edit">✏️</button>
                <button class="btn-icon btn-sm" onclick="deleteGrade('${g.id}')" title="Delete">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

function getGradeColorClass(grade) {
  const g = parseFloat(grade);
  if (g >= 90) return 'grade-a';
  if (g >= 80) return 'grade-b';
  if (g >= 70) return 'grade-c';
  if (g >= 60) return 'grade-d';
  return 'grade-f';
}

function editGrade(id) {
  const g = appState.grades.find(grade => grade.id === id);
  if (!g) return;

  appState.editingId = id;
  const form = document.getElementById('gradeForm');
  const title = document.getElementById('gradeModalTitle');
  
  if (title) title.textContent = 'Edit Grade';
  if (form) {
    form.querySelector('[name="classId"]').value = g.classId;
    form.querySelector('[name="name"]').value = g.name;
    form.querySelector('[name="grade"]').value = g.grade;
    form.querySelector('[name="weight"]').value = g.weight || '';
    form.querySelector('[name="date"]').value = g.date || '';
  }

  openModal('gradeModal');
}

function deleteGrade(id) {
  if (!confirm('Delete this grade?')) return;
  appState.grades = appState.grades.filter(g => g.id !== id);
  saveAllData();
  renderAllViews();
}

// ============================================================================
// STUDY TIMER VIEW
// ============================================================================

function renderTimerView() {
  const display = document.getElementById('mainTimerDisplay');
  if (display) {
    display.textContent = formatTimerDisplay(appState.timerSeconds);
  }

  // Setup timer mode buttons
  document.querySelectorAll('.timer-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timer-mode').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setTimerMode(btn.dataset.mode);
    });
  });

  // Timer settings
  const pomodoroLength = document.getElementById('pomodoroLength');
  const shortBreakLength = document.getElementById('shortBreakLength');
  const longBreakLength = document.getElementById('longBreakLength');

  if (pomodoroLength) pomodoroLength.value = appState.settings.pomodoroLength;
  if (shortBreakLength) shortBreakLength.value = appState.settings.shortBreakLength;
  if (longBreakLength) longBreakLength.value = appState.settings.longBreakLength;

  pomodoroLength?.addEventListener('change', (e) => {
    appState.settings.pomodoroLength = parseInt(e.target.value);
    saveSettings(appState.settings);
    if (appState.timerMode === 'pomodoro' && !appState.timerRunning) {
      appState.timerSeconds = appState.settings.pomodoroLength * 60;
      renderTimerView();
    }
  });

  shortBreakLength?.addEventListener('change', (e) => {
    appState.settings.shortBreakLength = parseInt(e.target.value);
    saveSettings(appState.settings);
    if (appState.timerMode === 'short' && !appState.timerRunning) {
      appState.timerSeconds = appState.settings.shortBreakLength * 60;
      renderTimerView();
    }
  });

  longBreakLength?.addEventListener('change', (e) => {
    appState.settings.longBreakLength = parseInt(e.target.value);
    saveSettings(appState.settings);
    if (appState.timerMode === 'long' && !appState.timerRunning) {
      appState.timerSeconds = appState.settings.longBreakLength * 60;
      renderTimerView();
    }
  });

  // Render sessions
  renderTimerSessions();
}

function setupTimerEventListeners() {
  const startBtn = document.getElementById('mainTimerStart');
  const pauseBtn = document.getElementById('mainTimerPause');
  const resetBtn = document.getElementById('mainTimerReset');

  startBtn?.addEventListener('click', startTimer);
  pauseBtn?.addEventListener('click', pauseTimer);
  resetBtn?.addEventListener('click', resetTimer);

  // Quick timer
  const quickStart = document.getElementById('quickTimerStart');
  const quickReset = document.getElementById('quickTimerReset');

  quickStart?.addEventListener('click', () => {
    if (appState.timerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  quickReset?.addEventListener('click', () => {
    resetTimer();
    const quickDisplay = document.getElementById('quickTimerDisplay');
    if (quickDisplay) {
      quickDisplay.textContent = formatTimerDisplay(appState.timerSeconds);
    }
  });
}

function setTimerMode(mode) {
  appState.timerMode = mode;
  
  const durations = {
    'pomodoro': appState.settings.pomodoroLength * 60,
    'short': appState.settings.shortBreakLength * 60,
    'long': appState.settings.longBreakLength * 60,
    'custom': 60 * 60 // 1 hour default
  };

  appState.timerSeconds = durations[mode] || durations.pomodoro;
  
  if (!appState.timerRunning) {
    renderTimerView();
  }
}

function startTimer() {
  if (appState.timerRunning) return;
  
  appState.timerRunning = true;
  updateStudyStreak();
  
  const startBtn = document.getElementById('quickTimerStart');
  if (startBtn) startBtn.textContent = 'Pause';

  appState.timerInterval = setInterval(() => {
    appState.timerSeconds--;
    
    const display = document.getElementById('mainTimerDisplay');
    const quickDisplay = document.getElementById('quickTimerDisplay');
    
    if (display) display.textContent = formatTimerDisplay(appState.timerSeconds);
    if (quickDisplay) quickDisplay.textContent = formatTimerDisplay(appState.timerSeconds);

    if (appState.timerSeconds <= 0) {
      completeTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (!appState.timerRunning) return;
  
  clearInterval(appState.timerInterval);
  appState.timerRunning = false;
  
  const startBtn = document.getElementById('quickTimerStart');
  if (startBtn) startBtn.textContent = 'Start';
}

function resetTimer() {
  pauseTimer();
  setTimerMode(appState.timerMode);
  
  const startBtn = document.getElementById('quickTimerStart');
  if (startBtn) startBtn.textContent = 'Start';
}

function completeTimer() {
  pauseTimer();
  
  // Play notification sound or show notification
  if (appState.settings.enableNotifications && 'Notification' in window) {
    new Notification('⏱️ Timer Complete!', {
      body: appState.timerMode === 'pomodoro' ? 'Time to take a break!' : 'Break\'s over! Ready to study?',
      icon: 'icon-192.svg'
    });
  }

  // Record study session
  if (appState.timerMode === 'pomodoro') {
    appState.studySessions.push({
      id: generateId(),
      type: 'pomodoro',
      duration: appState.settings.pomodoroLength,
      date: new Date().toISOString()
    });
    saveData(STORAGE_KEYS.STUDY_SESSIONS, appState.studySessions);
    renderDashboard();
  }

  // Auto-switch mode
  if (appState.timerMode === 'pomodoro') {
    setTimerMode('short');
  } else {
    setTimerMode('pomodoro');
  }
  
  renderTimerView();
}

function renderTimerSessions() {
  const container = document.getElementById('timerSessions');
  if (!container) return;

  const today = new Date().toDateString();
  const todaySessions = appState.studySessions.filter(s => 
    s.type === 'pomodoro' && new Date(s.date).toDateString() === today
  );

  const totalMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  if (todaySessions.length === 0) {
    container.innerHTML = '<p class="empty-message">No sessions today</p>';
  } else {
    container.innerHTML = `
      <div class="session-summary">Today: ${todaySessions.length} sessions (${(totalMinutes / 60).toFixed(1)} hours)</div>
    `;
  }
}

function formatTimerDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// NOTES VIEW
// ============================================================================

function renderNotesView() {
  const grid = document.getElementById('notesGrid');
  const search = document.getElementById('notesSearch');
  const classFilter = document.getElementById('notesClassFilter');

  if (!grid) return;

  // Setup search and filter
  search?.addEventListener('input', () => renderFilteredNotes());
  classFilter?.addEventListener('change', () => renderFilteredNotes());

  // Populate class filter
  if (classFilter) {
    classFilter.innerHTML = '<option value="">All Classes</option>' +
      appState.classes.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  }

  renderFilteredNotes();
}

function renderFilteredNotes() {
  const grid = document.getElementById('notesGrid');
  const search = document.getElementById('notesSearch');
  const classFilter = document.getElementById('notesClassFilter');

  if (!grid) return;

  let filtered = [...appState.notes];

  if (search?.value) {
    const query = search.value.toLowerCase();
    filtered = filtered.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.content.toLowerCase().includes(query) ||
      n.tags?.toLowerCase().includes(query)
    );
  }

  if (classFilter?.value) {
    filtered = filtered.filter(n => n.classId === classFilter.value);
  }

  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>No notes</h3><p>Create your first note</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(n => {
    const cls = appState.classes.find(c => c.id === n.classId);
    const preview = n.content.substring(0, 150) + (n.content.length > 150 ? '...' : '');
    
    return `
      <div class="note-card" onclick="viewNote('${n.id}')">
        <div class="note-card-header">
          <h4>${escapeHtml(n.title)}</h4>
          ${cls ? `<span class="note-class-badge" style="background: ${cls.color}">${escapeHtml(cls.name)}</span>` : ''}
        </div>
        <div class="note-card-body">
          <p>${escapeHtml(preview)}</p>
        </div>
        <div class="note-card-footer">
          <span class="note-date">${formatDate(n.createdAt)}</span>
          ${n.tags ? `<span class="note-tags">${escapeHtml(n.tags)}</span>` : ''}
        </div>
        <div class="note-card-actions">
          <button class="btn-icon btn-sm" onclick="event.stopPropagation(); editNote('${n.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-sm" onclick="event.stopPropagation(); deleteNote('${n.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function viewNote(id) {
  const note = appState.notes.find(n => n.id === id);
  if (!note) return;

  const modal = document.getElementById('viewNoteModal');
  const title = document.getElementById('viewNoteTitle');
  const content = document.getElementById('noteViewContent');

  if (title) title.textContent = note.title;
  if (content) {
    const cls = appState.classes.find(c => c.id === note.classId);
    content.innerHTML = `
      ${cls ? `<p class="note-meta-class" style="color: ${cls.color}">📖 ${escapeHtml(cls.name)}</p>` : ''}
      ${note.tags ? `<p class="note-meta-tags">🏷️ ${escapeHtml(note.tags)}</p>` : ''}
      <p class="note-meta-date">Created: ${formatDate(note.createdAt)}</p>
      <div class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
    `;
  }

  openModal('viewNoteModal');
}

function editNote(id) {
  const n = appState.notes.find(note => note.id === id);
  if (!n) return;

  appState.editingId = id;
  const form = document.getElementById('noteForm');
  const title = document.getElementById('noteModalTitle');
  
  if (title) title.textContent = 'Edit Note';
  if (form) {
    form.querySelector('[name="title"]').value = n.title;
    form.querySelector('[name="classId"]').value = n.classId || '';
    form.querySelector('[name="tags"]').value = n.tags || '';
    form.querySelector('[name="content"]').value = n.content;
  }

  openModal('noteModal');
}

function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  appState.notes = appState.notes.filter(n => n.id !== id);
  saveAllData();
  renderAllViews();
}

// ============================================================================
// FLASHCARDS VIEW
// ============================================================================

function renderFlashcardsView() {
  const grid = document.getElementById('decksGrid');
  if (!grid) return;

  if (appState.flashcards.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>No flashcard decks</h3><p>Create your first deck</p></div>';
    return;
  }

  grid.innerHTML = appState.flashcards.map(deck => {
    const cls = appState.classes.find(c => c.id === deck.classId);
    const cardCount = deck.cards?.length || 0;
    
    return `
      <div class="deck-card">
        <div class="deck-card-header">
          <h3>${escapeHtml(deck.name)}</h3>
          <div class="deck-card-actions">
            <button class="btn-icon btn-sm" onclick="studyDeck('${deck.id}')" title="Study">📖</button>
            <button class="btn-icon btn-sm" onclick="editDeck('${deck.id}')" title="Edit">✏️</button>
            <button class="btn-icon btn-sm" onclick="deleteDeck('${deck.id}')" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="deck-card-body">
          ${cls ? `<p class="deck-class" style="color: ${cls.color}">${escapeHtml(cls.name)}</p>` : ''}
          <p class="deck-count">🃏 ${cardCount} cards</p>
        </div>
      </div>
    `;
  }).join('');
}

function setupFlashcardEventListeners() {
  const addCardBtn = document.getElementById('addFlashcardBtn');
  addCardBtn?.addEventListener('click', addFlashcardInput);
}

function addFlashcardInput() {
  const list = document.getElementById('flashcardList');
  if (!list) return;

  const index = list.querySelectorAll('.flashcard-input').length;
  const cardHtml = `
    <div class="flashcard-input">
      <div class="form-row">
        <div class="form-group">
          <label>Question</label>
          <textarea name="cards[${index}][question]" rows="2" required></textarea>
        </div>
        <div class="form-group">
          <label>Answer</label>
          <textarea name="cards[${index}][answer]" rows="2" required></textarea>
        </div>
      </div>
      <button type="button" class="btn-icon btn-sm" onclick="this.parentElement.parentElement.remove()">🗑️</button>
    </div>
  `;
  
  list.insertAdjacentHTML('beforeend', cardHtml);
}

function studyDeck(id) {
  const deck = appState.flashcards.find(d => d.id === id);
  if (!deck || !deck.cards || deck.cards.length === 0) return;

  appState.currentDeck = { ...deck, currentIndex: 0, correct: 0, incorrect: 0 };
  
  const title = document.getElementById('flashcardDeckTitle');
  if (title) title.textContent = deck.name;

  showFlashcard();
  openModal('flashcardStudyModal');
}

function showFlashcard() {
  const deck = appState.currentDeck;
  if (!deck) return;

  const card = deck.cards[deck.currentIndex];
  const question = document.getElementById('flashcardQuestion');
  const answer = document.getElementById('flashcardAnswer');
  const progress = document.getElementById('flashcardProgress');

  if (question) question.textContent = card.question;
  if (answer) answer.textContent = card.answer;
  if (progress) progress.textContent = `${deck.currentIndex + 1}/${deck.cards.length}`;

  // Reset flip state
  const flashcard = document.getElementById('studyFlashcard');
  if (flashcard) flashcard.classList.remove('flipped');
}

function flipFlashcard() {
  const flashcard = document.getElementById('studyFlashcard');
  if (flashcard) flashcard.classList.toggle('flipped');
}

function markFlashcard(correct) {
  const deck = appState.currentDeck;
  if (!deck) return;

  if (correct) deck.correct++;
  else deck.incorrect++;

  deck.currentIndex++;

  if (deck.currentIndex >= deck.cards.length) {
    // Show results
    alert(`Study complete!\n\nCorrect: ${deck.correct}\nIncorrect: ${deck.incorrect}\nScore: ${Math.round(deck.correct / deck.cards.length * 100)}%`);
    closeModal('flashcardStudyModal');
  } else {
    showFlashcard();
  }
}

function editDeck(id) {
  const deck = appState.flashcards.find(d => d.id === id);
  if (!deck) return;

  appState.editingId = id;
  const form = document.getElementById('flashcardDeckForm');
  const title = document.getElementById('flashcardDeckModalTitle');
  const list = document.getElementById('flashcardList');

  if (title) title.textContent = 'Edit Deck';
  if (form) {
    form.querySelector('[name="name"]').value = deck.name;
    form.querySelector('[name="classId"]').value = deck.classId || '';
  }

  // Populate existing cards
  if (list) {
    list.innerHTML = '';
    (deck.cards || []).forEach((card, index) => {
      const cardHtml = `
        <div class="flashcard-input">
          <div class="form-row">
            <div class="form-group">
              <label>Question</label>
              <textarea name="cards[${index}][question]" rows="2" required>${escapeHtml(card.question)}</textarea>
            </div>
            <div class="form-group">
              <label>Answer</label>
              <textarea name="cards[${index}][answer]" rows="2" required>${escapeHtml(card.answer)}</textarea>
            </div>
          </div>
          <button type="button" class="btn-icon btn-sm" onclick="this.parentElement.parentElement.remove()">🗑️</button>
        </div>
      `;
      list.insertAdjacentHTML('beforeend', cardHtml);
    });
  }

  openModal('flashcardDeckModal');
}

function deleteDeck(id) {
  if (!confirm('Delete this deck?')) return;
  appState.flashcards = appState.flashcards.filter(d => d.id !== id);
  saveAllData();
  renderAllViews();
}

// ============================================================================
// ATTENDANCE VIEW
// ============================================================================

function renderAttendanceView() {
  const summary = document.getElementById('attendanceSummary');
  const list = document.getElementById('attendanceList');

  if (!summary || !list) return;

  // Calculate attendance per class
  const classAttendance = {};
  appState.classes.forEach(cls => {
    const records = appState.attendance.filter(r => r.classId === cls.id);
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;

    if (total > 0) {
      classAttendance[cls.id] = {
        className: cls.name,
        color: cls.color,
        total,
        present,
        absent,
        late,
        percentage: ((present + late * 0.5) / total * 100).toFixed(1)
      };
    }
  });

  // Render summary
  if (Object.keys(classAttendance).length === 0) {
    summary.innerHTML = '<div class="empty-state"><h3>No attendance records</h3><p>Track your attendance for each class</p></div>';
  } else {
    summary.innerHTML = Object.entries(classAttendance).map(([id, data]) => `
      <div class="attendance-summary-card" style="border-left-color: ${data.color}">
        <div class="attendance-class">${escapeHtml(data.className)}</div>
        <div class="attendance-percentage ${getAttendanceColorClass(data.percentage)}">${data.percentage}%</div>
        <div class="attendance-stats">
          <span class="present">✅ ${data.present}</span>
          <span class="late">⚠️ ${data.late}</span>
          <span class="absent">❌ ${data.absent}</span>
        </div>
      </div>
    `).join('');
  }

  // Render detailed list by class
  if (appState.classes.length === 0) {
    list.innerHTML = '<div class="empty-state"><h3>No classes</h3><p>Add classes to track attendance</p></div>';
  } else {
    list.innerHTML = appState.classes.map(cls => {
      const records = appState.attendance.filter(r => r.classId === cls.id);
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      
      return `
        <div class="attendance-class-section">
          <div class="attendance-class-header" style="border-left-color: ${cls.color}">
            <h4>${escapeHtml(cls.name)}</h4>
            <div class="attendance-actions">
              <button class="btn btn-sm btn-primary" onclick="markAttendance('${cls.id}', 'present')">✅ Present</button>
              <button class="btn btn-sm btn-secondary" onclick="markAttendance('${cls.id}', 'late')">⚠️ Late</button>
              <button class="btn btn-sm btn-danger" onclick="markAttendance('${cls.id}', 'absent')">❌ Absent</button>
            </div>
          </div>
          ${total > 0 ? `
            <div class="attendance-progress">
              <div class="attendance-bar">
                <div class="attendance-fill" style="width: ${(present / total * 100)}%"></div>
              </div>
              <span class="attendance-count">${present}/${total} classes attended</span>
            </div>
          ` : '<p class="no-records">No records yet</p>'}
        </div>
      `;
    }).join('');
  }
}

function getAttendanceColorClass(percentage) {
  const p = parseFloat(percentage);
  if (p >= 90) return 'attendance-a';
  if (p >= 75) return 'attendance-b';
  if (p >= 60) return 'attendance-c';
  return 'attendance-d';
}

function markAttendance(classId, status) {
  appState.attendance.push({
    id: generateId(),
    classId,
    status,
    date: new Date().toISOString()
  });
  saveData(STORAGE_KEYS.ATTENDANCE, appState.attendance);
  renderAttendanceView();
}

// ============================================================================
// TASKS VIEW
// ============================================================================

function renderTasksView() {
  const list = document.getElementById('tasksList');
  if (!list) return;

  // Setup filter buttons
  document.querySelectorAll('.tasks-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tasks-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFilteredTasks(btn.dataset.filter);
    });
  });

  renderFilteredTasks('all');
}

function renderFilteredTasks(filter) {
  const list = document.getElementById('tasksList');
  if (!list) return;

  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  let filtered = [...appState.tasks];

  switch (filter) {
    case 'today':
      filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString());
      break;
    case 'week':
      filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= weekFromNow);
      break;
    case 'completed':
      filtered = filtered.filter(t => t.completed);
      break;
  }

  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    return 0;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><h3>No tasks</h3><p>Add a task to get started</p></div>';
    return;
  }

  list.innerHTML = filtered.map(t => {
    const isOverdue = !t.completed && t.dueDate && new Date(t.dueDate) < now;
    
    return `
      <div class="task-item ${t.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
        <div class="task-checkbox">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskComplete('${t.id}')">
        </div>
        <div class="task-info">
          <h4>${escapeHtml(t.title)}</h4>
          ${t.notes ? `<p class="task-notes">${escapeHtml(t.notes)}</p>` : ''}
          <div class="task-meta">
            ${t.dueDate ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">📅 ${formatDate(t.dueDate)}</span>` : ''}
            <span class="task-priority" style="color: ${getPriorityColor(t.priority)}">⚡ ${getPriorityLabel(t.priority)}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon btn-sm" onclick="editTask('${t.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-sm" onclick="deleteTask('${t.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleTaskComplete(id) {
  const task = appState.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    if (task.completed) updateStudyStreak();
    saveAllData();
    renderFilteredTasks(document.querySelector('.tasks-filters .filter-btn.active')?.dataset.filter || 'all');
  }
}

function editTask(id) {
  const t = appState.tasks.find(task => task.id === id);
  if (!t) return;

  appState.editingId = id;
  const form = document.getElementById('taskForm');
  const title = document.getElementById('taskModalTitle');
  
  if (title) title.textContent = 'Edit Task';
  if (form) {
    form.querySelector('[name="title"]').value = t.title;
    form.querySelector('[name="dueDate"]').value = t.dueDate || '';
    form.querySelector('[name="priority"]').value = t.priority || 'medium';
    form.querySelector('[name="notes"]').value = t.notes || '';
  }

  openModal('taskModal');
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  appState.tasks = appState.tasks.filter(t => t.id !== id);
  saveAllData();
  renderAllViews();
}

// ============================================================================
// TEACHERS VIEW
// ============================================================================

function renderTeachersView() {
  const grid = document.getElementById('teachersGrid');
  if (!grid) return;

  if (appState.teachers.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>No teachers</h3><p>Add your teachers to keep track of contact info</p></div>';
    return;
  }

  grid.innerHTML = appState.teachers.map(t => `
    <div class="teacher-card">
      <div class="teacher-card-header">
        <div class="teacher-avatar">
          <span>${t.name.charAt(0).toUpperCase()}</span>
        </div>
        <div class="teacher-card-actions">
          <button class="btn-icon btn-sm" onclick="editTeacher('${t.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-sm" onclick="deleteTeacher('${t.id}')" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="teacher-card-body">
        <h3>${escapeHtml(t.name)}</h3>
        ${t.email ? `<p class="teacher-email">📧 <a href="mailto:${escapeHtml(t.email)}">${escapeHtml(t.email)}</a></p>` : ''}
        ${t.office ? `<p class="teacher-office">🏢 ${escapeHtml(t.office)}</p>` : ''}
        ${t.officeHours ? `<p class="teacher-hours">🕐 ${escapeHtml(t.officeHours)}</p>` : ''}
        ${t.phone ? `<p class="teacher-phone">📱 ${escapeHtml(t.phone)}</p>` : ''}
      </div>
    </div>
  `).join('');

  updateTeacherSelects();
}

function editTeacher(id) {
  const t = appState.teachers.find(teacher => teacher.id === id);
  if (!t) return;

  appState.editingId = id;
  const form = document.getElementById('teacherForm');
  const title = document.getElementById('teacherModalTitle');
  
  if (title) title.textContent = 'Edit Teacher';
  if (form) {
    form.querySelector('[name="name"]').value = t.name;
    form.querySelector('[name="email"]').value = t.email || '';
    form.querySelector('[name="office"]').value = t.office || '';
    form.querySelector('[name="officeHours"]').value = t.officeHours || '';
    form.querySelector('[name="phone"]').value = t.phone || '';
  }

  openModal('teacherModal');
}

function deleteTeacher(id) {
  if (!confirm('Delete this teacher?')) return;
  appState.teachers = appState.teachers.filter(t => t.id !== id);
  // Also remove teacher references from classes
  appState.classes.forEach(c => {
    if (c.teacherId === id) c.teacherId = '';
  });
  saveAllData();
  renderAllViews();
}

// ============================================================================
// CALENDAR VIEW
// ============================================================================

function renderCalendarView() {
  const container = document.getElementById('calendarContainer');
  const monthYear = document.getElementById('currentMonthYear');
  
  if (!container) return;

  const year = appState.currentCalendarDate.getFullYear();
  const month = appState.currentCalendarDate.getMonth();

  if (monthYear) {
    monthYear.textContent = new Date(year, month).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay(); // 0 = Sunday
  const totalDays = lastDay.getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Get all events for this month
  const events = [];
  
  // Add classes
  appState.classes.forEach(cls => {
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (cls.days.includes(dayName)) {
        events.push({
          date: day,
          type: 'class',
          title: cls.name,
          color: cls.color,
          time: cls.startTime
        });
      }
    }
  });

  // Add assignments
  appState.assignments.forEach(a => {
    const dueDate = new Date(a.dueDate);
    if (dueDate.getFullYear() === year && dueDate.getMonth() === month) {
      events.push({
        date: dueDate.getDate(),
        type: 'assignment',
        title: a.title,
        color: getPriorityColor(a.priority),
        classId: a.classId
      });
    }
  });

  // Add exams
  appState.exams.forEach(e => {
    const examDate = new Date(e.date);
    if (examDate.getFullYear() === year && examDate.getMonth() === month) {
      events.push({
        date: examDate.getDate(),
        type: 'exam',
        title: e.title,
        color: getClassColor(e.classId)
      });
    }
  });

  // Build calendar
  let html = '<div class="calendar-grid">';
  
  // Day headers
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
    html += `<div class="calendar-day-header">${day}</div>`;
  });

  // Empty cells for days before first day
  for (let i = 0; i < startDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // Days of month
  for (let day = 1; day <= totalDays; day++) {
    const dayEvents = events.filter(e => e.date === day);
    const isToday = isCurrentMonth && day === today.getDate();

    html += `
      <div class="calendar-day ${isToday ? 'today' : ''}">
        <div class="calendar-day-number ${isToday ? 'today' : ''}">${day}</div>
        <div class="calendar-day-events">
          ${dayEvents.slice(0, 4).map(e => `
            <div class="calendar-event" style="background: ${e.color}" title="${escapeHtml(e.title)}">
              ${e.time ? e.time + ' ' : ''}${escapeHtml(e.title)}
            </div>
          `).join('')}
          ${dayEvents.length > 4 ? `<div class="calendar-event-more">+${dayEvents.length - 4} more</div>` : ''}
        </div>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
}

function setupCalendarEventListeners() {
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');

  prevBtn?.addEventListener('click', () => {
    appState.currentCalendarDate.setMonth(appState.currentCalendarDate.getMonth() - 1);
    renderCalendarView();
  });

  nextBtn?.addEventListener('click', () => {
    appState.currentCalendarDate.setMonth(appState.currentCalendarDate.getMonth() + 1);
    renderCalendarView();
  });
}

// ============================================================================
// RESOURCES VIEW
// ============================================================================

function renderResourcesView() {
  const list = document.getElementById('resourcesList');
  if (!list) return;

  if (appState.resources.length === 0) {
    list.innerHTML = '<div class="empty-state"><h3>No resources</h3><p>Add links, files, and materials</p></div>';
    return;
  }

  list.innerHTML = appState.resources.map(r => {
    const cls = appState.classes.find(c => c.id === r.classId);
    
    return `
      <div class="resource-item" style="border-left-color: ${cls?.color || '#667eea'}">
        <div class="resource-info">
          <h4>${escapeHtml(r.title)}</h4>
          ${cls ? `<p class="resource-class">${escapeHtml(cls.name)}</p>` : ''}
          ${r.description ? `<p class="resource-description">${escapeHtml(r.description)}</p>` : ''}
          ${r.url ? `<a href="${escapeHtml(r.url)}" target="_blank" class="resource-link">🔗 Open Link</a>` : ''}
        </div>
        <div class="resource-actions">
          <button class="btn-icon btn-sm" onclick="editResource('${r.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-sm" onclick="deleteResource('${r.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function editResource(id) {
  const r = appState.resources.find(res => res.id === id);
  if (!r) return;

  appState.editingId = id;
  // Would need a resource modal - for now just alert
  alert('Edit resource: ' + r.title);
}

function deleteResource(id) {
  if (!confirm('Delete this resource?')) return;
  appState.resources = appState.resources.filter(r => r.id !== id);
  saveAllData();
  renderAllViews();
}

// ============================================================================
// SETTINGS VIEW
// ============================================================================

function renderSettingsView() {
  // Settings are rendered once during init
  // This function can be used to refresh if needed
}

// ============================================================================
// FORM SUBMISSION HANDLERS
// ============================================================================

function setupFormEventListeners() {
  // Class form
  const classForm = document.getElementById('classForm');
  classForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveClassFromForm();
  });

  // Assignment form
  const assignmentForm = document.getElementById('assignmentForm');
  assignmentForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveAssignmentFromForm();
  });

  // Exam form
  const examForm = document.getElementById('examForm');
  examForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveExamFromForm();
  });

  // Grade form
  const gradeForm = document.getElementById('gradeForm');
  gradeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveGradeFromForm();
  });

  // Note form
  const noteForm = document.getElementById('noteForm');
  noteForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveNoteFromForm();
  });

  // Task form
  const taskForm = document.getElementById('taskForm');
  taskForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTaskFromForm();
  });

  // Teacher form
  const teacherForm = document.getElementById('teacherForm');
  teacherForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTeacherFromForm();
  });

  // Flashcard deck form
  const flashcardDeckForm = document.getElementById('flashcardDeckForm');
  flashcardDeckForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveFlashcardDeckFromForm();
  });

  // Resource form
  const resourceForm = document.getElementById('resourceForm');
  resourceForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveResourceFromForm();
  });

  // Edit note button
  const editNoteBtn = document.getElementById('editNoteBtn');
  editNoteBtn?.addEventListener('click', () => {
    const modal = document.getElementById('viewNoteModal');
    const noteId = modal?.dataset.noteId;
    if (noteId) editNote(noteId);
  });
}

function saveClassFromForm() {
  const form = document.getElementById('classForm');
  if (!form) return;

  const formData = new FormData(form);
  const days = Array.from(form.querySelectorAll('input[name="days"]:checked')).map(cb => cb.value);

  if (days.length === 0) {
    alert('Please select at least one day');
    return;
  }

  const classData = {
    name: formData.get('name'),
    teacherId: formData.get('teacherId') || '',
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    location: formData.get('location') || '',
    description: formData.get('description') || '',
    days,
    color: formData.get('color') || '#667eea',
    reminderMinutes: parseInt(formData.get('reminderMinutes')) || 15
  };

  if (appState.editingId) {
    const index = appState.classes.findIndex(c => c.id === appState.editingId);
    if (index !== -1) {
      appState.classes[index] = { ...appState.classes[index], ...classData };
    }
  } else {
    classData.id = generateId();
    appState.classes.push(classData);
  }

  saveAllData();
  closeModal('classModal');
  form.reset();
  appState.editingId = null;
  renderAllViews();
}

function saveAssignmentFromForm() {
  const form = document.getElementById('assignmentForm');
  if (!form) return;

  const formData = new FormData(form);
  
  const assignmentData = {
    title: formData.get('title'),
    classId: formData.get('classId'),
    priority: formData.get('priority') || 'medium',
    dueDate: formData.get('dueDate'),
    dueTime: formData.get('dueTime') || '23:59',
    description: formData.get('description') || '',
    estimatedHours: parseFloat(formData.get('estimatedHours')) || null,
    completed: false
  };

  if (appState.editingId) {
    const index = appState.assignments.findIndex(a => a.id === appState.editingId);
    if (index !== -1) {
      appState.assignments[index] = { ...appState.assignments[index], ...assignmentData };
    }
  } else {
    assignmentData.id = generateId();
    appState.assignments.push(assignmentData);
  }

  saveAllData();
  closeModal('assignmentModal');
  form.reset();
  appState.editingId = null;
  renderAllViews();
}

function saveExamFromForm() {
  const form = document.getElementById('examForm');
  if (!form) return;

  const formData = new FormData(form);
  
  const examData = {
    title: formData.get('title'),
    classId: formData.get('classId'),
    type: formData.get('type') || 'midterm',
    date: formData.get('date'),
    time: formData.get('time') || '',
    location: formData.get('location') || '',
    topics: formData.get('topics') || ''
  };

  if (appState.editingId) {
    const index = appState.exams.findIndex(e => e.id === appState.editingId);
    if (index !== -1) {
      appState.exams[index] = { ...appState.exams[index], ...examData };
    }
  } else {
    examData.id = generateId();
    appState.exams.push(examData);
  }

  saveAllData();
  closeModal('examModal');
  form.reset();
  appState.editingId = null;
  renderAllViews();
}

function saveGradeFromForm() {
  const form = document.getElementById('gradeForm');
  if (!form) return;

  const formData = new FormData(form);
  
  const gradeData = {
    classId: formData.get('classId'),
    name: formData.get('name'),
    grade: formData.get('grade'),
    weight: parseFloat(formData.get('weight')) || null,
    date: formData.get('date') || ''
  };

  if (appState.editingId) {
    const index = appState.grades.findIndex(g => g.id === appState.editingId);
    if (index !== -1) {
      appState.grades[index] = { ...appState.grades[index], ...gradeData };
    }
  } else {
    gradeData.id = generateId();
    appState.grades.push(gradeData);
  }

  saveAllData();
  closeModal('gradeModal');
  form.reset();
  appState.editingId = null;
  renderAllViews();
}

function saveNoteFromForm() {
  const form = document.getElementById('noteForm');
  if (!form) return;

  const formData = new FormData(form);
  
  const noteData = {
    title: formData.get('title'),
    classId: formData.get('classId') || '',
    tags: formData.get('tags') || '',
    content: formData.get('content'),
    createdAt: new Date().toISOString()
  };

  if (appState.editingId) {
    const index = appState.notes.findIndex(n => n.id === appState.editingId);
    if (index !== -1) {
      appState.notes[index] = { ...appState.notes[index], ...noteData, createdAt: appState.notes[index].createdAt };
    }
  } else {
    noteData.id = generateId();
    appState.notes.push(noteData);
  }

  saveAllData();
  closeModal('noteModal');
  form.reset();
  appState.editingId = null;
  renderAllViews();
}

function saveTaskFromForm() {
  const form = document.getElementById('taskForm');
  if (!form) return;

  const formData = new FormData(form);
  
  const taskData = {
    title: formData.get('title'),
    dueDate: formData.get('dueDate') || '',
    priority: formData.get('priority') || 'medium',
    notes: formData.get('notes') || '',
    completed: false
  };

  if (appState.editingId) {
    const index = appState.tasks.findIndex(t => t.id === appState.editingId);
    if (index !== -1) {
      appState.tasks[index] = { ...appState.tasks[index], ...taskData };
    }
  } else {
    taskData.id = generateId();
    appState.tasks.push(taskData);
  }

  saveAllData();
  closeModal('taskModal');
  form.reset();
  appState.editingId = null;
  renderAllViews();
}

function saveTeacherFromForm() {
  const form = document.getElementById('teacherForm');
  if (!form) return;

  const formData = new FormData(form);
  
  const teacherData = {
    name: formData.get('name'),
    email: formData.get('email') || '',
    office: formData.get('office') || '',
    officeHours: formData.get('officeHours') || '',
    phone: formData.get('phone') || ''
  };

  if (appState.editingId) {
    const index = appState.teachers.findIndex(t => t.id === appState.editingId);
    if (index !== -1) {
      appState.teachers[index] = { ...appState.teachers[index], ...teacherData };
    }
  } else {
    teacherData.id = generateId();
    appState.teachers.push(teacherData);
  }

  saveAllData();
  closeModal('teacherModal');
  form.reset();
  appState.editingId = null;
  renderAllViews();
}

function saveFlashcardDeckFromForm() {
  const form = document.getElementById('flashcardDeckForm');
  if (!form) return;

  const formData = new FormData(form);
  
  const cards = [];
  let index = 0;
  while (formData.has(`cards[${index}][question]`)) {
    const question = formData.get(`cards[${index}][question]`);
    const answer = formData.get(`cards[${index}][answer]`);
    if (question && answer) {
      cards.push({ question, answer });
    }
    index++;
  }

  const deckData = {
    name: formData.get('name'),
    classId: formData.get('classId') || '',
    cards
  };

  if (appState.editingId) {
    const index = appState.flashcards.findIndex(d => d.id === appState.editingId);
    if (index !== -1) {
      appState.flashcards[index] = { ...appState.flashcards[index], ...deckData };
    }
  } else {
    deckData.id = generateId();
    appState.flashcards.push(deckData);
  }

  saveAllData();
  closeModal('flashcardDeckModal');
  form.reset();
  appState.editingId = null;
  document.getElementById('flashcardList').innerHTML = '';
  renderAllViews();
}

function saveResourceFromForm() {
  const form = document.getElementById('resourceForm');
  if (!form) return;

  const formData = new FormData(form);
  
  const resourceData = {
    title: formData.get('title'),
    classId: formData.get('classId') || '',
    type: formData.get('type') || 'link',
    url: formData.get('url') || '',
    description: formData.get('description') || '',
    tags: formData.get('tags') || '',
    createdAt: new Date().toISOString()
  };

  if (appState.editingId) {
    const index = appState.resources.findIndex(r => r.id === appState.editingId);
    if (index !== -1) {
      appState.resources[index] = { ...appState.resources[index], ...resourceData };
    }
  } else {
    resourceData.id = generateId();
    appState.resources.push(resourceData);
  }

  saveAllData();
  closeModal('resourceModal');
  form.reset();
  appState.editingId = null;
  renderAllViews();
}

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

function showGradeAnalytics() {
  const modal = document.getElementById('gradeAnalyticsModal');
  if (!modal) return;

  renderOverallPerformance();
  renderGradeTrendChart();
  renderClassComparison();
  
  openModal('gradeAnalyticsModal');
}

function renderOverallPerformance() {
  const container = document.getElementById('overallPerformance');
  if (!container) return;

  if (appState.grades.length === 0) {
    container.innerHTML = '<p class="empty-message">No grades recorded yet</p>';
    return;
  }

  const totalGrades = appState.grades.length;
  const avgGrade = appState.grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / totalGrades;
  const highestGrade = Math.max(...appState.grades.map(g => parseFloat(g.grade) || 0));
  const lowestGrade = Math.min(...appState.grades.map(g => parseFloat(g.grade) || 0));
  const above90 = appState.grades.filter(g => parseFloat(g.grade) >= 90).length;
  const passRate = ((appState.grades.filter(g => parseFloat(g.grade) >= 60).length / totalGrades) * 100).toFixed(1);

  container.innerHTML = `
    <div class="analytics-card">
      <div class="analytics-value ${getGradeColorClass(avgGrade)}">${avgGrade.toFixed(1)}%</div>
      <div class="analytics-label">Average Grade</div>
    </div>
    <div class="analytics-card">
      <div class="analytics-value">${totalGrades}</div>
      <div class="analytics-label">Total Grades</div>
    </div>
    <div class="analytics-card">
      <div class="analytics-value grade-a">${highestGrade}%</div>
      <div class="analytics-label">Highest</div>
    </div>
    <div class="analytics-card">
      <div class="analytics-value grade-f">${lowestGrade}%</div>
      <div class="analytics-label">Lowest</div>
    </div>
    <div class="analytics-card">
      <div class="analytics-value">${above90}</div>
      <div class="analytics-label">A Grades (90%+)</div>
    </div>
    <div class="analytics-card">
      <div class="analytics-value">${passRate}%</div>
      <div class="analytics-label">Pass Rate</div>
    </div>
  `;
}

function renderGradeTrendChart() {
  const container = document.getElementById('gradeTrendChart');
  if (!container) return;

  if (appState.grades.length === 0) {
    container.innerHTML = '<p class="empty-message">No grades to show trend</p>';
    return;
  }

  // Group grades by date (last 10 entries)
  const sortedGrades = [...appState.grades]
    .filter(g => g.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10);

  if (sortedGrades.length === 0) {
    container.innerHTML = '<p class="empty-message">Add dates to grades to see trends</p>';
    return;
  }

  const maxGrade = 100;
  
  container.innerHTML = `
    <div class="grade-trend-points">
      ${sortedGrades.map(g => {
        const height = (parseFloat(g.grade) / maxGrade) * 100;
        const date = new Date(g.date);
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `
          <div class="trend-point">
            <div class="trend-value">${g.grade}%</div>
            <div class="trend-bar" style="height: ${height}%"></div>
            <div class="trend-label">${label}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderClassComparison() {
  const container = document.getElementById('classComparison');
  if (!container) return;

  const classGrades = {};
  appState.grades.forEach(g => {
    if (!classGrades[g.classId]) classGrades[g.classId] = [];
    classGrades[g.classId].push(parseFloat(g.grade) || 0);
  });

  if (Object.keys(classGrades).length === 0) {
    container.innerHTML = '<p class="empty-message">No grades by class</p>';
    return;
  }

  container.innerHTML = Object.entries(classGrades).map(([classId, grades]) => {
    const avg = (grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(1);
    const cls = appState.classes.find(c => c.id === classId);
    const color = cls?.color || '#667eea';
    
    return `
      <div class="class-compare-item">
        <div class="class-compare-name">${escapeHtml(cls?.name || 'Unknown Class')}</div>
        <div class="class-compare-bar">
          <div class="class-compare-fill" style="width: ${avg}%; background: ${color}"></div>
        </div>
        <div class="class-compare-value ${getGradeColorClass(avg)}">${avg}%</div>
      </div>
    `;
  }).join('');
}

function showStudyAnalytics() {
  const modal = document.getElementById('studyAnalyticsModal');
  if (!modal) return;

  renderStudyOverview();
  renderWeeklyActivity();
  renderSessionsList();
  
  openModal('studyAnalyticsModal');
}

function renderStudyOverview() {
  const totalMinutes = appState.studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalSessions = appState.studySessions.length;
  const avgSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  document.getElementById('totalStudyTime').textContent = `${totalHours}h`;
  document.getElementById('totalSessions').textContent = totalSessions;
  document.getElementById('avgSessionLength').textContent = `${avgSession}m`;
  document.getElementById('currentStreak').textContent = appState.streak;
}

function renderWeeklyActivity() {
  const container = document.getElementById('weeklyActivityChart');
  if (!container) return;

  const today = new Date();
  const weekData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    
    const daySessions = appState.studySessions.filter(s => 
      new Date(s.date).toDateString() === dateStr
    );
    
    const totalMinutes = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    weekData.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: totalMinutes,
      hours: (totalMinutes / 60).toFixed(1)
    });
  }

  const maxMinutes = Math.max(...weekData.map(d => d.minutes), 60);

  container.innerHTML = `
    <div class="weekly-bars">
      ${weekData.map(d => {
        const height = (d.minutes / maxMinutes) * 120;
        return `
          <div class="weekly-bar-container">
            <div class="weekly-bar-value">${d.hours}h</div>
            <div class="weekly-bar" style="height: ${Math.max(height, 5)}px"></div>
            <div class="weekly-bar-label">${d.day}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderSessionsList() {
  const container = document.getElementById('sessionsList');
  if (!container) return;

  const recentSessions = [...appState.studySessions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  if (recentSessions.length === 0) {
    container.innerHTML = '<p class="empty-message">No study sessions recorded</p>';
    return;
  }

  container.innerHTML = recentSessions.map(s => {
    const date = new Date(s.date);
    return `
      <div class="session-item">
        <div class="session-info">
          <div class="session-title">${s.type === 'pomodoro' ? '🍅 Pomodoro Session' : '📝 Assignment Completed'}</div>
          <div class="session-date">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div class="session-duration">${s.duration} min</div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

function exportGradesToCSV() {
  if (appState.grades.length === 0) {
    alert('No grades to export');
    return;
  }

  let csv = 'Class,Assignment/Exam Name,Grade,Weight (%),Date\n';
  appState.grades.forEach(g => {
    const cls = appState.classes.find(c => c.id === g.classId);
    csv += `"${cls?.name || 'Unknown'}","${g.name}",${g.grade},${g.weight || ''},${g.date || ''}\n`;
  });

  downloadFile(csv, 'grades_export.csv', 'text/csv');
}

function exportAssignmentsToCSV() {
  if (appState.assignments.length === 0) {
    alert('No assignments to export');
    return;
  }

  let csv = 'Title,Class,Priority,Due Date,Due Time,Status,Estimated Hours\n';
  appState.assignments.forEach(a => {
    const cls = appState.classes.find(c => c.id === a.classId);
    csv += `"${a.title}","${cls?.name || 'Unknown'}",${a.priority},${a.dueDate},${a.dueTime || '23:59'},${a.completed ? 'Completed' : 'Pending'},${a.estimatedHours || ''}\n`;
  });

  downloadFile(csv, 'assignments_export.csv', 'text/csv');
}

function exportClassesToCSV() {
  if (appState.classes.length === 0) {
    alert('No classes to export');
    return;
  }

  let csv = 'Class Name,Start Time,End Time,Location,Days,Teacher,Color,Reminder (min)\n';
  appState.classes.forEach(c => {
    const teacher = appState.teachers.find(t => t.id === c.teacherId);
    csv += `"${c.name}",${c.startTime},${c.endTime},"${c.location || ''}","${c.days.join(';')}","${teacher?.name || ''}",${c.color},${c.reminderMinutes}\n`;
  });

  downloadFile(csv, 'classes_export.csv', 'text/csv');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

function openSearch() {
  const modal = document.getElementById('globalSearchModal');
  if (modal) {
    openModal('globalSearchModal');
    const input = document.getElementById('globalSearchInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    document.getElementById('searchResults').innerHTML = `
      <div class="search-hint">
        <p>Start typing to search across all your data</p>
        <p class="search-shortcuts">
          <kbd>c</kbd> Classes | 
          <kbd>a</kbd> Assignments | 
          <kbd>e</kbd> Exams | 
          <kbd>n</kbd> Notes | 
          <kbd>t</kbd> Tasks
        </p>
      </div>
    `;
  }
}

function performSearch(query) {
  const resultsContainer = document.getElementById('searchResults');
  if (!query || query.length < 2) {
    resultsContainer.innerHTML = `
      <div class="search-hint">
        <p>Type at least 2 characters to search</p>
      </div>
    `;
    return;
  }

  const results = {
    classes: searchClasses(query),
    assignments: searchAssignments(query),
    exams: searchExams(query),
    notes: searchNotes(query),
    tasks: searchTasks(query),
    teachers: searchTeachers(query),
    resources: searchResources(query)
  };

  let html = '';
  
  if (results.classes.length > 0) {
    html += `
      <div class="search-result-section">
        <h4>📖 Classes (${results.classes.length})</h4>
        ${results.classes.map(c => `
          <div class="search-result-item" onclick="switchView('classes'); closeModal('globalSearchModal')">
            <h5>${escapeHtml(c.name)}</h5>
            <p>⏰ ${formatTime(c.startTime)} - ${formatTime(c.endTime)} | 📅 ${c.days.map(getDayAbbrev).join(', ')}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (results.assignments.length > 0) {
    html += `
      <div class="search-result-section">
        <h4>📝 Assignments (${results.assignments.length})</h4>
        ${results.assignments.map(a => `
          <div class="search-result-item" onclick="switchView('assignments'); closeModal('globalSearchModal')">
            <h5>${escapeHtml(a.title)}</h5>
            <p>${escapeHtml(getClassName(a.classId))} | Due: ${formatDate(a.dueDate)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (results.exams.length > 0) {
    html += `
      <div class="search-result-section">
        <h4>📋 Exams (${results.exams.length})</h4>
        ${results.exams.map(e => `
          <div class="search-result-item" onclick="switchView('exams'); closeModal('globalSearchModal')">
            <h5>${escapeHtml(e.title)}</h5>
            <p>${escapeHtml(getClassName(e.classId))} | ${formatDate(e.date)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (results.notes.length > 0) {
    html += `
      <div class="search-result-section">
        <h4>📓 Notes (${results.notes.length})</h4>
        ${results.notes.map(n => `
          <div class="search-result-item" onclick="viewNote('${n.id}'); closeModal('globalSearchModal'); openModal('viewNoteModal')">
            <h5>${escapeHtml(n.title)}</h5>
            <p>${escapeHtml(n.content.substring(0, 80))}...</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (results.tasks.length > 0) {
    html += `
      <div class="search-result-section">
        <h4>✓ Tasks (${results.tasks.length})</h4>
        ${results.tasks.map(t => `
          <div class="search-result-item" onclick="switchView('tasks'); closeModal('globalSearchModal')">
            <h5>${escapeHtml(t.title)}</h5>
            <p>${t.dueDate ? 'Due: ' + formatDate(t.dueDate) : 'No due date'} | ${t.completed ? '✅ Completed' : '⏳ Pending'}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (results.teachers.length > 0) {
    html += `
      <div class="search-result-section">
        <h4>👨‍🏫 Teachers (${results.teachers.length})</h4>
        ${results.teachers.map(t => `
          <div class="search-result-item" onclick="switchView('teachers'); closeModal('globalSearchModal')">
            <h5>${escapeHtml(t.name)}</h5>
            <p>${t.email || t.office || 'No contact info'}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (results.resources.length > 0) {
    html += `
      <div class="search-result-section">
        <h4>📁 Resources (${results.resources.length})</h4>
        ${results.resources.map(r => `
          <div class="search-result-item" onclick="switchView('resources'); closeModal('globalSearchModal')">
            <h5>${escapeHtml(r.title)}</h5>
            <p>${escapeHtml(r.description || r.url || 'No description')}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (html === '') {
    html = `
      <div class="search-no-results">
        <p>No results found for "${escapeHtml(query)}"</p>
        <p>Try different keywords or check spelling</p>
      </div>
    `;
  }

  resultsContainer.innerHTML = html;
}

function searchClasses(query) {
  const q = query.toLowerCase();
  return appState.classes.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q) ||
    c.location?.toLowerCase().includes(q)
  );
}

function searchAssignments(query) {
  const q = query.toLowerCase();
  return appState.assignments.filter(a => 
    a.title.toLowerCase().includes(q) ||
    a.description?.toLowerCase().includes(q)
  );
}

function searchExams(query) {
  const q = query.toLowerCase();
  return appState.exams.filter(e => 
    e.title.toLowerCase().includes(q) ||
    e.topics?.toLowerCase().includes(q) ||
    e.location?.toLowerCase().includes(q)
  );
}

function searchNotes(query) {
  const q = query.toLowerCase();
  return appState.notes.filter(n => 
    n.title.toLowerCase().includes(q) ||
    n.content.toLowerCase().includes(q) ||
    n.tags?.toLowerCase().includes(q)
  );
}

function searchTasks(query) {
  const q = query.toLowerCase();
  return appState.tasks.filter(t => 
    t.title.toLowerCase().includes(q) ||
    t.notes?.toLowerCase().includes(q)
  );
}

function searchTeachers(query) {
  const q = query.toLowerCase();
  return appState.teachers.filter(t => 
    t.name.toLowerCase().includes(q) ||
    t.email?.toLowerCase().includes(q) ||
    t.office?.toLowerCase().includes(q)
  );
}

function searchResources(query) {
  const q = query.toLowerCase();
  return appState.resources.filter(r => 
    r.title.toLowerCase().includes(q) ||
    r.description?.toLowerCase().includes(q) ||
    r.tags?.toLowerCase().includes(q)
  );
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K - Open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
      return;
    }

    // Ctrl+H or Cmd+H - Open help
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      openModal('quickHelpModal');
      return;
    }

    // Ctrl+D or Cmd+D - Go to dashboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      switchView('dashboard');
      return;
    }

    // Number keys 1-9 to switch views
    if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[1-9]$/.test(e.key)) {
      const views = ['dashboard', 'classes', 'assignments', 'exams', 'grades', 'timer', 'notes', 'flashcards', 'attendance'];
      const index = parseInt(e.key) - 1;
      if (views[index]) {
        e.preventDefault();
        switchView(views[index]);
        return;
      }
    }

    // Slash to focus search
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      openSearch();
      return;
    }
  });
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

function validateClass(classData) {
  const errors = [];
  
  if (!classData.name || classData.name.trim() === '') {
    errors.push('Class name is required');
  }
  
  if (!classData.startTime || classData.startTime === '') {
    errors.push('Start time is required');
  }
  
  if (!classData.endTime || classData.endTime === '') {
    errors.push('End time is required');
  }
  
  if (classData.startTime && classData.endTime && classData.startTime >= classData.endTime) {
    errors.push('End time must be after start time');
  }
  
  if (!classData.days || classData.days.length === 0) {
    errors.push('At least one day must be selected');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateAssignment(assignmentData) {
  const errors = [];
  
  if (!assignmentData.title || assignmentData.title.trim() === '') {
    errors.push('Assignment title is required');
  }
  
  if (!assignmentData.classId || assignmentData.classId === '') {
    errors.push('Please select a class');
  }
  
  if (!assignmentData.dueDate || assignmentData.dueDate === '') {
    errors.push('Due date is required');
  }
  
  const dueDate = new Date(assignmentData.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dueDate < today) {
    errors.push('Due date cannot be in the past');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateExam(examData) {
  const errors = [];
  
  if (!examData.title || examData.title.trim() === '') {
    errors.push('Exam title is required');
  }
  
  if (!examData.classId || examData.classId === '') {
    errors.push('Please select a class');
  }
  
  if (!examData.date || examData.date === '') {
    errors.push('Exam date is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateGrade(gradeData) {
  const errors = [];
  
  if (!gradeData.classId || gradeData.classId === '') {
    errors.push('Please select a class');
  }
  
  if (!gradeData.name || gradeData.name.trim() === '') {
    errors.push('Assignment/exam name is required');
  }
  
  if (!gradeData.grade || gradeData.grade === '') {
    errors.push('Grade is required');
  }
  
  const grade = parseFloat(gradeData.grade);
  if (isNaN(grade) || grade < 0 || grade > 100) {
    errors.push('Grade must be between 0 and 100');
  }
  
  if (gradeData.weight) {
    const weight = parseFloat(gradeData.weight);
    if (isNaN(weight) || weight < 0 || weight > 100) {
      errors.push('Weight must be between 0 and 100');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateNote(noteData) {
  const errors = [];
  
  if (!noteData.title || noteData.title.trim() === '') {
    errors.push('Note title is required');
  }
  
  if (!noteData.content || noteData.content.trim() === '') {
    errors.push('Note content is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateFlashcardDeck(deckData) {
  const errors = [];
  
  if (!deckData.name || deckData.name.trim() === '') {
    errors.push('Deck name is required');
  }
  
  if (!deckData.cards || deckData.cards.length === 0) {
    errors.push('At least one flashcard is required');
  }
  
  deckData.cards?.forEach((card, index) => {
    if (!card.question || card.question.trim() === '') {
      errors.push(`Card ${index + 1}: Question is required`);
    }
    if (!card.answer || card.answer.trim() === '') {
      errors.push(`Card ${index + 1}: Answer is required`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  const startDiff = start - now;
  const endDiff = end - now;
  
  const startInDays = Math.ceil(startDiff / (1000 * 60 * 60 * 24));
  const endInDays = Math.ceil(endDiff / (1000 * 60 * 60 * 24));
  
  if (startInDays < 0) return 'Started';
  if (startInDays === 0) return 'Today';
  if (startInDays === 1) return 'Tomorrow';
  if (startInDays <= 7) return `In ${startInDays} days`;
  
  return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDaysUntil(date) {
  const target = new Date(date);
  const now = new Date();
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function isTomorrow(date) {
  const d = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toDateString() === tomorrow.toDateString();
}

function isOverdue(date) {
  const d = new Date(date);
  const now = new Date();
  return d < now;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function pluralize(count, singular, plural) {
  return count === 1 ? singular : (plural || singular + 's');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ============================================================================
// PRINT FUNCTIONS
// ============================================================================

function printGradeReport() {
  const printWindow = window.open('', '_blank');
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const classGrades = {};
  appState.grades.forEach(g => {
    if (!classGrades[g.classId]) classGrades[g.classId] = [];
    classGrades[g.classId].push(g);
  });

  let content = `
    <html>
    <head>
      <title>Grade Report - ${today}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background: #667eea; color: white; }
        tr:nth-child(even) { background: #f5f5f5; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-value { font-size: 2rem; font-weight: bold; color: #667eea; }
        .summary-label { color: #666; margin-top: 5px; }
        .date { color: #888; font-size: 0.9rem; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>📊 Grade Report</h1>
      <p class="date">Generated: ${today}</p>
      
      <div class="summary">
        <div class="summary-card">
          <div class="summary-value">${appState.grades.length}</div>
          <div class="summary-label">Total Grades</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${calculateGPA(appState.grades)}%</div>
          <div class="summary-label">Overall Average</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${Object.keys(classGrades).length}</div>
          <div class="summary-label">Classes</div>
        </div>
      </div>
  `;

  Object.entries(classGrades).forEach(([classId, grades]) => {
    const cls = appState.classes.find(c => c.id === classId);
    const avg = (grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / grades.length).toFixed(1);
    
    content += `
      <h2>${escapeHtml(cls?.name || 'Unknown Class')} - Average: ${avg}%</h2>
      <table>
        <thead>
          <tr>
            <th>Assignment/Exam</th>
            <th>Grade</th>
            <th>Weight</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${grades.map(g => `
            <tr>
              <td>${escapeHtml(g.name)}</td>
              <td>${g.grade}%</td>
              <td>${g.weight ? g.weight + '%' : '-'}</td>
              <td>${g.date ? formatDate(g.date) : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  });

  content += `
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.print();
}

function printSchedule() {
  const printWindow = window.open('', '_blank');
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  let content = `
    <html>
    <head>
      <title>Class Schedule - ${today}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .day-section { margin: 30px 0; page-break-inside: avoid; }
        .day-title { background: #667eea; color: white; padding: 10px 15px; font-size: 1.2rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .no-classes { padding: 20px; color: #888; font-style: italic; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>📅 Class Schedule</h1>
      <p class="date">Generated: ${today}</p>
  `;

  days.forEach(day => {
    const dayClasses = appState.classes.filter(c => c.days.includes(day));
    dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    content += `
      <div class="day-section">
        <div class="day-title">${day}</div>
        ${dayClasses.length === 0 
          ? '<div class="no-classes">No classes scheduled</div>'
          : `
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Class</th>
                  <th>Location</th>
                  <th>Teacher</th>
                </tr>
              </thead>
              <tbody>
                ${dayClasses.map(c => {
                  const teacher = appState.teachers.find(t => t.id === c.teacherId);
                  return `
                    <tr>
                      <td>${formatTime(c.startTime)} - ${formatTime(c.endTime)}</td>
                      <td>${escapeHtml(c.name)}</td>
                      <td>${escapeHtml(c.location || 'Online')}</td>
                      <td>${teacher ? escapeHtml(teacher.name) : '-'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `
        }
      </div>
    `;
  });

  content += `
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.print();
}

// ============================================================================
// DASHBOARD WIDGETS
// ============================================================================

function renderQuickStats() {
  const today = new Date();
  const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Today's classes count
  const todayClassesCount = appState.classes.filter(c => c.days.includes(currentDay)).length;
  
  // Assignments due this week
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const assignmentsDueThisWeek = appState.assignments.filter(a => {
    const dueDate = new Date(a.dueDate);
    return !a.completed && dueDate >= today && dueDate <= weekFromNow;
  }).length;
  
  // Exams this month
  const monthFromNow = new Date();
  monthFromNow.setMonth(monthFromNow.getMonth() + 1);
  const examsThisMonth = appState.exams.filter(e => {
    const examDate = new Date(e.date);
    return examDate >= today && examDate <= monthFromNow;
  }).length;
  
  // Attendance rate
  const totalAttendance = appState.attendance.length;
  const presentCount = appState.attendance.filter(a => a.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 100;
  
  return {
    todayClasses: todayClassesCount,
    assignmentsDueThisWeek,
    examsThisMonth,
    attendanceRate
  };
}

function getMotivationalQuote() {
  const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }
  ];
  
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  return quotes[dayOfYear % quotes.length];
}

// ============================================================================
// DATA MIGRATION
// ============================================================================

function migrateData() {
  const currentVersion = localStorage.getItem('appVersion') || '1.0';
  const appVersion = '2.0';
  
  if (currentVersion !== appVersion) {
    console.log(`Migrating data from ${currentVersion} to ${appVersion}`);
    
    // Migration logic for future versions
    // Example: Add new fields, transform data structures, etc.
    
    localStorage.setItem('appVersion', appVersion);
    console.log('Migration complete');
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

function trackAction(actionType, data) {
  const action = {
    type: actionType,
    timestamp: new Date().toISOString(),
    data
  };
  
  // Store last 100 actions for debugging
  let actions = JSON.parse(localStorage.getItem('appActions') || '[]');
  actions.push(action);
  if (actions.length > 100) actions = actions.slice(-100);
  localStorage.setItem('appActions', JSON.stringify(actions));
}

function getUsageStats() {
  const actions = JSON.parse(localStorage.getItem('appActions') || '[]');
  const stats = {};
  
  actions.forEach(action => {
    stats[action.type] = (stats[action.type] || 0) + 1;
  });
  
  return {
    totalActions: actions.length,
    byType: stats,
    lastAction: actions[actions.length - 1]?.timestamp || null
  };
}

// ============================================================================
// ADDITIONAL EXPORT FUNCTIONS
// ============================================================================

function exportToICalendar() {
  if (appState.classes.length === 0) {
    alert('No classes to export');
    return;
  }

  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Student Assistant Pro//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n';

  appState.classes.forEach(cls => {
    const [startHour, startMin] = cls.startTime.split(':').map(Number);
    const [endHour, endMin] = cls.endTime.split(':').map(Number);

    cls.days.forEach(day => {
      const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
      const dayNum = dayMap[day];
      const today = new Date();
      const nextOccurrence = new Date(today);
      nextOccurrence.setDate(today.getDate() + (dayNum - today.getDay() + 7) % 7);

      const startDate = nextOccurrence.toISOString().split('T')[0].replace(/-/g, '');
      const startTime = `${startHour.toString().padStart(2, '0')}${startMin.toString().padStart(2, '0')}00`;
      const endTime = `${endHour.toString().padStart(2, '0')}${endMin.toString().padStart(2, '0')}00`;

      ics += 'BEGIN:VEVENT\n';
      ics += `DTSTART:${startDate}T${startTime}\n`;
      ics += `DTEND:${startDate}T${endTime}\n`;
      ics += `SUMMARY:${cls.name}\n`;
      ics += `DESCRIPTION:${cls.description || ''}\n`;
      ics += `LOCATION:${cls.location || 'Online'}\n`;
      ics += 'RRULE:FREQ=WEEKLY\n';
      ics += `UID:${cls.id}@studentassistant\n`;
      ics += 'END:VEVENT\n';
    });
  });

  ics += 'END:VCALENDAR';

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student_schedule.ics';
  a.click();
  URL.revokeObjectURL(url);
}

function exportStudySessions() {
  if (appState.studySessions.length === 0) {
    alert('No study sessions to export');
    return;
  }

  let csv = 'Date,Type,Duration (minutes),Title\n';
  appState.studySessions.forEach(s => {
    const date = new Date(s.date);
    csv += `${date.toISOString()},${s.type},${s.duration},${s.title || s.type}\n`;
  });

  downloadFile(csv, 'study_sessions.csv', 'text/csv');
}

function exportAttendance() {
  if (appState.attendance.length === 0) {
    alert('No attendance records to export');
    return;
  }

  let csv = 'Date,Class,Status\n';
  appState.attendance.forEach(a => {
    const cls = appState.classes.find(c => c.id === a.classId);
    const date = new Date(a.date);
    csv += `${date.toISOString()},"${cls?.name || 'Unknown'}",${a.status}\n`;
  });

  downloadFile(csv, 'attendance_records.csv', 'text/csv');
}

function exportTeachers() {
  if (appState.teachers.length === 0) {
    alert('No teachers to export');
    return;
  }

  let csv = 'Name,Email,Office,Office Hours,Phone\n';
  appState.teachers.forEach(t => {
    csv += `"${t.name}","${t.email || ''}","${t.office || ''}","${t.officeHours || ''}","${t.phone || ''}"\n`;
  });

  downloadFile(csv, 'teachers_contacts.csv', 'text/csv');
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

function completeAllOverdueAssignments() {
  const now = new Date();
  let count = 0;
  
  appState.assignments.forEach(a => {
    if (!a.completed && new Date(a.dueDate) < now) {
      a.completed = true;
      count++;
    }
  });
  
  if (count > 0) {
    saveAllData();
    renderAllViews();
    alert(`Marked ${count} overdue assignment(s) as completed.`);
  } else {
    alert('No overdue assignments found.');
  }
}

function archiveCompletedItems() {
  const confirmArchive = confirm('This will move all completed assignments and tasks to archive. Continue?');
  if (!confirmArchive) return;
  
  // In a future version, implement proper archiving
  // For now, just mark them for review
  const completedAssignments = appState.assignments.filter(a => a.completed).length;
  const completedTasks = appState.tasks.filter(t => t.completed).length;
  
  alert(`Found ${completedAssignments} completed assignments and ${completedTasks} completed tasks.\n\nArchiving feature coming soon!`);
}

function resetAllData() {
  const confirmReset = confirm('⚠️ WARNING: This will delete ALL your data permanently!\n\nClasses\nAssignments\nExams\nGrades\nNotes\nFlashcards\nTasks\nTeachers\nAttendance\nResources\nStudy Sessions\n\nThis cannot be undone. Continue?');
  if (!confirmReset) return;
  
  const confirmAgain = confirm('Really sure? Consider exporting your data first from Settings.');
  if (!confirmAgain) return;
  
  clearAllData();
  location.reload();
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

function sendClassReminder(cls) {
  if (Notification.permission === 'granted') {
    new Notification(`📚 Class Reminder: ${cls.name}`, {
      body: `${cls.name} starts at ${formatTime(cls.startTime)} in ${cls.location || 'online'}`,
      icon: 'icon-192.svg',
      tag: `class-${cls.id}`,
      requireInteraction: false
    });
  }
}

function sendAssignmentReminder(assignment) {
  if (Notification.permission === 'granted') {
    new Notification(`📝 Assignment Due: ${assignment.title}`, {
      body: `${assignment.title} for ${getClassName(assignment.classId)} is due ${formatDate(assignment.dueDate)}`,
      icon: 'icon-192.svg',
      tag: `assignment-${assignment.id}`,
      requireInteraction: false
    });
  }
}

function sendExamReminder(exam) {
  if (Notification.permission === 'granted') {
    new Notification(`📋 Exam Reminder: ${exam.title}`, {
      body: `${exam.title} is on ${formatDate(exam.date)}${exam.time ? ' at ' + formatTime(exam.time) : ''}`,
      icon: 'icon-192.svg',
      tag: `exam-${exam.id}`,
      requireInteraction: false
    });
  }
}

function sendStudyBreakReminder() {
  if (Notification.permission === 'granted') {
    new Notification('☕ Time for a Break!', {
      body: 'You\'ve been studying for a while. Take a short break to stay productive!',
      icon: 'icon-192.svg',
      tag: 'break-reminder',
      requireInteraction: false
    });
  }
}

// ============================================================================
// THEME HELPERS
// ============================================================================

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function watchSystemTheme() {
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (appState.settings.theme === 'auto') {
        applyTheme('auto');
      }
    });
  }
}

function getAllAvailableThemes() {
  return [
    { id: 'light', name: 'Light', icon: '☀️' },
    { id: 'dark', name: 'Dark', icon: '🌙' },
    { id: 'auto', name: 'System', icon: '🔄' }
  ];
}

function getAllAccentColors() {
  return [
    { name: 'Purple', value: '#667eea' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Indigo', value: '#6366f1' }
  ];
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatPhoneNumber(phone) {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
}

function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML.trim();
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

// ============================================================================
// DATA IMPORT FUNCTIONS
// ============================================================================

function importClassesFromCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return { success: false, error: 'Invalid CSV format' };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const requiredFields = ['class name', 'start time', 'end time', 'days'];
  const missingFields = requiredFields.filter(field => !headers.includes(field));

  if (missingFields.length > 0) {
    return { success: false, error: `Missing required columns: ${missingFields.join(', ')}` };
  }

  const classes = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].replace(/^"|"$/g, '').trim() : '';
    });

    const classObj = {
      id: generateId(),
      name: row['class name'] || row['class'],
      startTime: parseTime(row['start time']),
      endTime: parseTime(row['end time']),
      location: row['location'] || row['place'] || 'Online',
      description: row['description'] || row['notes'] || '',
      days: parseDays(row['days']),
      reminderMinutes: parseInt(row['reminder minutes'] || row['reminder'] || '15'),
      color: row['color'] || '#667eea'
    };

    if (classObj.name && classObj.startTime && classObj.days.length > 0) {
      classes.push(classObj);
    }
  }

  return { success: true, classes };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseTime(timeStr) {
  if (!timeStr) return '';
  timeStr = timeStr.trim();

  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2].padStart(2, '0');
    const ampm = timeMatch[3];

    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  return timeStr.slice(0, 5);
}

function parseDays(daysStr) {
  if (!daysStr) return [];

  const dayMap = {
    'monday': 'Monday', 'mon': 'Monday', 'm': 'Monday',
    'tuesday': 'Tuesday', 'tue': 'Tuesday', 't': 'Tuesday',
    'wednesday': 'Wednesday', 'wed': 'Wednesday', 'w': 'Wednesday',
    'thursday': 'Thursday', 'thu': 'Thursday', 'th': 'Thursday', 'r': 'Thursday',
    'friday': 'Friday', 'fri': 'Friday', 'f': 'Friday',
    'saturday': 'Saturday', 'sat': 'Saturday', 's': 'Saturday',
    'sunday': 'Sunday', 'sun': 'Sunday', 'u': 'Sunday'
  };

  const days = [];
  const separators = /[;,/\s]+/;
  const parts = daysStr.toLowerCase().split(separators).filter(p => p.trim());

  parts.forEach(part => {
    const day = dayMap[part.trim()];
    if (day && !days.includes(day)) {
      days.push(day);
    }
  });

  return days;
}

// ============================================================================
// WIDGET RENDERING
// ============================================================================

function renderWelcomeMessage() {
  const hour = new Date().getHours();
  let greeting = 'Good Evening';
  
  if (hour >= 5 && hour < 12) {
    greeting = 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good Evening';
  }

  const quote = getMotivationalQuote();
  
  return {
    greeting,
    quote: quote.text,
    quoteAuthor: quote.author
  };
}

function renderUpcomingEventsWidget() {
  const now = new Date();
  const events = [];

  // Add next 5 assignments
  const upcomingAssignments = appState.assignments
    .filter(a => !a.completed && new Date(a.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  upcomingAssignments.forEach(a => {
    events.push({
      type: 'assignment',
      title: a.title,
      date: a.dueDate,
      classId: a.classId,
      icon: '📝'
    });
  });

  // Add next 3 exams
  const upcomingExams = appState.exams
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  upcomingExams.forEach(e => {
    events.push({
      type: 'exam',
      title: e.title,
      date: e.date,
      classId: e.classId,
      icon: '📋'
    });
  });

  // Sort by date and return top 5
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  return events.slice(0, 5);
}

function renderClassPerformanceWidget(classId) {
  const grades = appState.grades.filter(g => g.classId === classId);
  
  if (grades.length === 0) {
    return {
      hasData: false,
      average: null,
      trend: null,
      grade: null
    };
  }

  const average = grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / grades.length;
  
  // Calculate trend (compare last 3 grades to previous 3)
  const sortedGrades = grades.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const recent3 = sortedGrades.slice(0, 3);
  const previous3 = sortedGrades.slice(3, 6);
  
  const recentAvg = recent3.length > 0 
    ? recent3.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / recent3.length 
    : average;
  
  const previousAvg = previous3.length > 0 
    ? previous3.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / previous3.length 
    : recentAvg;
  
  let trend = 'stable';
  if (recentAvg > previousAvg + 2) trend = 'improving';
  if (recentAvg < previousAvg - 2) trend = 'declining';

  return {
    hasData: true,
    average: average.toFixed(1),
    trend,
    grade: getLetterGrade(average)
  };
}

function getLetterGrade(percentage) {
  const pct = parseFloat(percentage);
  if (pct >= 97) return 'A+';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

function getGradePoint(letterGrade) {
  const points = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  return points[letterGrade] || 0;
}

function calculateWeightedGPA() {
  const classGrades = {};
  
  appState.grades.forEach(g => {
    if (!classGrades[g.classId]) classGrades[g.classId] = [];
    classGrades[g.classId].push(g);
  });

  let totalPoints = 0;
  let totalWeights = 0;

  Object.entries(classGrades).forEach(([classId, grades]) => {
    const avgGrade = grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / grades.length;
    const letterGrade = getLetterGrade(avgGrade);
    const points = getGradePoint(letterGrade);
    
    // Assume equal weight for each class
    totalPoints += points;
    totalWeights += 1;
  });

  return totalWeights > 0 ? (totalPoints / totalWeights).toFixed(2) : '0.00';
}

// ============================================================================
// ACHIEVEMENT SYSTEM
// ============================================================================

function checkAchievements() {
  const achievements = [];
  
  // Study streak achievements
  if (appState.streak >= 1) achievements.push({ id: 'streak_1', name: 'Getting Started', description: '1 day study streak', icon: '🌱' });
  if (appState.streak >= 7) achievements.push({ id: 'streak_7', name: 'Week Warrior', description: '7 day study streak', icon: '🔥' });
  if (appState.streak >= 30) achievements.push({ id: 'streak_30', name: 'Monthly Master', description: '30 day study streak', icon: '👑' });
  
  // Assignment achievements
  const completedAssignments = appState.assignments.filter(a => a.completed).length;
  if (completedAssignments >= 1) achievements.push({ id: 'assign_1', name: 'First Step', description: 'Complete 1 assignment', icon: '✅' });
  if (completedAssignments >= 10) achievements.push({ id: 'assign_10', name: 'Dedicated Student', description: 'Complete 10 assignments', icon: '📚' });
  if (completedAssignments >= 50) achievements.push({ id: 'assign_50', name: 'Assignment Master', description: 'Complete 50 assignments', icon: '🏆' });
  
  // Study time achievements
  const totalMinutes = appState.studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = totalMinutes / 60;
  if (totalHours >= 10) achievements.push({ id: 'hours_10', name: 'Time Invested', description: 'Study for 10 hours', icon: '⏰' });
  if (totalHours >= 50) achievements.push({ id: 'hours_50', name: 'Dedicated Learner', description: 'Study for 50 hours', icon: '📖' });
  if (totalHours >= 100) achievements.push({ id: 'hours_100', name: 'Century Club', description: 'Study for 100 hours', icon: '💎' });
  
  // Grade achievements
  const avgGrade = appState.grades.length > 0 
    ? appState.grades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0) / appState.grades.length 
    : 0;
  if (avgGrade >= 90) achievements.push({ id: 'grade_a', name: 'Honor Student', description: 'Maintain 90%+ average', icon: '🎓' });
  if (avgGrade >= 95) achievements.push({ id: 'grade_aplus', name: 'Valedictorian', description: 'Maintain 95%+ average', icon: '🌟' });
  
  return achievements;
}

function getUnlockedAchievements() {
  const allAchievements = checkAchievements();
  const unlockedIds = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
  
  // Find new achievements
  const newAchievements = allAchievements.filter(a => !unlockedIds.includes(a.id));
  
  // Unlock new achievements
  if (newAchievements.length > 0) {
    const allUnlocked = [...unlockedIds, ...newAchievements.map(a => a.id)];
    localStorage.setItem('unlockedAchievements', JSON.stringify(allUnlocked));
    
    // Show notification for each new achievement
    newAchievements.forEach(achievement => {
      if (Notification.permission === 'granted') {
        new Notification(`🏆 Achievement Unlocked: ${achievement.name}`, {
          body: achievement.description,
          icon: 'icon-192.svg'
        });
      }
    });
  }
  
  return allAchievements;
}

// ============================================================================
// APP INFO & HELP
// ============================================================================

function getAppVersion() {
  return '2.0.0';
}

function getAppInfo() {
  return {
    name: 'Student Assistant Pro',
    version: getAppVersion(),
    build: new Date().toISOString().split('T')[0],
    features: [
      'Class Management',
      'Assignment Tracking',
      'Exam Scheduling',
      'Grade Management',
      'Study Timer (Pomodoro)',
      'Notes',
      'Flashcards',
      'Attendance Tracking',
      'Task Management',
      'Teacher Contacts',
      'Calendar View',
      'Resource Library',
      'Analytics Dashboard',
      'Global Search',
      'Export/Import',
      'Offline Support (PWA)'
    ]
  };
}

function showAboutModal() {
  const info = getAppInfo();
  alert(`📚 Student Assistant Pro v${info.version}

Built for students, by students.

Features:
${info.features.map(f => `  • ${f}`).join('\n')}

© 2024 Student Assistant Pro
MIT License - Free to use and share`);
}

function showHelpModal() {
  openModal('quickHelpModal');
}

function getQuickStartGuide() {
  return `
# Quick Start Guide

## 1. Add Your Classes
Click "+ Add Class" and enter your class details including name, time, location, and days.

## 2. Track Assignments
Add assignments with due dates and priorities. Mark them complete as you finish.

## 3. Schedule Exams
Add upcoming exams and track countdown timers.

## 4. Record Grades
Enter your grades to track your performance and calculate GPA.

## 5. Use Study Timer
Start a Pomodoro session (25 min) for focused studying.

## 6. Take Notes
Create notes for each class with tags for easy searching.

## 7. Create Flashcards
Make flashcard decks to test your knowledge.

## Keyboard Shortcuts
- Ctrl+K: Quick Search
- Ctrl+H: Show Help
- Ctrl+D: Go to Dashboard
- 1-9: Switch Views
- /: Open Search
`;
}

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

function runDiagnostics() {
  const results = {
    localStorage: 'OK',
    dataIntegrity: 'OK',
    serviceWorker: 'Unknown',
    notifications: 'Unknown'
  };

  // Check localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch (e) {
    results.localStorage = 'FAILED: ' + e.message;
  }

  // Check data integrity
  try {
    const classes = loadData(STORAGE_KEYS.CLASSES);
    if (!Array.isArray(classes)) {
      results.dataIntegrity = 'WARNING: Classes data corrupted';
    }
  } catch (e) {
    results.dataIntegrity = 'FAILED: ' + e.message;
  }

  // Check service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      results.serviceWorker = reg ? 'Registered' : 'Not Registered';
      console.log('Service Worker Status:', results.serviceWorker);
    });
  } else {
    results.serviceWorker = 'Not Supported';
  }

  // Check notifications
  if ('Notification' in window) {
    results.notifications = Notification.permission;
  } else {
    results.notifications = 'Not Supported';
  }

  console.log('=== Diagnostic Results ===');
  console.log(results);
  return results;
}

function fixCommonIssues() {
  const issues = [];
  
  // Clear corrupted data
  try {
    const classes = loadData(STORAGE_KEYS.CLASSES);
    if (!Array.isArray(classes)) {
      saveData(STORAGE_KEYS.CLASSES, []);
      issues.push('Reset corrupted classes data');
    }
  } catch (e) {
    saveData(STORAGE_KEYS.CLASSES, []);
    issues.push('Reset classes data due to error');
  }

  // Clear old cache
  if ('caches' in window) {
    caches.keys().then(keys => {
      keys.forEach(key => {
        if (key.startsWith('student-assistant-old')) {
          caches.delete(key);
          issues.push('Cleared old cache');
        }
      });
    });
  }

  if (issues.length === 0) {
    return 'No issues found.';
  }
  
  return 'Fixed: ' + issues.join(', ');
}

// ============================================================================
// INITIALIZE APP
// ============================================================================

// Run migration on load
migrateData();

// Watch for system theme changes
watchSystemTheme();

// Run diagnostics in development
if (window.location.hostname === 'localhost') {
  console.log('Running in development mode');
  runDiagnostics();
}

// Export functions for debugging
window.StudentAssistant = {
  state: appState,
  loadData,
  saveData,
  exportAllData: exportAllDataToFile,
  importAllData: handleDataImport,
  clearAllData,
  runDiagnostics,
  fixCommonIssues,
  getAppInfo,
  showAboutModal,
  showHelpModal,
  openSearch,
  showGradeAnalytics,
  showStudyAnalytics,
  printGradeReport,
  printSchedule,
  exportToICalendar,
  exportGradesToCSV,
  exportAssignmentsToCSV,
  exportClassesToCSV,
  exportStudySessions,
  exportAttendance,
  exportTeachers,
  checkAchievements,
  getQuickStartGuide,
  version: getAppVersion()
};

console.log('📚 Student Assistant Pro loaded successfully!');
console.log('Type "StudentAssistant" in console for debugging tools');

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    console.log('Modal opened:', modalId);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    appState.editingId = null;

    // Reset form titles
    const titles = {
      'classModal': 'Add New Class',
      'assignmentModal': 'Add Assignment',
      'examModal': 'Add Exam',
      'noteModal': 'Add Note',
      'gradeModal': 'Add Grade',
      'taskModal': 'Add Task',
      'teacherModal': 'Add Teacher',
      'flashcardDeckModal': 'Create Deck'
    };

    const titleEl = document.getElementById(modalId.replace('Modal', 'ModalTitle'));
    if (titleEl && titles[modalId]) {
      titleEl.textContent = titles[modalId];
    }
    console.log('Modal closed:', modalId);
  }
}

// ============================================================================
// DATA PERSISTENCE
// ============================================================================

function saveAllData() {
  saveData(STORAGE_KEYS.CLASSES, appState.classes);
  saveData(STORAGE_KEYS.ASSIGNMENTS, appState.assignments);
  saveData(STORAGE_KEYS.EXAMS, appState.exams);
  saveData(STORAGE_KEYS.GRADES, appState.grades);
  saveData(STORAGE_KEYS.NOTES, appState.notes);
  saveData(STORAGE_KEYS.FLASHCARDS, appState.flashcards);
  saveData(STORAGE_KEYS.TASKS, appState.tasks);
  saveData(STORAGE_KEYS.TEACHERS, appState.teachers);
  saveData(STORAGE_KEYS.ATTENDANCE, appState.attendance);
  saveData(STORAGE_KEYS.RESOURCES, appState.resources);
  saveData(STORAGE_KEYS.STUDY_SESSIONS, appState.studySessions);
  saveData(STORAGE_KEYS.STREAK, { streak: appState.streak, lastStudyDate: appState.lastStudyDate });
}

// ============================================================================
// EXPORT/IMPORT DATA
// ============================================================================

function exportAllDataToFile() {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student-assistant-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleDataImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (confirm('This will replace all your current data. Continue?')) {
        importAllData(data);
        location.reload();
      }
    } catch (err) {
      alert('Invalid backup file');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function confirmClearAllData() {
  if (confirm('⚠️ WARNING: This will delete ALL your data permanently. This cannot be undone.\n\nAre you sure you want to continue?')) {
    if (confirm('Really sure? Consider exporting your data first.')) {
      clearAllData();
      location.reload();
    }
  }
}

// ============================================================================
// THEME & STYLING
// ============================================================================

function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'auto') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }

  // Update theme toggle button
  if (themeToggle) {
    const icons = { 'light': '🌙', 'dark': '☀️', 'auto': '🔄' };
    themeToggle.textContent = icons[theme] || '🌙';
  }
}

function applyAccentColor(color) {
  const root = document.documentElement;
  root.style.setProperty('--accent-color', color);
}

function rgbToHex(rgb) {
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/\d+/g);
  if (!match) return '#667eea';
  return '#' + match.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function checkReminders() {
  if (!appState.settings.enableNotifications) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toTimeString().slice(0, 5);

  // Class reminders
  appState.classes.forEach(cls => {
    if (cls.days.includes(currentDay) && cls.startTime <= currentTime) {
      const reminderTime = new Date();
      reminderTime.setHours(
        parseInt(cls.startTime.split(':')[0]),
        parseInt(cls.startTime.split(':')[1]) - (cls.reminderMinutes || 15),
        0
      );

      if (now >= reminderTime && now < new Date(reminderTime.getTime() + 60000)) {
        new Notification(`📚 Class Reminder: ${cls.name}`, {
          body: `${cls.name} starts at ${formatTime(cls.startTime)} in ${cls.location || 'online'}`,
          icon: 'icon-192.svg'
        });
      }
    }
  });

  // Assignment reminders
  appState.assignments.forEach(a => {
    if (!a.completed) {
      const dueDate = new Date(a.dueDate);
      const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntil === 1 && a.dueTime >= currentTime) {
        new Notification(`📝 Assignment Due Tomorrow: ${a.title}`, {
          body: `${a.title} for ${getClassName(a.classId)} is due tomorrow`,
          icon: 'icon-192.svg'
        });
      }
    }
  });

  // Exam reminders
  appState.exams.forEach(e => {
    const examDate = new Date(e.date);
    const daysUntil = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil === 3 || daysUntil === 1) {
      new Notification(`📋 Exam Reminder: ${e.title}`, {
        body: `${e.title} is in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
        icon: 'icon-192.svg'
      });
    }
  });
}

// ============================================================================
// INITIALIZE APP
// ============================================================================

document.addEventListener('DOMContentLoaded', init);
