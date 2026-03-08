# Student Assistant Pro - Web Version

A complete student productivity app that runs in your browser.

## Features

- 📖 **My Classes** - Track all your classes with times, locations, and days
- 📝 **Assignments** - Manage assignments with priorities and due dates
- 📋 **Exams** - Track exams with countdown timers
- 🎯 **Grades** - Record and track your grades
- ⏱️ **Study Timer** - Pomodoro timer for focused study sessions
- 📓 **Notes** - Take and organize class notes
- ✓ **Tasks** - Manage your to-do list
- 📊 **Dashboard** - Overview of today's schedule and upcoming work

## Usage

### Option 1: Open Directly
Just open `index.html` in your browser. All data is saved to localStorage.

### Option 2: Use a Local Server (Recommended)
```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Deploy to GitHub Pages
1. Push this folder to a GitHub repository
2. Go to Settings > Pages
3. Select the branch and save
4. Your app will be live at `https://yourusername.github.io/repo-name`

## Import from School Website

1. Export your schedule as `.ics` or `.csv` from your school website
2. Click "📁 Import CSV/ICS" in the My Classes view
3. Select your file
4. Preview and confirm the import

## Share with Friends

Send them this folder or the GitHub Pages link. All data stays in their browser (localStorage).

## Data Storage

- All data is stored locally in your browser's localStorage
- Use "📥 Export All Data" to backup
- Use "📤 Import Data" to restore from backup
- Data is NOT synced across devices

## PWA Support

This app works as a Progressive Web App:
- Works offline after first load
- Can be installed to home screen on mobile
- Sends class reminders (with permission)
