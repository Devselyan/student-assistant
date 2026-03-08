# 📚 Class Reminder - Web App

**Safe, simple, and free to share!**

## 🌐 Try It Locally

```bash
cd /Users/dev/student-assistant-web
python3 -m http.server 8080
```

Then open: `http://localhost:8080`

---

## 📤 Deploy to GitHub Pages (Free!)

### Step 1: Push to GitHub

```bash
cd /Users/dev/student-assistant-web
git init
git add .
git commit -m "Class Reminder Web App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/class-reminder.git
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** → **Pages**
3. Source: **Deploy from branch** → **main** → **root**
4. Click **Save**

### Step 3: Share the Link!

Your app will be live at:
```
https://YOUR_USERNAME.github.io/class-reminder/
```

---

## ✅ What Your Friend Gets

- **One link** - no download, no install
- **Works on any device** - Mac, Windows, iPhone, Android
- **Auto-updates** - when you push changes
- **Safe** - runs in browser, no warnings
- **Free hosting** - GitHub Pages is free forever

---

## 🔄 Update the App

```bash
# Edit files
git add .
git commit -m "Added new feature"
git push
```

**Your friend sees updates automatically!**

---

## 📱 Install as App (Optional)

Friends can "install" it:

**Chrome/Edge:**
1. Click menu (⋮) → **Save and share** → **Create shortcut**
2. Check "Open as window"

**iPhone:**
1. Safari → Share → **Add to Home Screen**

**Android:**
1. Chrome → Menu → **Install app**

---

## Features

- ✅ Add classes manually
- ✅ Import from CSV
- ✅ Export to calendar (.ics)
- ✅ Browser notifications
- ✅ Works offline (PWA)
- ✅ Mobile responsive

---

## Privacy

- All data stored **locally** in browser
- No server, no tracking, no data collection
- Clear browser data = all data gone

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main page |
| `styles.css` | Styling |
| `renderer.js` | App logic (no Electron!) |
| `manifest.json` | PWA config |
| `sw.js` | Service worker (offline) |

---

**That's it! Share the link and you're done!**
