# 🚀 AITools Pro v4.0 - QUICK REFERENCE

**Version:** 4.0.0 | **Status:** ✅ Production Ready | **Date:** 27 Feb 2026

---

## 🔧 Installation (2 min)

```
1. chrome://extensions/
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select: C:\Users\marie\Desktop\PAUL\Extensions\AITools
5. Done! See icon in toolbar
```

---

## 📱 4 Main Tabs

| Tab | Icon | Purpose | Features |
|-----|------|---------|----------|
| Quick | ⚡ | Fast access | WhatsApp, ChatGPT, Lucky, Maps |
| Google | 🔍 | Search tools | Categories, Filters, Advanced ops |
| Tools | 🛠️ | Productivity | Pomodoro, Tab manager, Notes |
| Settings | ⚙️ | Configuration | Toggles, Export, Reset |

---

## ✨ Key Features

### Google Search (🔍)
- **6 Categories**: Wiki, Trends, News, Images, Videos, Spelling
- **8 Filters**: Title, URL, Site, Type, Dates, Related, Exact phrase
- **4 Buttons (injected on google.com)**: Lucky, Filters, Maps, ChatGPT

### Productivity (🛠️)
- **Pomodoro**: 25-min timer with notifications
- **Tab Manager**: Auto-groups tabs by domain
- **Note Highlighter**: Right-click text to save notes
- **Note Viewer**: See all saved notes in modal

### Quality of Life
- **Dark Mode**: Forces dark CSS on any page (persists)
- **Ad Blocker**: Removes sponsored results
- **Reading Time**: Auto-shows "⏰ X min" on articles
- **Data Export**: Backup notes as JSON

---

## 🎮 Usage Examples

### Example 1: Google Research
```
1. Type "machine learning" in Tab 🔍
2. Click "📖 Wiki" → Wikipedia opens
3. Click "🔍 Filters" → Set filters
4. Click "📊 Ajouter" buttons to add operators
5. Search input auto-populated → Hit Enter
```

### Example 2: Productive Session
```
1. Click Tab 🛠️
2. Toggle "⏱️ Pomodoro" ON
3. See "⏱️ 25:00" countdown
4. Work for 25 minutes
5. Notification: "Pomodoro Terminé"
6. Take break!
```

### Example 3: Quick Links
```
1. Tab 1 (⚡) always open
2. Click "💬 WhatsApp" → auto-opens
3. Click "🤖 ChatGPT" → auto-opens
4. Click "🍀 Chance" → Lucky search
5. No typing needed!
```

---

## 🔑 Keyboard Actions

| Action | What Happens |
|--------|--------------|
| Click icon | Popup opens |
| Click tab button | Switches tab |
| Type in search | Populates input |
| Click category | Opens new tab with search |
| Click filter | Adds to search input |
| Toggle dark mode | Applies CSS to page |
| Save note | Stores in extension |

---

## 🌐 Global Shortcuts

| Page | Feature | Works Where |
|------|---------|-------------|
| **ANY PAGE** | Reading time badge | Articles > 2000 chars |
| **ANY PAGE** | Dark mode | If toggled ON |
| **ANY PAGE** | Note highlighting | Right-click on text |
| **google.com** | 4 buttons injected | Under search bar |
| **ANY PAGE** | Block ads | If toggled ON |

---

## 📊 Files & Sizes

| File | Size | Purpose |
|------|------|---------|
| popup-new.js | ~15KB | Popup logic |
| content-v4.js | ~12KB | Page features |
| styles-new.css | ~8KB | Styling |
| background-v4.js | ~1KB | Service worker |
| **Total** | **~60KB** | Extension bundle |

---

## ✅ What's Working

```
✅ Popup UI & navigation
✅ All 4 tabs functional
✅ WhatsApp/ChatGPT buttons
✅ Google category searches
✅ Advanced filter operators
✅ Pomodoro timer (25 min)
✅ Tab grouping
✅ Notes with highlighting
✅ Dark mode (persistent)
✅ Ad blocking
✅ Reading time badge
✅ Data export
✅ Reset function
✅ Cross-tab sync
✅ Google buttons injection
✅ Notifications
```

