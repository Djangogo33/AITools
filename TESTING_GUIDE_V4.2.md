# Testing Guide - AITools Pro v4.2 🧪

## Pre-Testing Setup

### 1. Reload Extension
```
1. Go to chrome://extensions/
2. Find "AITools Pro"
3. Click "🔄 Reload" button
4. All new features should initialize
```

### 2. Clear Extension Data (if needed)
```
1. Right-click extension icon → "Manage extension"
2. Click "🗑️ Clear data" if experiencing issues
3. Hard refresh page (Ctrl+Shift+R)
```

### 3. Enable Development Mode Logs
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for [AITools] logs for feature activity
```

---

## Feature Testing Checklist

### ✅ TEST #1: Translation API (CRITICAL)

**Objective**: Verify translation works without auth errors

**Test Steps**:
1. Navigate to French article: `https://www.lemonde.fr`
2. Select any French text (highlight with mouse)
3. Click 🌐 translation button that appears
4. **Expected Result**: English translation appears in modal

**Verify**:
- [ ] Translation appears (not "AUTHENTICATION FAILURE")
- [ ] Console shows: "[AITools] Translation successful"
- [ ] Modal displays source + translation side-by-side
- [ ] "Copier traduction" button works

**If Failed**:
- Check console for exact error message
- Verify internet connection
- Try Reverso API: https://api.reverso.net/translate/en?text=bonjour

---

### ✅ TEST #2: Summarizer Button Visibility

**Objective**: Button only shows on long content pages

**TEST #2A: Long Article (Button Should Appear)**
1. Go to: `https://www.wikipedia.org` (any long article)
2. Wait 2 seconds for page to fully load
3. **Expected**: ✂️ "Résumer" button appears in top-left
4. Click button
5. **Expected**: Modal shows summary of article

**Verify**:
- [ ] Button appears on Wikipedia article (1000+ words)
- [ ] Button has ✂️ icon and "Résumer" text
- [ ] Clicking shows summary modal
- [ ] Summary is coherent and shorter than original

**TEST #2B: Short Snippet (Button Should NOT Appear)**
1. Go to: Twitter/X search with news snippets
2. Scroll through short-form content
3. **Expected**: NO summarizer button appears
4. Check console should NOT show init message for short pages

**Verify**:
- [ ] No button on short content (<500 chars)
- [ ] No button on product descriptions
- [ ] Summarizer smart detection working

---

### ✅ TEST #3: Reading Time Indicator

**Objective**: Reading time badge shows only on article pages

**Test Steps**:
1. Go to `https://medium.com` (any article)
2. Wait 2 seconds after page load
3. **Expected**: 📖 "X min de lecture" badge appears top-right
4. Hover over badge
5. **Expected**: Shows tooltip with word count

**Verify**:
- [ ] Badge appears on article pages
- [ ] Shows accurate time estimate (roughly matches perceived reading time)
- [ ] Tooltip shows word count
- [ ] Auto-hides after 5 seconds (visible on hover)
- [ ] Draggable if you move it
- [ ] Does NOT appear on short pages

**Word Count Verification**:
- Go to any long article
- Open DevTools Console
- Type: `document.body.innerText.split(/\s+/).filter(w => w.length > 0).length`
- Cross-check with badge calculation

---

### ✅ TEST #4: Quick Page Statistics

**Objective**: Stats widget shows accurate page composition data

**Test Steps**:
1. Go to `https://www.wikipedia.org` (content-rich page)
2. Look for 📊 "Statistiques page" widget in bottom-right
3. **Don't click yet** - verify values look reasonable
4. Manually count elements on page:
   - Count visible links: `document.querySelectorAll('a').length`
   - Count images: `document.querySelectorAll('img').length`
   - Count paragraphs: `document.querySelectorAll('p').length`
5. Click widget header to expand
6. **Expected**: Stats match manual counts

**Verify**:
- [ ] Widget appears with purple header
- [ ] Stats are accurate (within 10%)
- [ ] Widget is draggable to new position
- [ ] Expand/collapse works smoothly
- [ ] Only shows on content-rich pages (3+ interactive elements)

**Automated Verification**:
```javascript
// In console, run this to compare
const actual = {
  links: document.querySelectorAll('a').length,
  images: document.querySelectorAll('img').length,
  paragraphs: document.querySelectorAll('p').length
};
console.log(actual);
// Compare with widget display values
```

