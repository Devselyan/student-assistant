# 🎓 Student Assistant - Complete Suite

**Both Desktop App AND Web App in one repo!**

---

## 📁 Project Structure

```
student-assistant-shared/
├── shared/              # Common code (styles, logic)
│   ├── styles.css
│   ├── renderer.js
│   └── sample_schedule.csv
├── desktop/             # Electron desktop app
│   ├── main.js
│   ├── preload.js
│   ├── index.html
│   └── package.json
├── web/                 # Web app (PWA)
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   └── README.md
├── LICENSE
├── PRIVACY.md
├── DISCLAIMER.md
└── README.md
```

---

## 🚀 Quick Start

### Desktop App (Electron)
```bash
cd desktop
npm install
npm start
```

### Web App (PWA)
```bash
cd web
python3 -m http.server 8080
# Open http://localhost:8080
```

---

## 📤 Deploy

### Desktop App
```bash
cd desktop
npm run build
# Shares as .dmg file
```

### Web App (GitHub Pages)
```bash
cd web
# Push to GitHub, enable Pages in settings
# Share the link!
```

---

## 🔄 Update Both

When you make changes to `shared/`, copy to both apps:

```bash
# Update shared code
cp shared/styles.css desktop/
cp shared/styles.css web/
cp shared/renderer.js desktop/
cp shared/renderer.js web/
```

---

## 📋 What Each App Is For

| Use Case | Desktop App | Web App |
|----------|-------------|---------|
| Personal daily use | ✅ Best | ✅ OK |
| Share with friends | ⚠️ Complex | ✅ Perfect |
| System notifications | ✅ Yes | ⚠️ Browser only |
| Works offline | ✅ Yes | ✅ Yes (PWA) |
| Any device | ❌ Mac only | ✅ Yes |
| No install | ❌ Required | ✅ Yes |

---

## 💡 Recommendation

**Use Desktop App yourself** (better notifications, native feel)
**Share Web App with friends** (one link, works everywhere)

---

## Legal

- **LICENSE** - MIT (free to use/share)
- **PRIVACY.md** - No data collection
- **DISCLAIMER.md** - Usage terms

---

Made with ❤️ for students everywhere!
