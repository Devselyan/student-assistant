# Desktop App (Electron)

## Install & Run

```bash
npm install
npm start
```

## Build for Sharing

```bash
npm run build
# Creates .dmg file in dist/
```

## Structure

- `main.js` - Electron main process
- `preload.js` - Security bridge
- `index.html` - UI (uses shared styles)
