# 🐛 BUG TESTING CHECKLIST - Session 22

**Objectif**: Identifier ALL bugs: UI, logic, performance, crashes  
**Testing scope**: 5+ sites + all features + all tabs  

---

## ✅ BUGS TROUVÉS ET FIXES REQUIS

### À tester:

1. **DOUBLE SCROLLBAR** (User-reported)
   - [ ] Popup main content area
   - [ ] Summary panel
   - [ ] Translation panel
   - [ ] Settings/Config tab
   - [ ] Notes modal
   - **Status**: LOCALISER + FIXER

2. **BUTTONS/VISIBILITY**
   - [ ] Summarizer button position (desktop/mobile)
   - [ ] Translator button position
   - [ ] Buttons not overlapping search results
   - [ ] Buttons visible on all pages
   - [ ] Close button (X) works
   
3. **SETTINGS PANEL**
   - [ ] Slider "Longueur résumé" - value updates?
   - [ ] Slider "Sensibilité IA" - value updates?
   - [ ] Select "Langue traduction" - persist?
   - [ ] Select "Langue résumé" - persist?
   - [ ] Values load on popup reopen?
   
4. **ANIMATIONS**
   - [ ] Slide-in smooth on buttons?
   - [ ] Hover effects work?
   - [ ] Slide-out smooth on close?
   - [ ] No lag/stuttering?
   - [ ] Show stagger correctly (0.1s delay)?
   
5. **SUMMARY PANEL**
   - [ ] Generates on Wikipedia?
   - [ ] Generates on Reddit?
   - [ ] Generates on Medium?
   - [ ] Generates on News site?
   - [ ] Copy button works?
   - [ ] Close button works?
   - [ ] Scrollable if long?
   - [ ] Responsive mobile?
   
6. **TRANSLATION PANEL**
   - [ ] Shows error if no Nano?
   - [ ] Shows translation if Nano active?
   - [ ] Dual-column on desktop?
   - [ ] Single column mobile?
   - [ ] Correct language display?
   - [ ] Close button works?
   
7. **POPUP TABS**
   - [ ] "⚡ Accès" tab loads?
   - [ ] "🔍 Google" tab loads?
   - [ ] "🛠️ Outils" tab loads?
   - [ ] "🧠 IA" tab loads?
   - [ ] "⚙️ Config" tab loads?
   - [ ] "🔍 API" tab loads?
   - [ ] Tab switching smooth?
   - [ ] No content bleeding between tabs?
   
8. **CONSOLE ERRORS**
   - [ ] F12 → Console clean?
   - [ ] No red errors?
   - [ ] [AIinjected] logs present?
   - [ ] [AIService] logs present?
   - [ ] [Summarizer] logs present?
   
9. **PAGE INTEGRATION**
   - [ ] Content script loads correctly?
   - [ ] Page script injects properly?
   - [ ] IPC messaging works?
   - [ ] No page slowdown?
   - [ ] No layout shift?
   
10. **CRASHES/FREEZES**
    - [ ] Summarize doesn't freeze page?
    - [ ] Translate doesn't freeze page?
    - [ ] Switching tabs doesn't stall?
    - [ ] Closing panels instant?

---

## TEST SITES

Test each bug on at least 3 sites:

1. **Wikipedia**: https://fr.wikipedia.org/wiki/France
   - Long article, structured content
   - Good for summarize testing

2. **Reddit**: https://www.reddit.com/r/AskReddit/
   - Long threads
   - Comments to summarize

3. **Medium**: https://medium.com
   - Long-form articles
   - Good for translation

4. **News**: https://www.bbc.com/news/
   - Mixed content
   - Short + long articles

5. **Your choice**: Any site with content

---

## FINDINGS TEMPLATE

```markdown
### Bug: [TITLE]
- **Severity**: Bloquant / Haut / Moyen / Bas
- **Location**: [File + rough line]
- **Reproduction**: [Steps to reproduce]
- **Symptom**: [What user sees]
- **Expected**: [What should happen]
- **Impact**: [Why it matters]
```

---

## TESTING SCRIPT

```javascript
// Paste in F12 console after loading extension:

// Check window.ai
console.log('window.ai:', !!window.ai);

// Check AIService
console.log('window.aiService:', !!window.aiService);
console.log('window.aiService.isAvailable:', window.aiService?.isAvailable);

// Check Settings
chrome.storage.local.get(null, (data) => {
  console.log('All settings:', data);
});

// Check ButtonManager
console.log('ButtonManager buttons:', window.ButtonManager?.buttons?.length || 0);
```

---

## PRIORITY FIX ORDER

1. **BLOQUANT** (must fix before deploy)
   - Double scrollbar
   - Crashes/freezes
   - Console errors

2. **HAUT** (important)
   - Settings not persisting
   - Buttons misaligned
   - Animations laggy

3. **MOYEN** (nice-to-have)
   - Copy button UX
   - Font sizes
   - Spacing

4. **BAS** (cosmetic)
   - Color contrast
   - Icon alignment

---

## DOCUMENTED BUGS (FROM CODE REVIEW)

None found in static analysis. All bugs must be found via runtime testing.

---

**START TESTING NOW - Test on all 5 sites, compile findings**
