# WazeWrap v3.0

**Lightweight alerts and script update monitoring for Waze Map Editor (WME) scripts**

---

## Features

✨ **Alert System** — Display user-friendly notifications with multiple levels  
🔔 **Script Update Monitoring** — Automatically check for and notify users of script updates  
📊 **Update Dashboard** — Beautiful modal showing available script updates  
⚙️ **Settings Tab** — Customize alert visibility and preferences in WME sidebar  
💾 **Persistent History** — Remember alert history and settings across sessions

---

## Quick Start

### 1. Add to Your Script

In your Tampermonkey script header:

```javascript
// @require https://wazedev.github.io/WazeWrap/WazeWrap.js
```

### 2. Wait for Initialization

```javascript
// Wait for WazeWrap to be ready
function waitForWazeWrap(callback, tries = 0) {
  if (typeof WazeWrap !== 'undefined' && WazeWrap.Ready) {
    callback();
  } else if (tries < 100) {
    setTimeout(() => waitForWazeWrap(callback, tries + 1), 100);
  }
}

waitForWazeWrap(() => {
  // Your script code here
  WazeWrap.Alerts.success('MyScript', 'Script initialized!');
});
```

### 3. Use the API

```javascript
// Show alerts
WazeWrap.Alerts.info('MyScript', 'Information message');
WazeWrap.Alerts.warning('MyScript', 'Warning message');
WazeWrap.Alerts.error('MyScript', 'Error message');
WazeWrap.Alerts.success('MyScript', 'Success message');

// Show confirmation dialog
WazeWrap.Alerts.confirm(
  'MyScript',
  'Are you sure?',
  () => {
    console.log('OK clicked');
  },
  () => {
    console.log('Cancel clicked');
  },
);

// Monitor for script updates
const updateMonitor = new WazeWrap.Alerts.ScriptUpdateMonitor('MyScript', '1.0.0', 'https://greasyfork.org/scripts/12345/my-script.user.js', GM_xmlhttpRequest);
updateMonitor.start(2); // Check every 2 hours
```

---

## API Reference

### Alerts

#### `WazeWrap.Alerts.info(title, message, [disableTimeout, disableClickToClose, timeOut])`

Display an info notification.

```javascript
WazeWrap.Alerts.info('MyScript', 'Processing complete');
WazeWrap.Alerts.info('MyScript', 'Click to dismiss', false, true); // No auto-dismiss
```

#### `WazeWrap.Alerts.warning(title, message)`

Display a warning notification.

```javascript
WazeWrap.Alerts.warning('MyScript', 'Invalid input');
```

#### `WazeWrap.Alerts.error(title, message)`

Display an error notification.

```javascript
WazeWrap.Alerts.error('MyScript', 'Failed to load data');
```

#### `WazeWrap.Alerts.success(title, message)`

Display a success notification.

```javascript
WazeWrap.Alerts.success('MyScript', 'Changes saved!');
```

#### `WazeWrap.Alerts.debug(title, message)`

Display a debug notification (minimal styling).

```javascript
WazeWrap.Alerts.debug('MyScript', 'Debug info: ' + JSON.stringify(data));
```

#### `WazeWrap.Alerts.confirm(title, message, okFn, cancelFn, [okText, cancelText])`

Display a confirmation dialog.

```javascript
WazeWrap.Alerts.confirm(
  'MyScript',
  'Delete item?',
  () => deleteItem(),
  () => console.log('Cancelled'),
  'Delete',
  'Cancel',
);
```

#### `WazeWrap.Alerts.prompt(title, message, [defaultText, okFn, cancelFn])`

Display a text input dialog.

```javascript
WazeWrap.Alerts.prompt(
  'MyScript',
  'Enter your name:',
  'Default Name',
  (text) => console.log('User entered: ' + text),
  () => console.log('Cancelled'),
);
```

### Script Update Monitoring

#### `new WazeWrap.Alerts.ScriptUpdateMonitor(scriptName, version, downloadUrl, GM_xmlhttpRequest, [metaUrl, metaRegExp])`

Create a monitor to check for script updates.

**Parameters:**

- `scriptName` (string) — Display name of your script
- `version` (string/number) — Current installed version
- `downloadUrl` (string) — URL to `.user.js` file (for Greasy Fork)
- `GM_xmlhttpRequest` (function) — Reference to `GM_xmlhttpRequest` from your script
- `metaUrl` (string, optional) — URL to metadata file with version info
- `metaRegExp` (RegExp, optional) — Regex to extract version (default: `/@version\s+(.+)/i`)

**Methods:**

```javascript
const monitor = new WazeWrap.Alerts.ScriptUpdateMonitor('MyScript', '1.0.0', 'https://greasyfork.org/scripts/12345/my-script.user.js', GM_xmlhttpRequest);

// Start checking every 2 hours (default), immediately check first (default)
monitor.start(2, true);

// Stop checking
monitor.stop();
```

### Interface

#### `WazeWrap.Interface.ShowScriptUpdate(scriptName, version, updateHTML, [greasyforkLink, forumLink])`

Display the script update dashboard with custom HTML.

```javascript
WazeWrap.Interface.ShowScriptUpdate(
  'MyScript',
  '2.0.0',
  '<h4>New Features</h4><ul><li>Feature 1</li><li>Feature 2</li></ul>',
  'https://greasyfork.org/scripts/12345/my-script',
  'https://forum.waze.com/...',
);
```

---

## Status Flag

Check if WazeWrap is ready:

```javascript
if (WazeWrap.Ready) {
  // WazeWrap is fully initialized
  WazeWrap.Alerts.info('MyScript', 'Ready!');
}
```

---

## Examples

### Example 1: Simple Alert

```javascript
// @require https://wazedev.github.io/WazeWrap/WazeWrap.js

function init() {
  WazeWrap.Alerts.success('MyScript', 'Hello, WME!');
}

if (typeof WazeWrap !== 'undefined' && WazeWrap.Ready) {
  init();
} else {
  setTimeout(init, 1000);
}
```

### Example 2: Update Monitor

```javascript
// @require https://wazedev.github.io/WazeWrap/WazeWrap.js
// @grant GM_xmlhttpRequest

function init() {
  const updateMonitor = new WazeWrap.Alerts.ScriptUpdateMonitor('MyScript', GM_info.script.version, 'https://greasyfork.org/scripts/12345/my-script.user.js', GM_xmlhttpRequest);
  updateMonitor.start(2); // Check every 2 hours
}

function waitForWazeWrap(tries = 0) {
  if (typeof WazeWrap !== 'undefined' && WazeWrap.Ready) {
    init();
  } else if (tries < 100) {
    setTimeout(() => waitForWazeWrap(tries + 1), 100);
  }
}

waitForWazeWrap();
```

### Example 3: User Confirmation

```javascript
// @require https://wazedev.github.io/WazeWrap/WazeWrap.js

function init() {
  WazeWrap.Alerts.confirm(
    'MyScript',
    'Apply changes to 50 segments?',
    () => {
      applyChanges();
      WazeWrap.Alerts.success('MyScript', 'Changes applied!');
    },
    () => {
      WazeWrap.Alerts.info('MyScript', 'Cancelled');
    },
    'Apply',
    'Cancel',
  );
}

function waitForWazeWrap(tries = 0) {
  if (typeof WazeWrap !== 'undefined' && WazeWrap.Ready) {
    init();
  } else if (tries < 100) {
    setTimeout(() => waitForWazeWrap(tries + 1), 100);
  }
}

waitForWazeWrap();
```
