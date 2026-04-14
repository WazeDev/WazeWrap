# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Overview

**WazeWrap v3.0** is a lightweight JavaScript library for Waze Map Editor (WME) scripts, focused on alerts and script update monitoring.

- **WazeWrap.js** — Loader (~65 lines)
- **WazeWrapLib.js** — Library (~550 lines)

Consolidated from two versions into a single, streamlined distribution. For scripts needing map model access, use the WME SDK directly: `getWmeSdk({ scriptName, scriptId })`.

---

## Architecture: Single Standard Version

### Core Design

WazeWrap v3.0 is lightweight and dependency-free (beyond jQuery):

1. **Loader** (`WazeWrap.js`) waits for jQuery, then loads the library
2. **Library** (`WazeWrapLib.js`) initializes Alerts, Interface, and toastr integration
3. **Single ready flag:** `WazeWrap.Ready = true` when initialized

### Key Files

| File | Purpose | Size | Dependencies |
|------|---------|------|--------------|
| `WazeWrap.js` | Standard loader | ~65 lines | jQuery |
| `WazeWrapLib.js` | Standard library | ~550 lines | WME SDK, jQuery, toastr |
| `toastr.js` | Toast notification library | External | CSS file at same host |

---

## API

### Supported Features

```javascript
// Alerts
WazeWrap.Alerts.info(title, message, disableTimeout, disableClickToClose, timeOut)
WazeWrap.Alerts.warning(title, message)
WazeWrap.Alerts.error(title, message)
WazeWrap.Alerts.success(title, message)
WazeWrap.Alerts.debug(title, message)
WazeWrap.Alerts.confirm(title, msg, okFn, cancelFn, okText, cancelText)
WazeWrap.Alerts.prompt(title, msg, defaultText, okFn, cancelFn)

// Script Update Monitoring
WazeWrap.Alerts.ScriptUpdateMonitor (class)

// Interface
WazeWrap.Interface.ShowScriptUpdate(scriptName, version, html, gfLink, forumLink)

// Ready Flag
WazeWrap.Ready  // true when initialized
```

### Removed Features (v2.x)

Scripts using these modules must migrate to WME SDK or use alternatives:

- `WazeWrap.Model.*` — Use `getWmeSdk().DataModel.*` instead
- `WazeWrap.Geometry.*` — Use Turf.js or WME SDK geometry methods
- `WazeWrap.Require.*` — Use native script loading or bundlers
- `WazeWrap.Events.*` — Use `getWmeSdk().Events.*` instead
- `WazeWrap.User.*` — Use `getWmeSdk().User.*` instead
- `WazeWrap.String.*` — Use native JavaScript string methods
- `WazeWrap.Util.*` — Use native JavaScript utilities
- `WazeWrap.Remote.*` — Use fetch API or Axios

See **MIGRATION_GUIDE.md** for detailed upgrade instructions.

---

## Code Patterns

### Module Structure

Modules are constructor functions instantiated during init:

```javascript
function Alerts() {
  this.success = function (scriptName, message) { /* ... */ };
  this.info = function (scriptName, message, disableTimeout, disableClickToClose, timeOut) { /* ... */ };
  // ... other methods
  this.ScriptUpdateMonitor = class { /* ... */ };
}

// Instantiated during init:
WazeWrap.Alerts = new Alerts();
WazeWrap.Interface = new Interface();
```

### Bootstrap Pattern

Loader waits for jQuery before initializing:

```javascript
function bootstrap(tries = 1) {
  if (typeof $ !== 'undefined') {
    init();
  } else if (tries < 1000) {
    setTimeout(() => bootstrap(tries + 1), 100);
  }
}
bootstrap();
```

### Tampermonkey Sandbox Handling

Handles both sandboxed (Tampermonkey) and unsandboxed contexts:

```javascript
const sandboxed = typeof unsafeWindow !== 'undefined';
const pageWindow = sandboxed ? unsafeWindow : window;

pageWindow.WazeWrap = WazeWrap;
if (sandboxed) window.WazeWrap = pageWindow.WazeWrap;
```

