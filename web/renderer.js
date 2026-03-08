// Student Assistant Pro - Web Version Renderer
// Uses localStorage instead of Electron IPC

// ==================== STATE ====================
let appData = {
  classes: [],
  assignments: [],
  exams: [],
  grades: [],
  notes: [],
  tasks: [],
  settings: {
    theme: 'auto',
    accentColor: '#667eea',
    notifications: true,
    defaultReminderMinutes: 15
  }
};

let pendingImportClasses = [];
let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;
let timerMode = 'pomodoro';

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupNavigation();
  setupModals();
  setupEventListeners();
  setupTimer();
  renderAll();
  applyTheme();
  requestNotificationPermission();
  startReminderChecker();
});

// ==================== DATA MANAGEMENT ====================
async function loadData() {
  try {
    const saved = localStorage.getItem('studentAssistantData');
    if (saved) {
      appData = JSON.parse(saved);
    }
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
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewName = item.dataset.view;
      switchView(viewName);
    });
  });

  // Sidebar toggle
  const toggleBtn = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      sidebar.classList.toggle('open');
    });
  }
}

function switchView(viewName) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });

  // Render view-specific content
  if (viewName === 'classes') renderClasses();
  if (viewName === 'assignments') renderAssignments();
  if (viewName === 'exams') renderExams();
  if (viewName === 'grades') renderGrades();
  if (viewName === 'calendar') renderCalendar();
  if (viewName === 'notes') renderNotes();
  if (viewName === 'tasks') renderTasks();
  if (viewName === 'dashboard') renderDashboard();
}

// ==================== MODALS ====================
function setupModals() {
  // Close modal when clicking overlay, close button, or cancel button
  document.addEventListener('click', (e) => {
    const target = e.target;
    
    // Close on overlay click
    if (target.classList.contains('modal-overlay')) {
      closeModal(target.closest('.modal'));
    }
    // Close on X button click
    if (target.classList.contains('modal-close')) {
      closeModal(target.closest('.modal'));
    }
    // Close on cancel button click (data-modal attribute)
    if (target.hasAttribute('data-modal')) {
      const modalId = target.getAttribute('data-modal');
      closeModal(modalId);
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(modal => {
        closeModal(modal);
      });
    }
  });

  // Form submissions
  document.getElementById('classForm')?.addEventListener('submit', handleClassSubmit);
  document.getElementById('assignmentForm')?.addEventListener('submit', handleAssignmentSubmit);
  document.getElementById('examForm')?.addEventListener('submit', handleExamSubmit);
  document.getElementById('noteForm')?.addEventListener('submit', handleNoteSubmit);
  document.getElementById('gradeForm')?.addEventListener('submit', handleGradeSubmit);
  document.getElementById('taskForm')?.addEventListener('submit', handleTaskSubmit);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modal) {
  if (typeof modal === 'string') {
    modal = document.getElementById(modal);
  }
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    
    // Reset form if exists
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Quick action buttons
  document.getElementById('quickAddClass')?.addEventListener('click', () => openModal('classModal'));
  document.getElementById('quickAddAssignment')?.addEventListener('click', () => openModal('assignmentModal'));
  document.getElementById('quickAddExam')?.addEventListener('click', () => openModal('examModal'));
  document.getElementById('quickAddNote')?.addEventListener('click', () => openModal('noteModal'));

  // Header action buttons
  document.getElementById('addClassBtn')?.addEventListener('click', () => openModal('classModal'));
  document.getElementById('addAssignmentBtn')?.addEventListener('click', () => openModal('assignmentModal'));
  document.getElementById('addExamBtn')?.addEventListener('click', () => openModal('examModal'));
  document.getElementById('addGradeBtn')?.addEventListener('click', () => openModal('gradeModal'));
  document.getElementById('addNoteBtn')?.addEventListener('click', () => openModal('noteModal'));
  document.getElementById('addTaskBtn')?.addEventListener('click', () => openModal('taskModal'));

  // CSV/ICS Import
  document.getElementById('importCsvBtn')?.addEventListener('click', () => {
    document.getElementById('importFileInput')?.click();
  });

  document.getElementById('importFileInput')?.addEventListener('change', handleFileImport);

  // Import confirmation
  document.getElementById('confirmImportBtn')?.addEventListener('click', () => {
    appData.classes.push(...pendingImportClasses);
    saveData();
    renderClasses();
    closeModal('csvPreviewModal');
    alert('Classes imported successfully!');
  });

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Settings
  document.getElementById('themeSelect')?.addEventListener('change', (e) => {
    appData.settings.theme = e.target.value;
    applyTheme();
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

  // Export/Import data
  document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
  document.getElementById('importDataBtn')?.addEventListener('click', importData);
  document.getElementById('clearAllDataBtn')?.addEventListener('click', clearAllData);

  // Filter buttons
  setupFilters();
}

function setupFilters() {
  // Assignment filters
  document.querySelectorAll('.assignments-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.assignments-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAssignments(btn.dataset.filter);
    });
  });

  // Task filters
  document.querySelectorAll('.tasks-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tasks-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTasks(btn.dataset.filter);
    });
  });
}

