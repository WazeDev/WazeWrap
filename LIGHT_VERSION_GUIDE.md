# WazeWrap Light - User & Developer Guide

**Version:** 2025.04.06.00  
**Status:** Ready for feedback  
**Author:** JS55CT (for WazeDev WazeWrap)

---

## Overview

**WazeWrap Light** is a lightweight alternative to the full WazeWrap library, designed for scripts that only need `**alerts and script update monitoring**`. If your script only uses `WazeWrap.Alerts` and `WazeWrap.Alerts.ScriptUpdateMonitor`, Light is perfect!.

**Key Design Philosophy:** Same API surface, different implementations. Scripts write to `WazeWrap.*` regardless of which version loads.

---

## What is WazeWrap Light?

### Purpose

Light provides **alerts and script update monitoring** for any script that needs notifications, without requiring Waze internal APIs:

**Includes:**

- Alert notifications (toastr integration)
- Script update monitoring & dashboard
- Shared update notification display

**Does NOT include:**

- User information (use `sdk.State.getUserInfo()` directly)
- Utility helpers (use native JS)
- Map data access (Waze W object)
- OpenLayers dependencies

### Technical Approach

- **No external dependencies** on Waze internal APIs (w. or OL)
- **SDK-based** - uses WME SDK for UI (if the full version of WW is not loaded by another script!)

---

## Feature Comparison

### Supported in Both

| Feature                                      | Light | Full | Notes                    |
| -------------------------------------------- | ----- | ---- | ------------------------ |
| `WazeWrap.Alerts.info/warning/error/success` | ✓     | ✓    | Identical API            |
| `WazeWrap.Alerts.ScriptUpdateMonitor`        | ✓     | ✓    | Identical implementation |
| `WazeWrap.Alerts.confirm/prompt`             | ✓     | ✓    | Identical API            |
| `WazeWrap.Interface.ShowScriptUpdate()`      | ✓     | ✓    | Identical API            |


### Full Only (Not in Light)

| Feature               | Reason                                 |
| --------------------- | -------------------------------------- |
| `WazeWrap.Model.*`    | Requires W.model                       |
| `WazeWrap.Geometry.*` | Requires OpenLayers                    |
| `WazeWrap.Require.*`  | WME-specific                           |
| `WazeWrap.Events.*`   | WME-specific                           |
| `WazeWrap.User.*`     | Use `sdk.State.getUserInfo()` directly |
| `WazeWrap.String.*`   | Use native JavaScript                  |
| `WazeWrap.Util.*`     | Use native JavaScript or SDK           |
| `WazeWrap.Remote.*`   | Deprecated endpoint                    |

---

## API Reference

### Ready Flags

```javascript
// Check if Light is ready
if (WazeWrap.LightReady) {
  // Light features available
}

// Check if Full is ready
if (WazeWrap.Ready) {
  // Full features available
}

// Both can be true if both versions loaded
if (WazeWrap.Ready && WazeWrap.LightReady) {
  // Full version loaded and upgraded Light
}
```

### Alerts (Identical in Both)

```javascript
// Notifications
WazeWrap.Alerts.info(title, message);
WazeWrap.Alerts.warning(title, message);
WazeWrap.Alerts.error(title, message);
WazeWrap.Alerts.success(title, message);
WazeWrap.Alerts.debug(title, message);

// Interactive
WazeWrap.Alerts.confirm(title, message, okFn, cancelFn, okText, cancelText);
WazeWrap.Alerts.prompt(title, message, defaultText, okFn, cancelFn);

// Debug (console only)
WazeWrap.Alerts.debug(title, message);
```

### ScriptUpdateMonitor (Identical in Both)

```javascript
const monitor = new WazeWrap.Alerts.ScriptUpdateMonitor(
  'MyScript', // Script name
  '1.0.0', // Current version
  'https://.../*.user.js', // Download URL
  GM_xmlhttpRequest, // GM function reference
  'https://.../*.meta.js', // Optional: meta URL
  /@version\s+(.+)/i, // Optional: version regex
);

monitor.start(2, true); // Check every 2 hours, check immediately
monitor.stop(); // Stop checking
```

### ShowScriptUpdate (Identical in Both)

```javascript
// Show script update in dashboard
WazeWrap.Interface.ShowScriptUpdate(
  scriptName, // String: "My Script"
  version, // String: "1.0.0"
  updateHTML, // HTML string with release notes
  greasyforkLink, // Optional: URL to Greasyfork
  forumLink, // Optional: URL to forum discussion
);
```
---

## Script Writer Migration Guide

### Use Light Directly

The simplest way to use Light in your script:

```javascript
// @require ..../WazeWrapLight.js

(function () {
  'use strict';

  // Wait for WazeWrap Light to initialize
  function waitForLight() {
    if (WazeWrap?.LightReady) {
      // Ready to use alerts and update monitoring
      WazeWrap.Alerts.info('My Script', 'Ready to notify!');
      WazeWrap.Alerts.success('Success', 'Script initialized');

      // Optional: Monitor for script updates
      const monitor = new WazeWrap.Alerts.ScriptUpdateMonitor(
        'My Script',
        '1.0.0',
        'https://greasyfork.org/scripts/.../.user.js',
        GM_xmlhttpRequest
      );
      monitor.start();
    } else {
      // Not ready yet, check again in 100ms
      setTimeout(waitForLight, 100);
    }
  }

  waitForLight();
})();
```