---

### ✅ TEST #5: Cookie Blocker (Enhanced)

**Objective**: Automatically closes cookie/consent popups

**TEST #5A: OneTrust Popups**
1. Go to site using OneTrust: `https://www.netflix.com` (or any major site)
2. **Expected**: Cookie modal appears on load
3. Wait 2 seconds
4. **Expected**: Popup automatically closes without user clicking "Accept"
5. Check console: `[AITools] Clicking accept button`

**Verify**:
- [ ] Popup automatically closes within 2 seconds
- [ ] No manual click needed
- [ ] Overlay/backdrop also removed
- [ ] Can scroll page freely

**TEST #5B: Custom Consent (French)**
1. Go to a French site using custom consent: `https://www.lematinefrais.com` 
2. Look for popup with French button "J'accepte" or "Accepter"
3. **Expected**: Auto-closes within 2 seconds

**Verify**:
- [ ] Detects French language buttons
- [ ] Works with "j'accepte", "accepter", "tout accepter"
- [ ] Clicks button automatically (not just hides)

**TEST #5C: Borlabs Cookie**
1. Go to site using Borlabs: `https://www.lemenageur.com`
2. **Expected**: Popup closes automatically
3. Console should show blocker activity

**Verify**:
- [ ] Works with Borlabs' proprietary markup
- [ ] Removes overlay correctly
- [ ] No errors in console

---

### ✅ TEST #6: Focus Mode

**Objective**: Removes distractions for optimal reading

**TEST #6A: Keyboard Shortcut**
1. Go to any article: `https://en.wikipedia.org/wiki/Artificial_intelligence`
2. Press: **Shift+Alt+F**
3. **Expected**: 
   - Overlay appears (text: "🎯 Mode focus activé!")
   - Focus button (🎯) in top-right turns green
   - Ads, sidebars, footers disappear
   - Content becomes full-width

**Verify**:
- [ ] Keyboard shortcut works
- [ ] Notification shows (fades after 2 seconds)
- [ ] Ads/sidebars hidden
- [ ] Content readable and full-width
- [ ] Can still scroll and select text

**TEST #6B: Button Click**
1. Go to any article
2. Look for 🎯 button near reading time badge (top-right)
3. Click the 🎯 button
4. **Expected**: Same effects as keyboard shortcut

**Verify**:
- [ ] Button color changes (purple → green)
- [ ] Distractions hidden
- [ ] Notification appears

**TEST #6C: Toggle Off**
1. Press **Shift+Alt+F** again (or click 🎯 button again)
2. **Expected**:
   - Overlay appears (text: "Mode focus désactivé")
   - Button returns to purple
   - Ads/sidebars reappear
   - Layout returns to normal

**Verify**:
- [ ] Can toggle on/off multiple times
- [ ] No visual glitches
- [ ] Page fully restored

---

### ✅ TEST #7: Settings Persistence

**Objective**: Verify all feature toggles save correctly

**Test Steps**:
1. Open popup (click extension icon)
2. Go to "🎨 Apparence" section
3. Toggle each feature OFF:
   - [ ] AI Detector
   - [ ] Smart Summarizer
   - [ ] Translator
   - [ ] Cookie Blocker
   - [ ] Reading Time (NEW)
   - [ ] Page Stats (NEW)
4. Reload page (Ctrl+R)
5. **Expected**: Features remain disabled after reload

**Verify**:
- [ ] Settings persist across tabs
- [ ] Settings persist across sessions
- [ ] Checkboxes reflect saved state

---

### ✅ TEST #8: Cross-Tab Synchronization

**Objective**: Verify settings sync across all tabs

**Test Steps**:
1. Open TWO tabs, both with extension active
2. In Tab 1, open popup and toggle "Reading Time" OFF
3. In Tab 2, watch the feature immediately disappear
4. Reload Tab 2
5. **Expected**: Reading time still disabled

**Verify**:
- [ ] Settings change in one tab affects others instantly
- [ ] No refresh needed for sync
- [ ] Settings persist after reload

---

## Performance Testing

### Benchmark Tests