// ==================== FORM HANDLERS ====================
function handleClassSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  const newClass = {
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
  };

  appData.classes.push(newClass);
  saveData();
  renderClasses();
  closeModal('classModal');
  form.reset();
}

function handleAssignmentSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  const newAssignment = {
    id: Date.now().toString(),
    title: formData.get('title'),
    classId: formData.get('classId'),
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate'),
    dueTime: formData.get('dueTime'),
    description: formData.get('description') || '',
    completed: false
  };

  appData.assignments.push(newAssignment);
  saveData();
  renderAssignments();
  closeModal('assignmentModal');
  form.reset();
}

function handleExamSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  const newExam = {
    id: Date.now().toString(),
    title: formData.get('title'),
    classId: formData.get('classId'),
    type: formData.get('type'),
    date: formData.get('date'),
    time: formData.get('time') || '',
    location: formData.get('location') || '',
    topics: formData.get('topics') || ''
  };

  appData.exams.push(newExam);
  saveData();
  renderExams();
  closeModal('examModal');
  form.reset();
}

function handleNoteSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  const newNote = {
    id: Date.now().toString(),
    title: formData.get('title'),
    classId: formData.get('classId') || '',
    tags: formData.get('tags') || '',
    content: formData.get('content'),
    createdAt: new Date().toISOString()
  };

  appData.notes.push(newNote);
  saveData();
  renderNotes();
  closeModal('noteModal');
  form.reset();
}

function handleGradeSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  const newGrade = {
    id: Date.now().toString(),
    classId: formData.get('classId'),
    name: formData.get('name'),
    grade: parseFloat(formData.get('grade')),
    weight: parseFloat(formData.get('weight')) || 0,
    date: formData.get('date') || new Date().toISOString().split('T')[0]
  };

  appData.grades.push(newGrade);
  saveData();
  renderGrades();
  closeModal('gradeModal');
  form.reset();
}

function handleTaskSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  const newTask = {
    id: Date.now().toString(),
    title: formData.get('title'),
    dueDate: formData.get('dueDate') || '',
    priority: formData.get('priority'),
    notes: formData.get('notes') || '',
    completed: false
  };

  appData.tasks.push(newTask);
  saveData();
  renderTasks();
  closeModal('taskModal');
  form.reset();
}

// ==================== FILE IMPORT (CSV & ICS) ====================
function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target.result;
      let classes = [];
      
      if (file.name.toLowerCase().endsWith('.ics')) {
        classes = parseICS(content);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        classes = parseCSV(content);
      } else {
        alert('Please select a .csv or .ics file');
        return;
      }
      
      if (classes.length === 0) {
        alert('No valid classes found in file.');
        return;
      }
      pendingImportClasses = classes;
      showCsvPreview(classes);
    } catch (err) {
      alert('Error parsing file: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function parseICS(icsText) {
  const classes = [];
  const events = icsText.split('BEGIN:VEVENT').slice(1);
  
  events.forEach(event => {
    const summary = extractICSField(event, 'SUMMARY');
    const dtstart = extractICSField(event, 'DTSTART');
    const dtend = extractICSField(event, 'DTEND');
    const location = extractICSField(event, 'LOCATION') || 'Online';
    const description = extractICSField(event, 'DESCRIPTION') || '';
    const rrule = extractICSField(event, 'RRULE');
    
    if (!summary || !dtstart || !dtend) return;
    
    // Parse days from RRULE (BYDAY=MO,TU,WE,TH,FR)
    let days = [];
    if (rrule && rrule.includes('BYDAY=')) {
      const byDay = rrule.match(/BYDAY=([^\n;]+)/)?.[1] || '';
      const dayMap = { 'MO': 'Monday', 'TU': 'Tuesday', 'WE': 'Wednesday', 'TH': 'Thursday', 'FR': 'Friday', 'SA': 'Saturday', 'SU': 'Sunday' };
      byDay.split(',').forEach(d => {
        const day = dayMap[d.trim()];
        if (day) days.push(day);
      });
    }
    
    // If no days specified, try to infer from date
    if (days.length === 0) {
      const dateObj = parseICSDate(dtstart);
      if (dateObj) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        days = [dayNames[dateObj.getDay()]];
      }
    }
    
    const startTime = formatICSTime(dtstart);
    const endTime = formatICSTime(dtend);
    
    if (summary && startTime && endTime && days.length > 0) {
      classes.push({
        id: Date.now().toString() + classes.length,
        name: summary,
        teacher: '',
        startTime,
        endTime,
        location: location || 'Online',
        description: description || '',
        days: days,
        color: '#667eea',
        reminderMinutes: 15
      });
    }
  });
  
  return classes;
}