---

## ⚠️ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| **Popup won't open** | Reload extension (↻), reload page, try again |
| **Buttons not working** | Reload page, wait 2 sec, try again |
| **Dark mode not dark** | Reload page, toggle off/on |
| **Google buttons missing** | Reload google.com, wait 1-2 sec |
| **Pomodoro no notification** | Check Chrome notifications are allowed |
| **Notes not saving** | Check Storage in DevTools (F12) |

---

## 🔍 Testing Checklist (Quick)

```
□ Extension loads (icon visible)
□ Popup opens (4 tabs visible)
□ Tab switching works
□ Each button opens correct URL
□ Google buttons appear (on google.com)
□ Dark mode toggles
□ Pomodoro counts down
□ Notes save & display
□ Export downloads JSON
□ Reset clears data
```

**Estimated time: 5 minutes**

---

## 📚 Documentation

| Doc | Read If |
|-----|---------|
| **DEPLOYMENT_GUIDE.md** | Want detailed step-by-step testing |
| **README.md** | Want complete feature description |
| **QUICK_START.md** | Want 2-minute setup |
| **CHANGELOG.md** | Want to know what changed |
| **FINAL_STATUS.md** | Want project overview |

---

## 🎨 Settings Persistence

All settings saved automatically:
- ☀️ Dark mode: YES (persists)
- 📝 Notes: YES (persists)
- ⏰ Reading time: YES (persists)
- 🚫 Block ads: YES (persists)
- 💱 Currency: YES (persists)

**All data in chrome.storage.local**

---

## 🚀 Advanced Usage

### Dark Mode Across All Pages
```
1. Tab ⚡ → Toggle "🌙 Mode sombre"
2. Any page you visit will be dark
3. Reload page → stays dark
4. Toggle OFF → returns to normal
```

### Custom Google Searches
```
1. Tab 🔍 → Type search term
2. Click "📊 Filtres"
3. Add multiple filters:
   - Site: "github.com"
   - After: "2024-01-01"
   - Type: "pdf"
4. Copy search input to Google
5. Hit Enter for advanced search
```

### Batch Tab Organization
```
1. Open many tabs
2. Tab 🛠️ → Click "🗂️ Nettoyer les onglets"
3. Tabs auto-grouped by domain
4. Reduces clutter, improves focus
```

---

## 💾 Data Backup

### Export Data
```
1. Tab ⚙️ → Click "📥 Exporter données"
2. JSON file downloads
3. Contains: notes + timestamp + version
4. Store safely
```

### Import Data
```
Currently: Manual via developer console
Future: Auto-restore from backup
```

---

## 🔐 Privacy & Security

- ✅ No external APIs (except Google)
- ✅ All data stored locally
- ✅ No user tracking
- ✅ No ads or analytics
- ✅ Open source (readable code)
- ✅ No permissions abuse
- ✅ CSP compliant (safe)

---

## 🎯 Tips & Tricks

```
Tip 1: Use Accès Rapide tab for speed
Tip 2: Filters work with OR (logical)
Tip 3: Dark mode is aggressive but safe
Tip 4: Notes sync across tabs
Tip 5: Export before reset
Tip 6: Pomodoro can run in background
Tip 7: Google buttons work instantly
Tip 8: Reading badge auto-hides (no spam)
```

---

## 🆘 Support & Troubleshooting

**If something breaks:**
1. F12 → Console tab
2. Look for error message
3. Reload extension
4. Reload page
5. Try again

**Still broken?**
1. Reset extension (Tab ⚙️ → Reset)
2. Reload completely
3. Try 1-2 more times

---

## 📞 Quick Contact

For bugs/features:
- Check FINAL_STATUS.md (current status)
- Read DEPLOYMENT_GUIDE.md (detailed help)
- Review TEST_CHECKLIST.md (known working state)

---

## 🎉 You're All Set!

Extension is ready to use. Enjoy productivity! 🚀

**Version 4.0.0 - Production Ready** ✅

