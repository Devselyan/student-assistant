const { app, BrowserWindow, ipcMain, Notification, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let reminderInterval;

const DATA_FILE = path.join(app.getPath('userData'), 'classes.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png')
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenu(null);
}

function loadClasses() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading classes:', err);
  }
  return [];
}

function saveClasses(classes) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(classes, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving classes:', err);
    return false;
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
        new Notification({
          title: `📚 Class Reminder: ${cls.name}`,
          body: `${cls.name} starts at ${cls.startTime} in ${cls.location || 'online'}`,
          silent: false
        }).show();
      }
    }
  });
}

ipcMain.handle('get-classes', () => {
  return loadClasses();
});

ipcMain.handle('save-class', (event, cls) => {
  const classes = loadClasses();
  cls.id = Date.now().toString();
  classes.push(cls);
  saveClasses(classes);
  return classes;
});

ipcMain.handle('delete-class', (event, id) => {
  let classes = loadClasses();
  classes = classes.filter(c => c.id !== id);
  saveClasses(classes);
  return classes;
});

ipcMain.handle('export-calendar', () => {
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
  return ics;
});

ipcMain.handle('export-csv', () => {
  const classes = loadClasses();
  let csv = 'Class Name,Start Time,End Time,Location,Days,Description,Reminder Minutes\n';

  classes.forEach(cls => {
    const daysStr = cls.days.join(';');
    const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
    csv += `${escapeCsv(cls.name)},${cls.startTime},${cls.endTime},${escapeCsv(cls.location)},${daysStr},${escapeCsv(cls.description || '')},${cls.reminderMinutes}\n`;
  });

  return csv;
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
