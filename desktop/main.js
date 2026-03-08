const { app, BrowserWindow, ipcMain, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let reminderInterval;

const DATA_FILE = path.join(app.getPath('userData'), 'student-data.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png'),
    titleBarStyle: 'hiddenInset',
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

function loadAllData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading data:', err);
  }
  return {
    classes: [],
    assignments: [],
    exams: [],
    grades: [],
    notes: [],
    tasks: [],
    teachers: [],
    flashcards: [],
    resources: [],
    settings: {
      theme: 'auto',
      accentColor: '#667eea',
      notifications: true,
      defaultReminderMinutes: 15
    }
  };
}

function saveAllData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving data:', err);
    return false;
  }
}

function checkReminders() {
  const data = loadAllData();
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toTimeString().slice(0, 5);

  data.classes.forEach(cls => {
    if (cls.days && cls.days.includes(currentDay) && cls.startTime <= currentTime) {
      const reminderTime = new Date();
      reminderTime.setHours(
        parseInt(cls.startTime.split(':')[0]),
        parseInt(cls.startTime.split(':')[1]) - (cls.reminderMinutes || 15),
        0
      );

      if (now >= reminderTime && now < new Date(reminderTime.getTime() + 60000)) {
        new Notification({
          title: `📚 Class Reminder: ${cls.name}`,
          body: `${cls.name} starts at ${cls.startTime} in ${cls.location || 'online'}`,
          silent: false
        }).show();
      }
    }
  });

  // Check assignment reminders
  data.assignments.forEach(assignment => {
    if (assignment.dueDate && !assignment.completed) {
      const dueDate = new Date(assignment.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const hoursUntilDue = timeDiff / (1000 * 60 * 60);
      
      if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
        new Notification({
          title: `📝 Assignment Due: ${assignment.title}`,
          body: `${assignment.title} is due ${hoursUntilDue < 1 ? 'soon' : 'in ' + Math.round(hoursUntilDue) + ' hours'}`,
          silent: false
        }).show();
      }
    }
  });
}

// IPC Handlers
ipcMain.handle('get-all-data', () => {
  return loadAllData();
});

ipcMain.handle('save-all-data', (event, data) => {
  return saveAllData(data);
});

ipcMain.handle('export-data', () => {
  const data = loadAllData();
  return JSON.stringify(data, null, 2);
});

ipcMain.handle('import-data', (event, data) => {
  try {
    const parsed = JSON.parse(data);
    saveAllData(parsed);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-calendar', () => {
  const data = loadAllData();
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Student Assistant Pro//EN\n';

  data.classes.forEach(cls => {
    const [startHour, startMin] = cls.startTime.split(':').map(Number);
    const [endHour, endMin] = cls.endTime.split(':').map(Number);

    (cls.days || []).forEach(day => {
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

  // Add exams
  data.exams.forEach(exam => {
    if (exam.date) {
      const startDate = exam.date.replace(/-/g, '');
      const startTime = exam.time ? `${exam.time.replace(':', '')}00` : '090000';
      const endTime = exam.time ? `${(parseInt(exam.time.split(':')[0]) + 2).toString().padStart(2, '0')}${exam.time.split(':')[1]}00` : '110000';
      
      ics += `BEGIN:VEVENT\n`;
      ics += `DTSTART:${startDate}T${startTime}\n`;
      ics += `DTEND:${startDate}T${endTime}\n`;
      ics += `SUMMARY:${exam.title}\n`;
      ics += `DESCRIPTION:${exam.topics || ''}\n`;
      ics += `LOCATION:${exam.location || 'TBA'}\n`;
      ics += `END:VEVENT\n`;
    }
  });

  ics += 'END:VCALENDAR';
  return ics;
});

ipcMain.handle('export-csv', () => {
  const data = loadAllData();
  let csv = 'Type,Name,Date/Time,Location,Details\n';

  data.classes.forEach(cls => {
    csv += `Class,"${cls.name}","${cls.startTime}-${cls.endTime}","${cls.location || ''}","${cls.days.join(', ')}"\n`;
  });

  data.assignments.forEach(a => {
    csv += `Assignment,"${a.title}","${a.dueDate}","${a.classId || ''}","${a.priority || 'medium'}"\n`;
  });

  data.exams.forEach(e => {
    csv += `Exam,"${e.title}","${e.date}","${e.location || ''}","${e.type || ''}"\n`;
  });

  return csv;
});

ipcMain.handle('show-save-dialog', async (event, content, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [{ name: 'Files', extensions: ['json', 'ics', 'csv'] }]
  });
  
  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, content);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { canceled: true };
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { canceled: true };
});

app.whenReady().then(() => {
  createWindow();
  reminderInterval = setInterval(checkReminders, 30000);
  checkReminders();
});

app.on('window-all-closed', () => {
  if (reminderInterval) clearInterval(reminderInterval);
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