---

## Coexistence (Light and Full) & Load Order

### How It Works

Both versions intelligently coexist without duplication:

1. **Light loader starts** (if script @requires it)
   - Waits up to 2 seconds for Full to load
   - Checks for `WazeWrap.Ready` every 100ms

2. **If Full loads within 2 seconds:**
   - Light detects `WazeWrap.Ready = true`
   - Light sets `WazeWrap.LightReady = true` (as stub)
   - Light does NOT load library or create tab
   - Script gets `WazeWrap.Alerts` etc. from Full
   - Result: **1 tab (WW)** in UI

3. **If Full doesn't load after 2 seconds:**
   - Light loads its own library
   - Creates "WazeWrap Light" (WWL) tab
   - Initializes Alerts, Interface modules
   - Result: **1 tab (WWL)** in UI

4. **Scripts detect** which versions are available:
   ```javascript
   if (WazeWrap.Ready) {
     /* Full features available */
   }
   if (WazeWrap.LightReady) {
     /* Light features available (may be from Full) */
   }
   ```

### Load Order Scenarios

#### Scenario A: Light Only

```
Light loads → checks 50 times over 2 seconds for Full
Full never detected → loads WazeWrapLightLib.js
Sets WazeWrap.LightReady = true
Creates "WazeWrap Light" (WWL) tab
Script checks: if (WazeWrap.LightReady) → proceed
Result: 1 tab (WWL) in UI
```

#### Scenario B: Full Only

```
Full loads → WazeWrap.Ready = true
Creates "WazeWrap" (WW) tab
Script checks: if (WazeWrap.Ready) → proceed
Result: 1 tab (WW) in UI
```

#### Scenario C: Light then Full (Most Common)

```
Light loads → starts 2-second wait for Full (checks every 100ms)
Full loads → WazeWrap.Ready = true (from another script)
Light detects Ready = true → sets LightReady = true and exits
Result: Only 1 tab (WW) created by Full
Light never loads its library
```

#### Scenario D: Full then Light

```
Full loads → WazeWrap.Ready = true
Creates "WazeWrap" (WW) tab
Light loads → checks for WazeWrap.Ready
Light detects Full immediately (no wait needed)
Sets WazeWrap.LightReady = true (as stub)
Result: Only 1 tab (WW) in UI
Both flags available: WazeWrap.Ready = true, WazeWrap.LightReady = true
```

#### Scenario E: Multiple Scripts Using Light (No Full Present)

```
Script 1 loads Light → waits 2 seconds, Full never detected
  → loads WazeWrapLightLib.js
  → creates "WazeWrap Light" (WWL) tab
  → WazeWrap.LightReady = true
Script 2 loads Light → waits 2 seconds, Full never detected
  → tries to load WazeWrapLightLib.js (already loaded by Script 1)
  → WazeWrap.LightReady already true, exits
Script 3 loads Light → same as Script 2
Result: 1 tab (WWL) shared by all 3 scripts
All 3 use same WazeWrap.Alerts and dashboard
```

### UI Tabs

- **Full version creates** "WazeWrap" (WW) tab
- **Light version creates** "WazeWrap Light" (WWL) tab
- **Typically one tab appears:**
  - WW if Full loads within 2 seconds (Light detects it and exits)
  - WWL if Full never loads or loads after 2 seconds
- **Settings persist** via shared localStorage between both versions

---

## FAQ

### Q: Why is Light so minimal?

**A:** Alerts and update monitoring only. Use the SDK for everything else.

### Q: Why the 2-second wait?

**A:** Light checks for Full to avoid duplicate tabs. If Full loads within 2 seconds, Light exits as a stub. If not, Light loads independently.

### Q: Are the APIs identical?

**A:** For overlapping features, yes. Same method signatures, same behavior. Light just doesn't expose Full-only modules (Model, Geometry, etc.).

### Q: What do the Ready flags mean?

**A:** `WazeWrap.LightReady` = Light ready. `WazeWrap.Ready` = Full ready. Check whichever you're using.

---

## For Developers

### Key Design Decisions

- **Separate Ready flags** - `WazeWrap.LightReady` (Light) and `WazeWrap.Ready` (Full) for feature detection
- **No Remote/User modules** - Scripts use SDK or localStorage directly
- **Shared localStorage** - Both versions read/write same keys for seamless coexistence
- **Shared dashboard** - Alerts and settings use same DOM elements

### Files

- **WazeWrapLight.js** - Loader (~115 lines): detects Full within 2 seconds, then loads library or exits as stub
- **WazeWrapLightLib.js** - Library (~600 lines): Alerts, ScriptUpdateMonitor, Settings, Interface
