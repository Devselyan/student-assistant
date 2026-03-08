// Class Reminder Web App - No Electron!

const STORAGE_KEY = 'classReminderData';
let reminderInterval;
let pendingImportClasses = [];

// DOM Elements
const classesList = document.getElementById('classesList');
const addClassBtn = document.getElementById('addClassBtn');
const importCsvBtn = document.getElementById('importCsvBtn');
const exportBtn = document.getElementById('exportBtn');
const classForm = document.getElementById('classForm');
const classFormInner = document.getElementById('classFormInner');
const cancelBtn = document.getElementById('cancelBtn');
const csvFileInput = document.getElementById('csvFileInput');
const csvPreviewModal = document.getElementById('csvPreviewModal');
const csvPreview = document.getElementById('csvPreview');
const classCount = document.getElementById('classCount');
const confirmImportBtn = document.getElementById('confirmImportBtn');
const cancelImportBtn = document.getElementById('cancelImportBtn');
const notificationPrompt = document.getElementById('notificationPrompt');
const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');
const dismissNotificationBtn = document.getElementById('dismissNotificationBtn');

// Data functions using localStorage
function loadClasses() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error loading classes:', err);
    return [];
  }
}

function saveClasses(classes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    return true;
  } catch (err) {
    console.error('Error saving classes:', err);
    return false;
  }
}

// Notification functions
function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      notificationPrompt.classList.add('hidden');
      new Notification('📚 Class Reminder', {
        body: 'Notifications enabled! You\'ll get reminders for your classes.',
        icon: 'icon-192.png'
      });
    }
  });
}

function showNotificationPrompt() {
  if ('Notification' in window && Notification.permission === 'default') {
    notificationPrompt.classList.remove('hidden');
  }
}

function sendClassReminder(cls) {
  if (Notification.permission === 'granted') {
    new Notification(`📚 Class Reminder: ${cls.name}`, {
      body: `${cls.name} starts at ${cls.startTime} in ${cls.location || 'online'}`,
      icon: 'icon-192.png',
      tag: cls.id
    });
  }
}

function checkReminders() {
  const classes = loadClasses();
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toTimeString().slice(0, 5);

  classes.forEach(cls => {
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
}

// Render functions
function renderClasses(classes) {
  if (classes.length === 0) {
    classesList.innerHTML = `
      <div class="empty-state">
        <h3>No classes yet!</h3>
        <p>Click "Add Class" or "Import CSV" to get started</p>
      </div>
    `;
    return;
  }

  classesList.innerHTML = classes.map(cls => `
    <div class="class-card" data-id="${cls.id}">
      <div class="class-info">
        <h3>${escapeHtml(cls.name)}</h3>
        <div class="class-details">
          <span>⏰ ${cls.startTime} - ${cls.endTime}</span>
          <span>📍 ${escapeHtml(cls.location || 'Online')}</span>
          <span>🔔 ${cls.reminderMinutes}min before</span>
          <br><span>📅 ${cls.days.join(', ')}</span>
        </div>
      </div>
      <div class="class-actions">
        <button class="btn btn-danger" onclick="deleteClass('${cls.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function deleteClass(id) {
  if (confirm('Are you sure you want to delete this class?')) {
    let classes = loadClasses();
    classes = classes.filter(c => c.id !== id);
    saveClasses(classes);
    renderClasses(classes);
  }
}

// Form handling
addClassBtn.addEventListener('click', () => {
  classForm.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  classForm.classList.add('hidden');
  classFormInner.reset();
});

classFormInner.addEventListener('submit', (e) => {
  e.preventDefault();

  const days = Array.from(document.querySelectorAll('input[name="days"]:checked'))
    .map(cb => cb.value);

  if (days.length === 0) {
    alert('Please select at least one day');
    return;
  }

  const newClass = {
    id: Date.now().toString(),
    name: document.getElementById('className').value,
    startTime: document.getElementById('startTime').value,
    endTime: document.getElementById('endTime').value,
    location: document.getElementById('location').value,
    description: document.getElementById('description').value,
    days: days,
    reminderMinutes: parseInt(document.getElementById('reminderMinutes').value)
  };

  const classes = loadClasses();
  classes.push(newClass);
  saveClasses(classes);

  classForm.classList.add('hidden');
  classFormInner.reset();
  renderClasses(classes);
});

// CSV Import
importCsvBtn.addEventListener('click', () => {
  csvFileInput.click();
});

csvFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const csvText = event.target.result;
    const parsedClasses = parseCSV(csvText);

    if (parsedClasses.length === 0) {
      alert('No valid classes found in CSV. Please check the format.');
      return;
    }

    pendingImportClasses = parsedClasses;
    showPreview(parsedClasses);
  };
  reader.readAsText(file);
  csvFileInput.value = '';
});

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

function showPreview(classes) {
  classCount.textContent = classes.length;

  const tableHtml = `
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
    <div class="csv-template-link">
      <a href="#" id="downloadTemplateLink">📥 Download CSV Template</a>
    </div>
  `;

  csvPreview.innerHTML = tableHtml;
  csvPreviewModal.classList.remove('hidden');

  document.getElementById('downloadTemplateLink').addEventListener('click', (e) => {
    e.preventDefault();
    downloadTemplate();
  });
}

function downloadTemplate() {
  const template = `Class Name,Start Time,End Time,Location,Days,Description,Reminder Minutes
Mathematics 101,09:00,10:30,Room 201,Monday;Wednesday;Friday,Calculus course,15
Physics 201,14:00,15:30,Lab 3,Tuesday;Thursday,Laboratory required,30
English Literature,11:00,12:00,Building A,Monday;Wednesday;Friday,Shakespeare focus,15
Computer Science,10:00,11:30,Online,Thursday,Programming basics,20`;

  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'class_schedule_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

confirmImportBtn.addEventListener('click', () => {
  const classes = loadClasses();
  classes.push(...pendingImportClasses);
  saveClasses(classes);
  csvPreviewModal.classList.add('hidden');
  pendingImportClasses = [];
  renderClasses(classes);
  alert('Classes imported successfully!');
});

cancelImportBtn.addEventListener('click', () => {
  csvPreviewModal.classList.add('hidden');
  pendingImportClasses = [];
});

// Export Calendar
exportBtn.addEventListener('click', () => {
  const classes = loadClasses();
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Class Reminder App//EN\n';

  classes.forEach(cls => {
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

      ics += `BEGIN:VEVENT\n`;
      ics += `DTSTART:${startDate}T${startTime}\n`;
      ics += `DTEND:${startDate}T${endTime}\n`;
      ics += `SUMMARY:${cls.name}\n`;
      ics += `DESCRIPTION:${cls.description || ''}\n`;
      ics += `LOCATION:${cls.location || 'Online'}\n`;
      ics += `RRULE:FREQ=WEEKLY\n`;
      ics += `END:VEVENT\n`;
    });
  });

  ics += 'END:VCALENDAR';

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'classes.ics';
  a.click();
  URL.revokeObjectURL(url);
  alert('Calendar exported! Import this file into Google Calendar, Apple Calendar, or Outlook.');
});

// Notification buttons
enableNotificationsBtn.addEventListener('click', () => {
  requestNotificationPermission();
});

dismissNotificationBtn.addEventListener('click', () => {
  notificationPrompt.classList.add('hidden');
});

// Initialize
function init() {
  renderClasses(loadClasses());
  reminderInterval = setInterval(checkReminders, 30000);
  checkReminders();

  // Show notification prompt after 2 seconds if permission not granted
  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      showNotificationPrompt();
    }
  }, 2000);
}

init();