function extractICSField(event, fieldName) {
  const regex = new RegExp(`${fieldName}[:;]([^\\n]+)`, 'i');
  const match = event.match(regex);
  return match ? match[1].trim() : '';
}

function parseICSDate(dateStr) {
  if (!dateStr) return null;
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  
  return new Date(year, month, day);
}

function formatICSTime(dateStr) {
  if (!dateStr) return '';
  if (dateStr.length >= 9 && dateStr.includes('T')) {
    const timePart = dateStr.split('T')[1];
    if (timePart && timePart.length >= 4) {
      const hours = timePart.substring(0, 2);
      const minutes = timePart.substring(2, 4);
      return `${hours}:${minutes}`;
    }
  }
  return '';
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const requiredFields = ['class name', 'start time', 'end time', 'days'];
  const missingFields = requiredFields.filter(field => !headers.includes(field));

  if (missingFields.length > 0) {
    throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
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
      id: Date.now().toString() + i,
      name: row['class name'] || row['class'],
      startTime: parseTime(row['start time']),
      endTime: parseTime(row['end time']),
      location: row['location'] || row['place'] || 'Online',
      description: row['description'] || row['notes'] || '',
      days: parseDays(row['days']),
      color: '#667eea',
      reminderMinutes: parseInt(row['reminder minutes'] || row['reminder'] || '15')
    };

    if (classObj.name && classObj.startTime && classObj.days.length > 0) {
      classes.push(classObj);
    }
  }

  return classes;
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