### Settings Persistence

Uses `localStorage` with shared keys:
- `"WWToastr"` — Toast notification settings (position, visibility, history)
- `"WWScriptUpdate"` — Script update history (which versions user has seen)
- `"_wazewrap_settings"` — WazeWrap UI settings (show alert history)

---

## Toastr Integration

Toastr is loaded from GitHub Pages via:
```javascript
https://{REPO}.github.io/WazeWrap/toastr.js
https://{REPO}.github.io/WazeWrap/toastr.css
```

The `REPO` variable in the loader points to the repository hosting the library:
- **Production:** `REPO = 'wazedev'`
- **Testing:** `REPO = 'JS55CT'` (for development/testing)

---

## Git Workflow

### Remotes

```
origin   → https://github.com/JS55CT/WazeWrap.git (your fork)
upstream → https://github.com/WazeDev/WazeWrap.git (main repo)
```

### Branch Strategy

- **master** — Stable code ready for upstream (WazeDev) merge
- Feature branches — For experimental work before merging to master

### Before Creating PR

1. Ensure your feature branch is clean: `git log --oneline origin/upstream/master..HEAD`
2. Squash related commits if multiple changes belong together
3. Write clear commit messages explaining *why* the change was needed
4. Test alert and update monitor features in WME context

---

## Development Notes

### Dashboard UI Elements

WazeWrap injects UI into these containers:
- `#WWSU-Container` — Script Update dashboard
- `.WWAlertsHistory` — Alert history icon, top-left
- `#toast-container-wazedev` — Toastr notifications

All elements share the same DOM space; avoid ID collisions if extending the UI.

### Settings Tab

The WazeWrap settings tab is registered via WME SDK `Sidebar.registerScriptTab()` with script ID `"WW"`. It displays:
- Version number (v3.0)
- Checkbox: "Show alerts history" (toggles `.WWAlertsHistory` visibility)

---

## Common Tasks

### Adding a New Alert Method

1. Add to `Alerts()` function in `WazeWrapLib.js`
2. Follow existing pattern: `this.methodName = function(scriptName, message, ...args) { /* use wazedevtoastr */ }`
3. Test in WME context

### Modifying Dashboard CSS

1. Update `injectCSS()` function in `WazeWrapLib.js`
2. Verify styles don't conflict with WME editor CSS
3. Test in WME context

### Changing toastr Hosting

1. Update `REPO` variable in `WazeWrap.js`
2. Ensure CSS and JS are hosted at the same location: `https://{REPO}.github.io/WazeWrap/`
3. Test toastr notifications load correctly

---

## Testing Patterns

### Manual Testing

1. **In WME** — Add `WazeWrap.js` to a test script; verify alerts and dashboard appear
2. **Alert history** — Trigger multiple alerts; verify they appear in `.WWAlertsHistory`
3. **Settings toggle** — Click checkbox to toggle alert history visibility
4. **Update monitor** — Use `ScriptUpdateMonitor` to verify update detection

### Debugging Tips

- Check console for: `"WazeWrap: Loading library"` and `"WazeWrap initialized successfully"`
- Inspect `WazeWrap.Ready` flag in console: should be `true`
- Open DevTools → Application → Local Storage, search for `"WWToastr"`, `"WWScriptUpdate"`, `"_wazewrap_settings"` to verify persistence
- Draggable alert history: moves via jQuery UI; check console for load errors if dragging fails

---

## Version History

### v3.0.0 (2026-04-14)

**Major Consolidation Release**

- Removed Full version (Model, Geometry, Events, User, Remote, Require, Util, String modules)
- Consolidated to single lightweight version (~550 lines, down from ~2,400)
- Simplified loader (no Full detection logic)
- Only `WazeWrap.Ready` flag; no `LightReady`
- Focused on: Alerts, Script Update Monitoring, Update Dashboard
- Scripts needing map access should use WME SDK directly

**Breaking Changes:**
- All Full-only modules removed
- Scripts must migrate to WME SDK for W object features

**Migration:** See **MIGRATION_GUIDE.md**
