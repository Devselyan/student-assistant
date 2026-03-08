// Student Assistant Pro - Main Renderer
// Comprehensive implementation of all features

// ==================== STATE ====================
let appData = {
  classes: [],
  assignments: [],
  exams: [],
  grades: [],
  notes: [],
  tasks: [],
  flashcards: [],
  studySessions: [],
  settings: {
    theme: 'auto',
    accentColor: '#667eea',
    notifications: true,
    defaultReminderMinutes: 15,
    pomodoroDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15
  }
};

let pendingImportClasses = [];
let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;
let timerMode = 'pomodoro';
let currentCalendarDate = new Date();

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupNavigation();
  setupModals();
  setupEventListeners();
  setupTimer();
  setupCommandPalette();
  applySettings();
  renderAll();
  startReminderChecker();
});

// ==================== DATA MANAGEMENT ====================
async function loadData() {
  try {
    const saved = localStorage.getItem('studentAssistantData');
    if (saved) appData = JSON.parse(saved);
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

async function saveData() {
  try {
    localStorage.setItem('studentAssistantData', JSON.stringify(appData));
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

// ==================== NAVIGATION ====================
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const viewName = item.dataset.view;
      switchView(viewName);
    });
  });

  document.getElementById('toggleSidebar')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
}

function switchView(viewName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });

  // Render view-specific content
  const renderFunctions = {
    dashboard: renderDashboard,
    classes: renderClasses,
    calendar: renderCalendar,
    assignments: renderAssignments,
    exams: renderExams,
    grades: renderGrades,
    tasks: renderTasks,
    notes: renderNotes,
    flashcards: renderFlashcards,
    timer: () => {},
    analytics: renderAnalytics,
    settings: renderSettings
  };

  if (renderFunctions[viewName]) {
    renderFunctions[viewName]();
  }
}

// ==================== MODALS ====================
function setupModals() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal(e.target.closest('.modal'));
    }
    if (e.target.classList.contains('modal-close')) {
      closeModal(e.target.closest('.modal'));
    }
    if (e.target.hasAttribute('data-modal')) {
      closeModal(e.target.getAttribute('data-modal'));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(modal => closeModal(modal));
    }
  });

  // Form submissions
  document.getElementById('classForm')?.addEventListener('submit', handleClassSubmit);
  document.getElementById('assignmentForm')?.addEventListener('submit', handleAssignmentSubmit);
  document.getElementById('examForm')?.addEventListener('submit', handleExamSubmit);
  document.getElementById('gradeForm')?.addEventListener('submit', handleGradeSubmit);
  document.getElementById('taskForm')?.addEventListener('submit', handleTaskSubmit);
  document.getElementById('noteForm')?.addEventListener('submit', handleNoteSubmit);
  document.getElementById('flashcardDeckForm')?.addEventListener('submit', handleFlashcardDeckSubmit);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modal) {
  if (typeof modal === 'string') modal = document.getElementById(modal);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Quick actions
  document.getElementById('quickAddClass')?.addEventListener('click', () => openModal('classModal'));
  document.getElementById('quickAddAssignment')?.addEventListener('click', () => openModal('assignmentModal'));
  document.getElementById('quickAddExam')?.addEventListener('click', () => openModal('examModal'));
  document.getElementById('quickAddNote')?.addEventListener('click', () => openModal('noteModal'));

  // Header buttons
  document.getElementById('addClassBtn')?.addEventListener('click', () => openModal('classModal'));
  document.getElementById('addAssignmentBtn')?.addEventListener('click', () => openModal('assignmentModal'));
  document.getElementById('addExamBtn')?.addEventListener('click', () => openModal('examModal'));
  document.getElementById('addGradeBtn')?.addEventListener('click', () => openModal('gradeModal'));
  document.getElementById('addTaskBtn')?.addEventListener('click', () => openModal('taskModal'));
  document.getElementById('addNoteBtn')?.addEventListener('click', () => openModal('noteModal'));
  document.getElementById('addDeckBtn')?.addEventListener('click', () => openModal('flashcardDeckModal'));

  // Import
  document.getElementById('importCsvBtn')?.addEventListener('click', () => {
    document.getElementById('importFileInput')?.click();
  });
  document.getElementById('importFileInput')?.addEventListener('change', handleFileImport);
  document.getElementById('confirmImportBtn')?.addEventListener('click', confirmImport);

  // Theme
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('openCommandPalette')?.addEventListener('click', openCommandPalette);

  // Settings
  document.getElementById('themeSelect')?.addEventListener('change', (e) => {
    appData.settings.theme = e.target.value;
    applySettings();
    saveData();
  });
  document.getElementById('accentColor')?.addEventListener('input', (e) => {
    appData.settings.accentColor = e.target.value;
    document.documentElement.style.setProperty('--primary-color', e.target.value);
    saveData();
  });
  document.getElementById('enableNotifications')?.addEventListener('change', (e) => {
    appData.settings.notifications = e.target.checked;
    saveData();
  });
  document.getElementById('pomodoroDuration')?.addEventListener('change', (e) => {
    appData.settings.pomodoroDuration = parseInt(e.target.value);
    timerSeconds = appData.settings.pomodoroDuration * 60;
    updateTimerDisplay();
    saveData();
  });
  document.getElementById('shortBreakDuration')?.addEventListener('change', (e) => {
    appData.settings.shortBreakDuration = parseInt(e.target.value);
    saveData();
  });
  document.getElementById('longBreakDuration')?.addEventListener('change', (e) => {
    appData.settings.longBreakDuration = parseInt(e.target.value);
    saveData();
  });

  // Data management
  document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
  document.getElementById('importDataBtn')?.addEventListener('click', importData);
  document.getElementById('clearAllDataBtn')?.addEventListener('click', clearAllData);

  // Filters
  setupFilters();
}