**TEST: Page Load Impact**
1. Open DevTools → Lighthouse
2. Run performance audit on Wikipedia
3. Note metrics
4. Temporarily disable extension
5. Run audit again
6. **Expected**: <5% performance hit

**TEST: Memory Usage**
1. Open multiple tabs with different content types
2. DevTools → Memory → Heap snapshot
3. **Expected**: Extension uses <10MB total

**TEST: CPU Usage**
1. Monitor DevTools → Performance tab
2. Scroll through article while recording
3. **Expected**: <5% CPU during idle, <15% while interacting

---

## Edge Cases & Stress Tests

### Browser Features

**TEST: Different Languages**
- [ ] Works on French pages (e.g., lemonde.fr)
- [ ] Works on Spanish pages (e.g., elpais.com)
- [ ] Works on German pages (e.g., spiegel.de)
- [ ] Works on Chinese pages (e.g., ifeng.com)

**TEST: Single Page Applications**
- [ ] Works on Reddit (SPA)
- [ ] Works on Gmail (SPA)
- [ ] Works on Twitter/X (SPA)
- Cookie blocker detects new popups on navigation

**TEST: Different Content Types**
- [ ] Blogs (long text)
- [ ] Wikis (structured)
- [ ] News sites (media-heavy)
- [ ] E-commerce (product pages - short)
- [ ] Forums (many small elements)

**TEST: Browser Extensions Compatibility**
- [ ] Works with Adblock Plus enabled
- [ ] Works with Ublock Origin enabled
- [ ] Works with Grammarly enabled
- [ ] No conflicts with other extensions

---

## Browser Compatibility

### Chrome Versions
- [ ] Chrome 120+
- [ ] Chromium-based (Edge, Brave, Vivaldi)
- [ ] Manifest V3 compliant

### Known Limitations
- [ ] Focus mode may not hide all custom-styled ads
- [ ] Some SPAs need page reload for stats update
- [ ] Translation takes 2-3 seconds for large texts
- [ ] Cookie blocker depends on popup markup standards

---

## Debugging Tips

### Console Debugging
```javascript
// Check which features are enabled
console.log('Settings:', extensionSettings);

// Manually trigger features
initReadingTime();
initQuickStats();
initFocusMode();

// Check storage
chrome.storage.local.get(null, (data) => console.log(data));

// Clear storage
chrome.storage.local.clear(() => console.log('Cleared'));
```

### Common Issues

**Issue**: Summarizer button not appearing
```
Solution:
1. Check page has 800+ words: 
   document.body.innerText.length
2. Verify feature enabled: 
   extensionSettings.summarizerEnabled
3. Check DevTools for errors
```

**Issue**: Translation showing blank
```
Solution:
1. Check internet connection
2. Try different language pair  
3. Test MyMemory API directly
4. Check Reverso API as fallback
```

**Issue**: Focus mode not hiding elements
```
Solution:
1. Check CSS is applied:
   document.getElementById('aitools-focus-mode-styles')
2. Verify element selectors match page markup
3. Inspect element to find proper selector
4. Report custom markup patterns
```

---

## Sign-Off Checklist

Before marking as "Ready for Production":

- [ ] All 8 core tests PASSED
- [ ] No console errors on any test page
- [ ] Settings persist across sessions  
- [ ] Cross-tab sync working
- [ ] Performance acceptable (<5% impact)
- [ ] Edge cases handled gracefully
- [ ] Backward compatibility maintained
- [ ] Documentation updated

---

## Test Results Tracking

Date Tested: ___________
Tester: ___________

| Feature | Status | Notes |
|---------|--------|-------|
| Translation API | [ ] Pass [ ] Fail | |
| Summarizer Visibility | [ ] Pass [ ] Fail | |
| Reading Time | [ ] Pass [ ] Fail | |
| Quick Stats | [ ] Pass [ ] Fail | |
| Cookie Blocker | [ ] Pass [ ] Fail | |
| Focus Mode | [ ] Pass [ ] Fail | |
| Settings Persist | [ ] Pass [ ] Fail | |
| Cross-Tab Sync | [ ] Pass [ ] Fail | |

**Overall Status**: [ ] Ready | [ ] Needs Fixes | [ ] Critical Issues

---

**Version**: 4.2.0 | **Last Updated**: 2024 | **Status**: Ready for QA ✅