function showCsvPreview(classes) {
  document.getElementById('classCount').textContent = classes.length;
  const preview = document.getElementById('csvPreview');
  
  preview.innerHTML = `
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== RENDER FUNCTIONS ====================
function renderAll() {
  renderDashboard();
  renderClasses();
  renderAssignments();
  renderExams();
  renderGrades();
  renderCalendar();
  renderNotes();
  renderTasks();
  updateClassSelects();
}

function renderDashboard() {
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', options);

  const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });
  
  const todaysClasses = appData.classes.filter(cls => 
    cls.days.includes(currentDay)
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

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

  const upcomingAssignments = appData.assignments
    .filter(a => !a.completed && a.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const assignmentsContainer = document.getElementById('upcomingAssignments');
  if (upcomingAssignments.length === 0) {
    assignmentsContainer.innerHTML = '<p class="empty-state">No upcoming assignments</p>';
  } else {
    assignmentsContainer.innerHTML = upcomingAssignments.map(a => `
      <div class="assignment-item priority-${a.priority || 'medium'}" style="margin-bottom: 8px;">
        <div>
          <strong>${escapeHtml(a.title)}</strong>
          <div style="font-size: 0.85rem; color: var(--text-muted);">Due: ${a.dueDate}</div>
        </div>
      </div>
    `).join('');
  }

  const streakCount = document.getElementById('streakCount');
  if (streakCount) {
    streakCount.textContent = appData.settings.streak || 0;
  }
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
            Due: ${a.dueDate} ${a.dueTime ? 'at ' + a.dueTime : ''}
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
  const list = document.getElementById('examsList');
  const countdown = document.getElementById('examsCountdown');
  
  if (appData.exams.length === 0) {
    list.innerHTML = '<p class="empty-state">No exams scheduled</p>';
    countdown.innerHTML = '';
    return;
  }

  const today = new Date();
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

  list.innerHTML = appData.exams.map(exam => {
    const cls = appData.classes.find(c => c.id === exam.classId);
    return `
      <div class="assignment-item">
        <div>
          <strong>${escapeHtml(exam.title)}</strong>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">
            ${cls ? `📚 ${escapeHtml(cls.name)} • ` : ''}
            📅 ${exam.date} ${exam.time ? 'at ' + exam.time : ''}
            ${exam.location ? ` • 📍 ${escapeHtml(exam.location)}` : ''}
          </div>
        </div>
        <button class="btn btn-danger" onclick="deleteExam('${exam.id}')">Delete</button>
      </div>
    `;
  }).join('');
}

function renderGrades() {
  const list = document.getElementById('gradesList');
  const summary = document.getElementById('gradesSummary');
  
  if (appData.grades.length === 0) {
    list.innerHTML = '<p class="empty-state">No grades recorded</p>';
    summary.innerHTML = '';
    return;
  }

  const total = appData.grades.reduce((sum, g) => sum + g.grade, 0);
  const avg = (total / appData.grades.length).toFixed(1);

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

  list.innerHTML = appData.grades.map(g => {
    const cls = appData.classes.find(c => c.id === g.classId);
    return `
      <div class="assignment-item">
        <div>
          <strong>${escapeHtml(g.name)}</strong>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">
            ${cls ? `📚 ${escapeHtml(cls.name)} • ` : ''}
            📅 ${g.date}
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${g.grade}%</span>
          <button class="btn btn-danger" onclick="deleteGrade('${g.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== CALENDAR ====================
let currentCalendarDate = new Date();

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
  
  // Get all events for this month
  const events = [];
  appData.classes.forEach(cls => {
    cls.days.forEach(dayName => {
      const dayNum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month, d);
        if (date.getDay() === dayNum) {
          events.push({
            date: d,
            title: cls.name,
            time: cls.startTime,
            color: cls.color || '#667eea',
            type: 'class'
          });
        }
      }
    });
  });
  
  appData.exams.forEach(exam => {
    const examDate = new Date(exam.date);
    if (examDate.getMonth() === month && examDate.getFullYear() === year) {
      events.push({
        date: examDate.getDate(),
        title: exam.title,
        time: exam.time || 'All day',
        color: '#f56565',
        type: 'exam'
      });
    }
  });
  
  appData.assignments.forEach(a => {
    if (!a.completed) {
      const dueDate = new Date(a.dueDate);
      if (dueDate.getMonth() === month && dueDate.getFullYear() === year) {
        events.push({
          date: dueDate.getDate(),
          title: a.title,
          time: 'Due',
          color: '#ed8936',
          type: 'assignment'
        });
      }
    }
  });
  
  let html = '<div class="calendar-grid">';
  html += '<div class="calendar-weekday">Sun</div>';
  html += '<div class="calendar-weekday">Mon</div>';
  html += '<div class="calendar-weekday">Tue</div>';
  html += '<div class="calendar-weekday">Wed</div>';
  html += '<div class="calendar-weekday">Thu</div>';
  html += '<div class="calendar-weekday">Fri</div>';
  html += '<div class="calendar-weekday">Sat</div>';
  
  // Empty cells for days before the first day
  for (let i = 0; i < startingDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  // Day cells
  for (let d = 1; d <= totalDays; d++) {
    const dayEvents = events.filter(e => e.date === d);
    const isToday = isCurrentMonth && d === today.getDate();
    
    html += `<div class="calendar-day ${isToday ? 'today' : ''}">
      <div class="calendar-day-number">${d}</div>
      <div class="calendar-events">`;
    
    dayEvents.slice(0, 3).forEach(e => {
      html += `<div class="calendar-event" style="background: ${e.color};" title="${e.title} at ${e.time}">
        ${e.type === 'class' ? '📖' : e.type === 'exam' ? '📋' : '📝'} ${e.title}
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

document.getElementById('prevMonth')?.addEventListener('click', () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('nextMonth')?.addEventListener('click', () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
});

function renderNotes() {
  const grid = document.getElementById('notesGrid');
  
  if (appData.notes.length === 0) {
    grid.innerHTML = '<p class="empty-state">No notes yet</p>';
    return;
  }

  grid.innerHTML = appData.notes.map(note => {
    const cls = appData.classes.find(c => c.id === note.classId);
    return `
      <div class="note-card">
        <h4>${escapeHtml(note.title)}</h4>
        <p>${escapeHtml(note.content)}</p>
        <div class="note-meta">
          ${cls ? `📚 ${escapeHtml(cls.name)} • ` : ''}
          ${new Date(note.createdAt).toLocaleDateString()}
        </div>
      </div>
    `;
  }).join('');
}

function renderTasks() {
  const list = document.getElementById('tasksList');
  
  if (appData.tasks.length === 0) {
    list.innerHTML = '<p class="empty-state">No tasks yet</p>';
    return;
  }

  list.innerHTML = appData.tasks.map(task => `
    <div class="task-item">
      <div style="display: flex; align-items: center; gap: 12px;">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" style="width: 20px; height: 20px;">
        <div>
          <strong style="${task.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${escapeHtml(task.title)}</strong>
          ${task.dueDate ? `<div style="font-size: 0.85rem; color: var(--text-secondary);">Due: ${task.dueDate}</div>` : ''}
        </div>
      </div>
      <button class="btn btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
    </div>
  `).join('');
}

function updateClassSelects() {
  const selects = [
    'assignmentClassSelect',
    'examClassSelect',
    'noteClassSelect',
    'gradeClassSelect'
  ];

  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      const currentValue = select.value;
      select.innerHTML = '<option value="">Select Class</option>' +
        appData.classes.map(cls => `<option value="${cls.id}">${escapeHtml(cls.name)}</option>`).join('');
      select.value = currentValue;
    }
  });
}

// ==================== DELETE FUNCTIONS ====================
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
  const assignment = appData.assignments.find(a => a.id === id);
  if (assignment) {
    assignment.completed = !assignment.completed;
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

function toggleTask(id) {
  const task = appData.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveData();
    renderTasks();
  }
}

// ==================== TIMER ====================
function setupTimer() {
  const timerModes = document.querySelectorAll('.timer-mode');
  timerModes.forEach(mode => {
    mode.addEventListener('click', () => {
      timerModes.forEach(m => m.classList.remove('active'));
      mode.classList.add('active');
      timerMode = mode.dataset.mode;
      setTimerDuration(timerMode);
    });
  });

  document.getElementById('mainTimerStart')?.addEventListener('click', toggleTimer);
  document.getElementById('mainTimerPause')?.addEventListener('click', pauseTimer);
  document.getElementById('mainTimerReset')?.addEventListener('click', resetTimer);

  document.getElementById('quickTimerStart')?.addEventListener('click', toggleQuickTimer);
  document.getElementById('quickTimerReset')?.addEventListener('click', resetQuickTimer);
}

function setTimerDuration(mode) {
  const durations = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
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
  if (timerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
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

function toggleQuickTimer() {
  if (timerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function resetQuickTimer() {
  pauseTimer();
  setTimerDuration(timerMode);
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

function applyTheme() {
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
  document.getElementById('accentColor').value = accentColor;
  document.getElementById('themeSelect').value = theme;
  document.getElementById('enableNotifications').checked = appData.settings.notifications;
}

// ==================== NOTIFICATIONS ====================
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendClassReminder(cls) {
  if (Notification.permission === 'granted') {
    new Notification(`📚 Class Reminder: ${cls.name}`, {
      body: `${cls.name} starts at ${cls.startTime} in ${cls.location || 'online'}`,
      icon: 'icon-192.svg'
    });
  }
}

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
          sendClassReminder(cls);
        }
      }
    });
  }, 30000);
}

// ==================== EXPORT/IMPORT ====================
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
        const imported = JSON.parse(event.target.result);
        appData = imported;
        saveData();
        renderAll();
        applyTheme();
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
  if (confirm('⚠️ Are you sure you want to delete ALL data? This cannot be undone!')) {
    if (confirm('Really sure? This will delete all classes, assignments, exams, grades, notes, and tasks.')) {
      appData = {
        classes: [],
        assignments: [],
        exams: [],
        grades: [],
        notes: [],
        tasks: [],
        settings: {
          theme: 'auto',
          accentColor: '#667eea',
          notifications: true,
          defaultReminderMinutes: 15
        }
      };
      saveData();
      renderAll();
      applyTheme();
      alert('All data cleared.');
    }
  }
}

// Make delete functions globally available
window.deleteClass = deleteClass;
window.deleteAssignment = deleteAssignment;
window.toggleAssignment = toggleAssignment;
window.deleteExam = deleteExam;
window.deleteGrade = deleteGrade;
window.deleteTask = deleteTask;
window.toggleTask = toggleTask;