function setupFilters() {
  document.querySelectorAll('.assignments-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.assignments-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAssignments(btn.dataset.filter);
    });
  });
}

// ==================== FORM HANDLERS ====================
function handleClassSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  appData.classes.push({
    id: Date.now().toString(),
    name: formData.get('name'),
    teacher: formData.get('teacher') || '',
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    location: formData.get('location') || '',
    description: formData.get('description') || '',
    days: Array.from(formData.getAll('days')),
    color: formData.get('color') || '#667eea',
    reminderMinutes: parseInt(formData.get('reminderMinutes')) || 15
  });
  saveData();
  renderClasses();
  closeModal('classModal');
}

function handleAssignmentSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  appData.assignments.push({
    id: Date.now().toString(),
    title: formData.get('title'),
    classId: formData.get('classId'),
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate'),
    dueTime: formData.get('dueTime'),
    description: formData.get('description') || '',
    completed: false
  });
  saveData();
  renderAssignments();
  closeModal('assignmentModal');
}

function handleExamSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  appData.exams.push({
    id: Date.now().toString(),
    title: formData.get('title'),
    classId: formData.get('classId'),
    type: formData.get('type'),
    date: formData.get('date'),
    time: formData.get('time') || '',
    location: formData.get('location') || '',
    topics: formData.get('topics') || ''
  });
  saveData();
  renderExams();
  closeModal('examModal');
}

function handleGradeSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  appData.grades.push({
    id: Date.now().toString(),
    classId: formData.get('classId'),
    name: formData.get('name'),
    grade: parseFloat(formData.get('grade')),
    weight: parseFloat(formData.get('weight')) || 0,
    date: formData.get('date') || new Date().toISOString().split('T')[0]
  });
  saveData();
  renderGrades();
  closeModal('gradeModal');
}

function handleTaskSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  appData.tasks.push({
    id: Date.now().toString(),
    title: formData.get('title'),
    dueDate: formData.get('dueDate') || '',
    priority: formData.get('priority'),
    notes: formData.get('notes') || '',
    completed: false,
    status: 'todo'
  });
  saveData();
  renderTasks();
  closeModal('taskModal');
}

function handleNoteSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  appData.notes.push({
    id: Date.now().toString(),
    title: formData.get('title'),
    folderId: formData.get('folderId') || '',
    tags: formData.get('tags') || '',
    content: formData.get('content'),
    createdAt: new Date().toISOString()
  });
  saveData();
  renderNotes();
  closeModal('noteModal');
}

function handleFlashcardDeckSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  appData.flashcards.push({
    id: Date.now().toString(),
    name: formData.get('name'),
    description: formData.get('description') || '',
    cards: [],
    createdAt: new Date().toISOString()
  });
  saveData();
  renderFlashcards();
  closeModal('flashcardDeckModal');
}

// ==================== FILE IMPORT ====================
async function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const result = await ScheduleImport.importFile(file);
  
  if (!result.success) {
    alert(result.error + (result.hint ? '\n\n' + result.hint : ''));
    return;
  }

  if (result.classes.length === 0) {
    alert('No valid classes found in file.');
    return;
  }

  pendingImportClasses = result.classes;
  showImportPreview(result.classes, result.format);
  e.target.value = '';
}

function showImportPreview(classes, format) {
  document.getElementById('csvPreviewContent').innerHTML = `
    <p style="margin-bottom: 15px; color: var(--text-secondary);">Imported ${classes.length} class(es) from ${format}</p>
    <table class="csv-table">
      <thead>
        <tr>
          <th>Class Name</th>
          <th>Time</th>
          <th>Days</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
        ${classes.map(cls => `
          <tr>
            <td>${escapeHtml(cls.name)}</td>
            <td>${cls.startTime} - ${cls.endTime}</td>
            <td>${cls.days.join(', ')}</td>
            <td>${escapeHtml(cls.location)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  openModal('csvPreviewModal');
}

function confirmImport() {
  appData.classes.push(...pendingImportClasses);
  saveData();
  renderClasses();
  closeModal('csvPreviewModal');
  pendingImportClasses = [];
}

// ==================== RENDER FUNCTIONS ====================
function renderAll() {
  renderDashboard();
  renderClasses();
  renderCalendar();
  renderAssignments();
  renderExams();
  renderGrades();
  renderTasks();
  renderNotes();
  renderFlashcards();
  updateClassSelects();
}

function renderDashboard() {
  // Today's date
  const today = new Date();
  document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // Today's classes
  const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });
  const todaysClasses = appData.classes
    .filter(cls => cls.days.includes(currentDay))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const scheduleContainer = document.getElementById('todaySchedule');
  if (todaysClasses.length === 0) {
    scheduleContainer.innerHTML = '<p class="empty-state">No classes today</p>';
  } else {
    scheduleContainer.innerHTML = todaysClasses.map(cls => `
      <div class="class-card" style="margin-bottom: 10px;">
        <h3>${escapeHtml(cls.name)}</h3>
        <div class="class-details">
          <span class="class-detail-item">⏰ ${cls.startTime} - ${cls.endTime}</span>
          <span class="class-detail-item">📍 ${escapeHtml(cls.location || 'Online')}</span>
        </div>
      </div>
    `).join('');
  }

  // Study stats
  const studyStats = Analytics.calculateStudyStats(appData.studySessions || []);
  document.getElementById('totalStudyHours').textContent = studyStats.totalHours;
  document.getElementById('currentStreak').textContent = studyStats.streak;
  document.getElementById('completedToday').textContent = studyStats.sessionsToday;

  // Grade overview
  if (appData.grades.length > 0) {
    const avg = (appData.grades.reduce((sum, g) => sum + g.grade, 0) / appData.grades.length).toFixed(1);
    document.getElementById('gradeOverview').innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color);">${avg}%</div>
        <div style="color: var(--text-secondary);">Overall Average</div>
      </div>
    `;
  }

  // Upcoming deadlines
  const upcoming = appData.assignments
    .filter(a => !a.completed && a.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const deadlinesContainer = document.getElementById('upcomingDeadlines');
  if (upcoming.length === 0) {
    deadlinesContainer.innerHTML = '<p class="empty-state">No upcoming deadlines</p>';
  } else {
    deadlinesContainer.innerHTML = upcoming.map(a => `
      <div class="assignment-item priority-${a.priority || 'medium'}" style="margin-bottom: 8px;">
        <div>
          <strong>${escapeHtml(a.title)}</strong>
          <div style="font-size: 0.85rem; color: var(--text-muted);">Due: ${a.dueDate}</div>
        </div>
      </div>
    `).join('');
  }

  // Streak
  document.getElementById('streakCount').textContent = studyStats.streak;
}

function renderClasses() {
  const grid = document.getElementById('classesGrid');
  
  if (appData.classes.length === 0) {
    grid.innerHTML = '<p class="empty-state">No classes yet. Click "Add Class" to get started!</p>';
    return;
  }

  grid.innerHTML = appData.classes.map(cls => `
    <div class="class-card" style="border-left-color: ${cls.color || 'var(--primary-color)'}">
      <h3>${escapeHtml(cls.name)}</h3>
      ${cls.teacher ? `<p style="color: var(--text-secondary); margin-bottom: 8px;">👨‍🏫 ${escapeHtml(cls.teacher)}</p>` : ''}
      <div class="class-details">
        <span class="class-detail-item">⏰ ${cls.startTime} - ${cls.endTime}</span>
        <span class="class-detail-item">📍 ${escapeHtml(cls.location || 'Online')}</span>
        <span class="class-detail-item">🔔 ${cls.reminderMinutes}min before</span>
      </div>
      <div class="class-details" style="margin-top: 8px;">
        <span class="class-detail-item">${cls.days.join(', ')}</span>
      </div>
      ${cls.description ? `<p style="margin-top: 10px; font-size: 0.9rem; color: var(--text-secondary);">${escapeHtml(cls.description)}</p>` : ''}
      <div class="class-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteClass('${cls.id}')">Delete</button>
      </div>
    </div>
  `).join('');

  updateClassSelects();
}

function renderCalendar() {
  const container = document.getElementById('calendarContainer');
  const monthYear = document.getElementById('currentMonthYear');
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  monthYear.textContent = `${monthNames[month]} ${year}`;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  // Get events
  const events = [];
  appData.classes.forEach(cls => {
    cls.days.forEach(dayName => {
      const dayNum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
      for (let d = 1; d <= totalDays; d++) {
        if (new Date(year, month, d).getDay() === dayNum) {
          events.push({ date: d, title: cls.name, time: cls.startTime, color: cls.color, type: 'class' });
        }
      }
    });
  });

  let html = '<div class="calendar-grid">';
  html += '<div class="calendar-weekday">Sun</div><div class="calendar-weekday">Mon</div>';
  html += '<div class="calendar-weekday">Tue</div><div class="calendar-weekday">Wed</div>';
  html += '<div class="calendar-weekday">Thu</div><div class="calendar-weekday">Fri</div>';
  html += '<div class="calendar-weekday">Sat</div>';
  
  for (let i = 0; i < startingDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  for (let d = 1; d <= totalDays; d++) {
    const dayEvents = events.filter(e => e.date === d);
    const isToday = isCurrentMonth && d === today.getDate();
    
    html += `<div class="calendar-day ${isToday ? 'today' : ''}">
      <div class="calendar-day-number">${d}</div>
      <div class="calendar-events">`;
    
    dayEvents.slice(0, 3).forEach(e => {
      html += `<div class="calendar-event" style="background: ${e.color};" title="${e.title} at ${e.time}">
        ${e.type === 'class' ? '📖' : '📋'} ${e.title}
      </div>`;
    });
    
    if (dayEvents.length > 3) {
      html += `<div class="calendar-more">+${dayEvents.length - 3} more</div>`;
    }
    
    html += '</div></div>';
  }
  
  html += '</div>';
  container.innerHTML = html;
}

function renderAssignments(filter = 'all') {
  const list = document.getElementById('assignmentsList');
  let filtered = appData.assignments;
  
  if (filter === 'pending') filtered = filtered.filter(a => !a.completed);
  if (filter === 'completed') filtered = filtered.filter(a => a.completed);

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state">No assignments</p>';
    return;
  }

  list.innerHTML = filtered.map(a => {
    const cls = appData.classes.find(c => c.id === a.classId);
    return `
      <div class="assignment-item priority-${a.priority || 'medium'}">
        <div>
          <strong>${escapeHtml(a.title)}</strong>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">
            ${cls ? `📚 ${escapeHtml(cls.name)} • ` : ''}
            Due: ${a.dueDate}
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn ${a.completed ? 'btn-secondary' : 'btn-primary'}" onclick="toggleAssignment('${a.id}')">
            ${a.completed ? '✓ Done' : 'Mark Done'}
          </button>
          <button class="btn btn-danger" onclick="deleteAssignment('${a.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderExams() {
  const countdown = document.getElementById('examsCountdown');
  const list = document.getElementById('examsList');
  const today = new Date();

  // Countdown cards
  const upcomingExams = appData.exams
    .filter(e => e.date && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  countdown.innerHTML = upcomingExams.map(exam => {
    const examDate = new Date(exam.date);
    const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    return `
      <div class="exam-countdown-card">
        <div class="days-left">${daysLeft}</div>
        <div class="exam-name">days until ${escapeHtml(exam.title)}</div>
      </div>
    `;
  }).join('');

  // List
  if (appData.exams.length === 0) {
    list.innerHTML = '<p class="empty-state">No exams scheduled</p>';
  } else {
    list.innerHTML = appData.exams.map(exam => `
      <div class="assignment-item">
        <div>
          <strong>${escapeHtml(exam.title)}</strong>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">
            📅 ${exam.date} ${exam.time ? 'at ' + exam.time : ''}
          </div>
        </div>
        <button class="btn btn-danger" onclick="deleteExam('${exam.id}')">Delete</button>
      </div>
    `).join('');
  }
}

function renderGrades() {
  const summary = document.getElementById('gradesSummary');
  const list = document.getElementById('gradesList');

  if (appData.grades.length === 0) {
    summary.innerHTML = '';
    list.innerHTML = '<p class="empty-state">No grades recorded</p>';
    return;
  }

  const avg = (appData.grades.reduce((sum, g) => sum + g.grade, 0) / appData.grades.length).toFixed(1);
  summary.innerHTML = `
    <div class="grade-summary-card">
      <div class="grade-value">${avg}%</div>
      <div class="grade-label">Overall Average</div>
    </div>
    <div class="grade-summary-card">
      <div class="grade-value">${appData.grades.length}</div>
      <div class="grade-label">Total Grades</div>
    </div>
  `;

  list.innerHTML = appData.grades.map(g => `
    <div class="assignment-item">
      <div>
        <strong>${escapeHtml(g.name)}</strong>
        <div style="font-size: 0.85rem; color: var(--text-secondary);">📅 ${g.date}</div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${g.grade}%</span>
        <button class="btn btn-danger" onclick="deleteGrade('${g.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderTasks() {
  const board = document.getElementById('kanbanBoard');
  
  if (appData.tasks.length === 0) {
    board.innerHTML = '<p class="empty-state">No tasks yet. Click "+ Add Task" to create one!</p>';
    return;
  }

  const columns = TasksKanban.defaultColumns;
  
  board.innerHTML = '<div class="kanban-columns">' + columns.map(col => {
    const tasks = appData.tasks.filter(t => t.status === col.id);
    return `
      <div class="kanban-column" style="border-top-color: ${col.color}">
        <div class="kanban-column-header">
          <span>${col.icon}</span>
          <h3>${col.name}</h3>
          <span class="kanban-count">${tasks.length}</span>
        </div>
        <div class="kanban-cards">
          ${tasks.map(task => `
            <div class="kanban-card priority-${task.priority || 'medium'}">
              <div class="kanban-card-title">${escapeHtml(task.title)}</div>
              ${task.dueDate ? `<div class="kanban-card-due">📅 ${task.dueDate}</div>` : ''}
              <div class="kanban-card-actions">
                <button class="btn-icon-sm" onclick="moveTask('${task.id}', 'prev')">←</button>
                <button class="btn-icon-sm" onclick="toggleTaskComplete('${task.id}')">${task.completed ? '✓' : '○'}</button>
                <button class="btn-icon-sm" onclick="moveTask('${task.id}', 'next')">→</button>
                <button class="btn-icon-sm" onclick="deleteTask('${task.id}')">×</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('') + '</div>';
}

function renderNotes() {
  const grid = document.getElementById('notesGrid');
  
  if (appData.notes.length === 0) {
    grid.innerHTML = '<p class="empty-state">No notes yet</p>';
    return;
  }

  grid.innerHTML = appData.notes.map(note => `
    <div class="note-card" onclick="viewNote('${note.id}')">
      <h4>${escapeHtml(note.title)}</h4>
      <p>${escapeHtml(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}</p>
      <div class="note-meta">
        ${new Date(note.createdAt).toLocaleDateString()}
      </div>
    </div>
  `).join('');
}

function renderFlashcards() {
  const grid = document.getElementById('decksGrid');
  
  if (appData.flashcards.length === 0) {
    grid.innerHTML = '<p class="empty-state">No flashcard decks yet. Click "+ Create Deck" to start!</p>';
    return;
  }

  grid.innerHTML = appData.flashcards.map(deck => {
    const stats = Flashcards.calculateDeckStats(deck);
    return `
      <div class="deck-card">
        <h3>${escapeHtml(deck.name)}</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">${stats.total} cards</p>
        <div class="deck-stats">
          <span class="deck-stat">🆕 ${stats.new} new</span>
          <span class="deck-stat">📚 ${stats.learning} learning</span>
          <span class="deck-stat">✅ ${stats.mastered} mastered</span>
        </div>
        <div class="deck-actions">
          <button class="btn btn-primary" onclick="studyDeck('${deck.id}')">Study</button>
          <button class="btn btn-secondary" onclick="editDeck('${deck.id}')">Edit</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderAnalytics() {
  const gradeStats = Analytics.calculateGradeStats(appData.grades || []);
  const studyStats = Analytics.calculateStudyStats(appData.studySessions || []);
  const assignmentStats = Analytics.calculateAssignmentStats(appData.assignments || []);

  // Study time chart
  if (studyStats.weeklyChart.length > 0) {
    Charts.createBarChart('studyTimeChart', studyStats.weeklyChart, {
      width: 350,
      height: 200,
      showValues: true
    });
  }

  // Grade distribution
  if (appData.grades.length > 0) {
    const distribution = GradeAnalytics.generateDistribution(appData.grades);
    Charts.createBarChart('gradeDistributionChart', distribution.map(d => ({
      label: d.range,
      value: d.count
    })), {
      width: 350,
      height: 200
    });
  }

  // Class performance
  if (gradeStats.byClass && Object.keys(gradeStats.byClass).length > 0) {
    const classData = Object.values(gradeStats.byClass).map(c => ({
      label: c.className.substring(0, 15),
      value: Math.round(c.average)
    }));
    Charts.createBarChart('classPerformanceChart', classData, {
      width: 350,
      height: 200
    });
  }

  // Assignment stats
  document.getElementById('assignmentStats').innerHTML = `
    <div class="analytics-grid">
      <div class="analytics-card-mini">
        <div class="analytics-value">${assignmentStats.total}</div>
        <div class="analytics-label">Total</div>
      </div>
      <div class="analytics-card-mini">
        <div class="analytics-value">${assignmentStats.completed}</div>
        <div class="analytics-label">Completed</div>
      </div>
      <div class="analytics-card-mini">
        <div class="analytics-value">${assignmentStats.pending}</div>
        <div class="analytics-label">Pending</div>
      </div>
      <div class="analytics-card-mini">
        <div class="analytics-value">${assignmentStats.completionRate}%</div>
        <div class="analytics-label">Rate</div>
      </div>
    </div>
  `;
}

function renderSettings() {
  document.getElementById('themeSelect').value = appData.settings.theme || 'auto';
  document.getElementById('accentColor').value = appData.settings.accentColor || '#667eea';
  document.getElementById('enableNotifications').checked = appData.settings.notifications !== false;
  document.getElementById('pomodoroDuration').value = appData.settings.pomodoroDuration || 25;
  document.getElementById('shortBreakDuration').value = appData.settings.shortBreakDuration || 5;
  document.getElementById('longBreakDuration').value = appData.settings.longBreakDuration || 15;

  // Theme presets
  const presets = Settings.getThemePresets();
  document.getElementById('themePresets').innerHTML = Object.entries(presets).map(([key, value]) => `
    <button class="theme-preset-btn" style="background: ${value.color}" onclick="setThemeColor('${value.color}')">
      ${value.name}
    </button>
  `).join('');
}

// ==================== UTILITY FUNCTIONS ====================
function updateClassSelects() {
  const selects = ['assignmentClassSelect', 'examClassSelect', 'gradeClassSelect'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = '<option value="">Select Class</option>' +
        appData.classes.map(cls => `<option value="${cls.id}">${escapeHtml(cls.name)}</option>`).join('');
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function deleteClass(id) {
  if (confirm('Delete this class?')) {
    appData.classes = appData.classes.filter(c => c.id !== id);
    saveData();
    renderClasses();
  }
}

function deleteAssignment(id) {
  if (confirm('Delete this assignment?')) {
    appData.assignments = appData.assignments.filter(a => a.id !== id);
    saveData();
    renderAssignments();
  }
}

function toggleAssignment(id) {
  const a = appData.assignments.find(a => a.id === id);
  if (a) {
    a.completed = !a.completed;
    saveData();
    renderAssignments();
  }
}

function deleteExam(id) {
  if (confirm('Delete this exam?')) {
    appData.exams = appData.exams.filter(e => e.id !== id);
    saveData();
    renderExams();
  }
}

function deleteGrade(id) {
  if (confirm('Delete this grade?')) {
    appData.grades = appData.grades.filter(g => g.id !== id);
    saveData();
    renderGrades();
  }
}

function deleteTask(id) {
  if (confirm('Delete this task?')) {
    appData.tasks = appData.tasks.filter(t => t.id !== id);
    saveData();
    renderTasks();
  }
}

function moveTask(taskId, direction) {
  const task = appData.tasks.find(t => t.id === taskId);
  if (!task) return;

  const columns = TasksKanban.defaultColumns.map(c => c.id);
  const currentIndex = columns.indexOf(task.status);
  const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

  if (newIndex >= 0 && newIndex < columns.length) {
    task.status = columns[newIndex];
    saveData();
    renderTasks();
  }
}

function toggleTaskComplete(taskId) {
  const task = appData.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveData();
    renderTasks();
  }
}

function viewNote(id) {
  const note = appData.notes.find(n => n.id === id);
  if (note) {
    document.getElementById('viewNoteTitle').textContent = note.title;
    document.getElementById('noteViewContent').innerHTML = `
      <div style="white-space: pre-wrap;">${escapeHtml(note.content)}</div>
    `;
    openModal('viewNoteModal');
  }
}

function studyDeck(id) {
  const deck = appData.flashcards.find(d => d.id === id);
  if (deck) {
    alert('Study mode coming soon! Add cards to this deck first.');
  }
}

function editDeck(id) {
  alert('Edit deck functionality coming soon!');
}

function setThemeColor(color) {
  appData.settings.accentColor = color;
  document.documentElement.style.setProperty('--primary-color', color);
  document.getElementById('accentColor').value = color;
  saveData();
}

// ==================== THEME ====================
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  appData.settings.theme = newTheme;
  document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
  saveData();
}

function applySettings() {
  const theme = appData.settings.theme || 'auto';
  const accentColor = appData.settings.accentColor || '#667eea';

  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeToggle').textContent = '☀️';
  } else if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('themeToggle').textContent = '🌙';
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    document.getElementById('themeToggle').textContent = prefersDark ? '☀️' : '🌙';
  }

  document.documentElement.style.setProperty('--primary-color', accentColor);
  timerSeconds = (appData.settings.pomodoroDuration || 25) * 60;
  updateTimerDisplay();
}

// ==================== TIMER ====================
function setupTimer() {
  document.querySelectorAll('.timer-mode').forEach(mode => {
    mode.addEventListener('click', () => {
      document.querySelectorAll('.timer-mode').forEach(m => m.classList.remove('active'));
      mode.classList.add('active');
      timerMode = mode.dataset.mode;
      setTimerDuration(timerMode);
    });
  });

  document.getElementById('mainTimerStart')?.addEventListener('click', toggleTimer);
  document.getElementById('mainTimerPause')?.addEventListener('click', pauseTimer);
  document.getElementById('mainTimerReset')?.addEventListener('click', resetTimer);
  document.getElementById('quickTimerStart')?.addEventListener('click', toggleTimer);
  document.getElementById('quickTimerReset')?.addEventListener('click', resetTimer);
}

function setTimerDuration(mode) {
  const durations = {
    pomodoro: (appData.settings.pomodoroDuration || 25) * 60,
    short: (appData.settings.shortBreakDuration || 5) * 60,
    long: (appData.settings.longBreakDuration || 15) * 60
  };
  timerSeconds = durations[mode] || 25 * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('mainTimerDisplay').textContent = display;
  document.getElementById('quickTimerDisplay').textContent = display;
}

function toggleTimer() {
  if (timerRunning) pauseTimer();
  else startTimer();
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  document.getElementById('mainTimerStart').textContent = 'Pause';
  
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('mainTimerStart').textContent = 'Start';
      alert('Timer complete!');
    }
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  document.getElementById('mainTimerStart').textContent = 'Start';
}

function resetTimer() {
  pauseTimer();
  setTimerDuration(timerMode);
}

// ==================== COMMAND PALETTE ====================
function setupCommandPalette() {
  CommandPalette.init();
  
  document.getElementById('commandInput')?.addEventListener('input', (e) => {
    const results = CommandPalette.search(e.target.value);
    CommandPalette.renderCommands(results);
  });

  document.getElementById('commandInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const selected = document.querySelector('.command-item.selected');
      if (selected) selected.click();
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Handle navigation
    }
  });
}

function openCommandPalette() {
  CommandPalette.open();
}

// ==================== NOTIFICATIONS ====================
function startReminderChecker() {
  setInterval(() => {
    if (!appData.settings.notifications) return;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    appData.classes.forEach(cls => {
      if (cls.days.includes(currentDay) && cls.startTime <= currentTime) {
        const reminderTime = new Date();
        reminderTime.setHours(
          parseInt(cls.startTime.split(':')[0]),
          parseInt(cls.startTime.split(':')[1]) - (cls.reminderMinutes || 15),
          0
        );

        if (now >= reminderTime && now < new Date(reminderTime.getTime() + 60000)) {
          sendNotification(`Class Reminder: ${cls.name}`, `${cls.name} starts at ${cls.startTime}`);
        }
      }
    });
  }, 30000);
}

function sendNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-192.png' });
  }
}

// ==================== DATA EXPORT/IMPORT ====================
function exportData() {
  const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        appData = JSON.parse(event.target.result);
        saveData();
        renderAll();
        applySettings();
        alert('Data imported successfully!');
      } catch (err) {
        alert('Error importing data: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearAllData() {
  if (confirm('⚠️ Delete ALL data? This cannot be undone!')) {
    if (confirm('Really sure?')) {
      appData = {
        classes: [], assignments: [], exams: [], grades: [], notes: [], tasks: [], flashcards: [], studySessions: [],
        settings: { theme: 'auto', accentColor: '#667eea', notifications: true, defaultReminderMinutes: 15,
          pomodoroDuration: 25, shortBreakDuration: 5, longBreakDuration: 15 }
      };
      saveData();
      renderAll();
      applySettings();
      alert('All data cleared.');
    }
  }
}

// Make functions globally available
window.deleteClass = deleteClass;
window.deleteAssignment = deleteAssignment;
window.toggleAssignment = toggleAssignment;
window.deleteExam = deleteExam;
window.deleteGrade = deleteGrade;
window.deleteTask = deleteTask;
window.moveTask = moveTask;
window.toggleTaskComplete = toggleTaskComplete;
window.viewNote = viewNote;
window.studyDeck = studyDeck;
window.editDeck = editDeck;
window.setThemeColor = setThemeColor;
